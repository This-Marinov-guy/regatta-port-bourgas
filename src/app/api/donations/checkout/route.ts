import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import {
  DONATION_ORIGIN,
  donationBaseUrl,
  donationCorsHeaders,
  donationOrderId,
  normalizeDonationName,
  parseDonationAmount,
  parseDonationRedirect,
} from '@/lib/donations'
import {
  assertDonationStripeAccount,
  DONATION_TITLE,
  getDonationStripe,
  getDonationWebhookSecret,
} from '@/lib/donations/stripe'

export const runtime = 'nodejs'

function json(body: object, status: number, origin: string | null) {
  return NextResponse.json(body, {
    status,
    headers: { ...donationCorsHeaders(origin), 'Cache-Control': 'no-store' },
  })
}

export function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return new Response(null, {
    status: origin === DONATION_ORIGIN ? 204 : 403,
    headers: donationCorsHeaders(origin),
  })
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin')
  if (origin !== DONATION_ORIGIN) {
    return json({ error: 'Origin is not allowed.' }, 403, origin)
  }

  let body: Record<string, unknown>
  try {
    const raw = await request.text()
    if (raw.length > 8192) return json({ error: 'Request body is too large.' }, 413, origin)
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error()
    body = parsed as Record<string, unknown>
  } catch {
    return json({ error: 'A JSON object is required.' }, 400, origin)
  }

  const amountCents = parseDonationAmount(body.amount)
  const successUrl = parseDonationRedirect(body.successUrl === undefined
    ? `${DONATION_ORIGIN}/?donation=success` : body.successUrl)
  const failureUrl = parseDonationRedirect(body.failureUrl === undefined
    ? `${DONATION_ORIGIN}/?donation=failure` : body.failureUrl)
  const note = body.note === undefined || body.note === null ? null : body.note
  const rawName = body.name
  if (rawName !== undefined && rawName !== null && typeof rawName !== 'string') {
    return json({ error: 'name must be a string of at most 200 characters.' }, 400, origin)
  }
  const name = typeof rawName === 'string' ? normalizeDonationName(rawName) || null : null

  if (amountCents === null || amountCents < 50) {
    return json({ error: 'amount must be at least 0.50 EUR, with at most two decimal places (maximum 999999.99).' }, 400, origin)
  }
  if (!successUrl || !failureUrl) {
    return json({ error: 'successUrl and failureUrl, when supplied, must be HTTPS URLs on https://ycpb.netlify.app.' }, 400, origin)
  }
  if (note !== null && (typeof note !== 'string' || note.length > 500)) {
    return json({ error: 'note must be a string of at most 500 characters.' }, 400, origin)
  }
  if (name && (name.length > 200 || /[\u0000-\u001f\u007f]/.test(name))) {
    return json({ error: 'name must be a string of at most 200 characters.' }, 400, origin)
  }

  try {
    const stripe = getDonationStripe()
    getDonationWebhookSecret()
    await assertDonationStripeAccount(stripe)
    const baseUrl = donationBaseUrl(request)
    const id = randomUUID()
    const orderId = donationOrderId(id)
    const checkoutUrl = `${baseUrl}/api/donations/${id}/checkout`
    const statusUrl = `${baseUrl}/api/donations/${id}/status`

    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.from('donations').insert({
      id,
      amount_cents: amountCents,
      currency: 'EUR',
      name,
      note,
      success_url: successUrl,
      failure_url: failureUrl,
      order_id: orderId,
    })
    if (error) throw error

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'bg',
      client_reference_id: id,
      metadata: { donationId: id },
      payment_intent_data: {
        description: DONATION_TITLE,
        metadata: { donationId: id },
      },
      line_items: [{
        price_data: {
          currency: 'eur',
          unit_amount: amountCents,
          product_data: { name: DONATION_TITLE },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/api/donations/${id}/return?result=success`,
      cancel_url: `${baseUrl}/api/donations/${id}/return?result=failure`,
    }, { idempotencyKey: `donation-checkout-${id}` })

    if (!session.url || session.amount_total !== amountCents || session.currency !== 'eur') {
      throw new Error('Stripe returned an invalid donation checkout session.')
    }

    const { data: updated, error: updateError } = await supabase.from('donations')
      .update({ order_id: session.id })
      .eq('id', id)
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()
    if (updateError) throw updateError
    if (!updated) throw new Error('Unable to associate Stripe checkout with the donation.')

    return json({ donationId: id, checkoutUrl, statusUrl, status: 'pending', amount: (amountCents / 100).toFixed(2), currency: 'EUR' }, 201, origin)
  } catch (error) {
    console.error('Unable to create donation checkout:', error)
    const unavailable = error instanceof Error &&
      (error.message.includes('is not configured') || error.message.includes('wrong account'))
    return json({ error: 'Donation checkout is unavailable.' }, unavailable ? 503 : 500, origin)
  }
}
