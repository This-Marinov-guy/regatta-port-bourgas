import type Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { constructStripeWebhookEvent } from '@/lib/stripe/server'
import type { RegistrationPaymentData } from '@/types/admin'

export const runtime = 'nodejs'

type RegistrationPaymentRow = {
  id: string
  payment_data: RegistrationPaymentData
}

function getStripeMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string
) {
  const value = metadata?.[key]

  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function toIsoString(timestampInSeconds: number | null | undefined) {
  return typeof timestampInSeconds === 'number'
    ? new Date(timestampInSeconds * 1000).toISOString()
    : new Date().toISOString()
}

function buildUpdatedPaymentData(args: {
  current: RegistrationPaymentData
  session: Stripe.Checkout.Session
  registrationId: string
}) {
  const { current, session, registrationId } = args
  const existingStripe =
    current?.stripe && typeof current.stripe === 'object' ? current.stripe : {}

  const method = getStripeMetadataValue(session.metadata, 'method')
  const eventId = getStripeMetadataValue(session.metadata, 'event-id')
  const crewCountValue = getStripeMetadataValue(session.metadata, 'crew-count')
  const crewCount = crewCountValue ? Number(crewCountValue) : existingStripe.crew_count

  return {
    ...(current && typeof current === 'object' ? current : {}),
    stripe: {
      ...existingStripe,
      checkout_session_id: session.id,
      checkout_url: session.url ?? existingStripe.checkout_url ?? null,
      status: session.status,
      payment_status: session.payment_status,
      payment_intent_id:
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : existingStripe.payment_intent_id ?? null,
      method: method ?? existingStripe.method ?? null,
      registration_id: registrationId,
      event_id: eventId ?? existingStripe.event_id ?? null,
      customer_email:
        session.customer_details?.email ??
        session.customer_email ??
        existingStripe.customer_email ??
        null,
      crew_count: Number.isFinite(crewCount) ? crewCount : existingStripe.crew_count,
      total_amount: session.amount_total ?? existingStripe.total_amount,
      currency: session.currency ?? existingStripe.currency,
      created_at: existingStripe.created_at ?? toIsoString(session.created),
      completed_at:
        session.payment_status === 'paid'
          ? toIsoString(session.created)
          : existingStripe.completed_at,
    },
  } satisfies RegistrationPaymentData
}

async function updateRegistrationPayment(args: {
  registrationId: string
  session: Stripe.Checkout.Session
}) {
  const supabase = createSupabaseServiceClient()
  const { registrationId, session } = args

  const { data, error } = await supabase
    .from('registrations')
    .select('id, payment_data')
    .eq('id', registrationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  const registration = data as RegistrationPaymentRow
  const nextPaymentData = buildUpdatedPaymentData({
    current: registration.payment_data,
    session,
    registrationId,
  })

  const { error: updateError } = await supabase
    .from('registrations')
    .update({ payment_data: nextPaymentData })
    .eq('id', registrationId)

  if (updateError) {
    throw new Error(updateError.message)
  }
}

async function handleCheckoutSessionEvent(session: Stripe.Checkout.Session) {
  const method = getStripeMetadataValue(session.metadata, 'method')
  const registrationId =
    getStripeMetadataValue(session.metadata, 'registration-id') ?? session.client_reference_id

  if (method !== 'regatta-fee' || !registrationId) {
    return {
      ignored: true,
      reason: 'Unsupported checkout session metadata.',
    }
  }

  await updateRegistrationPayment({
    registrationId,
    session,
  })

  return {
    ignored: false,
    registrationId,
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature header.' },
      { status: 400 }
    )
  }

  const payload = await request.text()

  let event: Stripe.Event

  try {
    event = constructStripeWebhookEvent(payload, signature)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to verify Stripe webhook.',
      },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const result = await handleCheckoutSessionEvent(
          event.data.object as Stripe.Checkout.Session
        )

        return NextResponse.json({
          received: true,
          ...result,
        })
      }
      default:
        return NextResponse.json({
          received: true,
          ignored: true,
          type: event.type,
        })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to process Stripe webhook.',
      },
      { status: 500 }
    )
  }
}
