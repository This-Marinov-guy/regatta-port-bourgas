import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { getStripeServerClient } from '@/lib/stripe/server'
import type { RegistrationPaymentData } from '@/types/admin'
import { normalizeLocale, readLocaleFromRequest } from '@/lib/locale'

type CheckoutPayload = {
  locale?: unknown
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return new URL(request.url).origin.replace(/\/$/, '')
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as CheckoutPayload
    const locale = normalizeLocale(body.locale ?? readLocaleFromRequest(request))
    const { id } = await params
    const registration = await getRegistrationWithEvent(id)

    if (!registration.event) {
      return NextResponse.json(
        { error: 'Unable to create checkout for a registration without an event.' },
        { status: 400 }
      )
    }

    const crewCount = Math.max(registration.crew_list.length, 1)
    const unitAmount = 5000
    const totalAmount = crewCount * unitAmount
    const baseUrl = getBaseUrl(request)
    const eventPath = `/${locale}/events/${registration.event.slug}`
    const stripe = getStripeServerClient()

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      client_reference_id: registration.id,
      customer_email: registration.contact_email,
      success_url: `${baseUrl}${eventPath}?payment=success`,
      cancel_url: `${baseUrl}${eventPath}?payment=cancelled`,
      metadata: {
        method: 'regatta-fee',
        'registration-id': registration.id,
        'event-id': registration.event_id,
        'crew-count': String(crewCount),
        locale,
      },
      payment_intent_data: {
        metadata: {
          method: 'regatta-fee',
          'registration-id': registration.id,
          'event-id': registration.event_id,
          'crew-count': String(crewCount),
          locale,
        },
      },
      line_items: [
        {
          quantity: crewCount,
          price_data: {
            currency: 'eur',
            unit_amount: unitAmount,
            product_data: {
              name: `${registration.event.name_en} registration fee`,
              description: `${registration.boat_name} / ${registration.skipper_name}`,
            },
          },
        },
      ],
    })

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.')
    }

    const nextPaymentData: RegistrationPaymentData = {
      ...(registration.payment_data && typeof registration.payment_data === 'object'
        ? registration.payment_data
        : {}),
      stripe: {
        checkout_session_id: session.id,
        checkout_url: session.url,
        status: session.status,
        payment_status: session.payment_status,
        payment_intent_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        method: 'regatta-fee',
        registration_id: registration.id,
        event_id: registration.event_id,
        customer_email: registration.contact_email,
        locale,
        crew_count: crewCount,
        unit_amount: unitAmount,
        total_amount: totalAmount,
        currency: 'eur',
        created_at: new Date().toISOString(),
      },
    }

    const supabase = createSupabaseServiceClient()
    const { error } = await supabase
      .from('registrations')
      .update({ payment_data: nextPaymentData })
      .eq('id', registration.id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json(
      {
        data: {
          checkoutUrl: session.url,
          sessionId: session.id,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to create Stripe checkout.',
      },
      { status: 400 }
    )
  }
}
