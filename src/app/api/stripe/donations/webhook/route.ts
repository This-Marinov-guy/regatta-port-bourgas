import { after } from 'next/server'
import type Stripe from 'stripe'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { isDonationId, normalizeDonationName } from '@/lib/donations'
import { getDonationStripe, getDonationWebhookSecret } from '@/lib/donations/stripe'
import { sendPaidDonationNotificationToAdmins } from '@/lib/donations/email'
import { recordFailedJob, resolveFailedJob } from '@/lib/failedJobs'

export const runtime = 'nodejs'

async function markDonationPaid(session: Stripe.Checkout.Session) {
  const id = session.client_reference_id
  if (!id || !isDonationId(id) || session.metadata?.donationId !== id ||
      session.mode !== 'payment' || session.payment_status !== 'paid' ||
      !session.payment_intent) {
    throw new Error('Stripe checkout session is not a paid donation.')
  }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase.from('donations')
    .select('id, amount_cents, currency, name, order_id, status')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  if (!data || data.order_id !== session.id ||
      data.amount_cents !== session.amount_total ||
      data.currency.toLowerCase() !== session.currency) {
    throw new Error('Stripe checkout session does not match the donation.')
  }

  const transactionRef = typeof session.payment_intent === 'string'
    ? session.payment_intent : session.payment_intent.id
  const { data: updated, error: updateError } = await supabase.from('donations')
    .update({
      status: 'paid',
      transaction_ref: transactionRef,
      paid_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('order_id', session.id)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle()
  if (updateError) throw updateError

  if (updated) {
    const payerName = session.customer_details?.name &&
      normalizeDonationName(session.customer_details.name)
    if (!data.name && payerName && payerName.length <= 200 &&
        !/[\u0000-\u001f\u007f]/.test(payerName)) {
      const { error: nameError } = await supabase.from('donations')
        .update({ name: payerName })
        .eq('id', id).eq('status', 'paid').is('name', null)
      if (nameError) console.error('Unable to save Stripe donation payer name:', nameError)
    }
  }

  return { id, becamePaid: updated !== null }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) return new Response('Missing Stripe signature.', { status: 400 })

  let event: Stripe.Event
  try {
    event = getDonationStripe().webhooks.constructEvent(
      await request.text(), signature, getDonationWebhookSecret()
    )
  } catch (error) {
    console.error('Invalid Stripe donation webhook:', error)
    return new Response('Invalid Stripe webhook.', { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed' ||
        event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.metadata?.donationId && session.payment_status === 'paid') {
        const result = await markDonationPaid(session)
        if (result.becamePaid) {
          after(async () => {
            try {
              await sendPaidDonationNotificationToAdmins(result.id)
            } catch (error) {
              console.error('Unable to send paid Stripe donation notification:', error)
            }
          })
        }
      }
    }

    await resolveFailedJob({ source: 'webhook', dedupeKey: `stripe:${event.id}` })
    return new Response('OK', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error) {
    console.error('Unable to process Stripe donation webhook:', error)
    await recordFailedJob({
      source: 'webhook',
      jobType: 'stripe.donations.notification',
      handler: 'POST /api/stripe/donations/webhook',
      dedupeKey: `stripe:${event.id}`,
      request: { event_id: event.id, event_type: event.type },
      response: { status_code: 500 },
      details: {},
      error,
    })
    return new Response('Unable to process Stripe webhook.', { status: 500 })
  }
}
