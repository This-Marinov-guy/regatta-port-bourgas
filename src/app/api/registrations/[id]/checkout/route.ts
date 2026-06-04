import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { calculateEventFeeCents, hasEventFee } from '@/lib/eventFees'
import {
  assertMyposConfigured,
  buildMyposPurchaseFields,
  buildMyposReturnUrls,
  centsToMyposAmount,
  createMyposOrderId,
  getMyposCheckoutEndpoint,
} from '@/lib/mypos/server'
import type { RegistrationPaymentData } from '@/types/admin'
import { normalizeLocale } from '@/lib/locale'

type CheckoutPayload = {
  session?: unknown
}

function getBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return new URL(request.url).origin.replace(/\/$/, '')
}

function buildCheckoutAmount(registration: Awaited<ReturnType<typeof getRegistrationWithEvent>>) {
  if (!hasEventFee(registration.event)) {
    throw new Error('This event does not require an entry fee.')
  }

  const crewCount = Math.max(registration.crew_list.length, 1)
  const unitAmount = Number(registration.event?.fee_amount_cents)
  const totalAmount = calculateEventFeeCents(registration.event, crewCount)

  return {
    crewCount,
    itemQuantity: registration.event?.fee_type === 'per_crew' ? crewCount : 1,
    unitAmount,
    totalAmount: Number(totalAmount),
    currency: 'eur',
  }
}

function isPaid(registration: Awaited<ReturnType<typeof getRegistrationWithEvent>>) {
  return (
    registration.payment_data?.mypos?.payment_status === 'paid' ||
    registration.payment_data?.stripe?.payment_status === 'paid'
  )
}

function getLocalizedFeeItemName(
  registration: Awaited<ReturnType<typeof getRegistrationWithEvent>>,
  locale: 'en' | 'bg'
) {
  const boat = `${registration.boat_name} | ${registration.sail_number}`

  return locale === 'bg'
    ? `${boat} - такса за участие`
    : `${boat} registration fee`
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function renderMyposCheckoutForm(args: {
  endpoint: string
  fields: Record<string, string | number>
}) {
  const inputs = Object.entries(args.fields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}">`
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redirecting to myPOS Checkout</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: sans-serif; background: #f8f3e8; color: #10243e; }
    main { max-width: 32rem; padding: 2rem; text-align: center; }
    button { border: 0; border-radius: 999px; padding: 0.85rem 1.25rem; background: #0057b8; color: white; font-weight: 700; cursor: pointer; }
  </style>
</head>
<body>
  <main>
    <h1>Redirecting to secure payment...</h1>
    <p>Please wait while we send you to myPOS Checkout.</p>
    <form id="mypos-checkout" method="post" action="${escapeHtml(args.endpoint)}">
      ${inputs}
      <noscript><button type="submit">Continue to payment</button></noscript>
    </form>
  </main>
  <script>document.getElementById('mypos-checkout').submit();</script>
</body>
</html>`
}

function renderMyposErrorPage() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Payment unavailable</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: sans-serif; background: #f8f3e8; color: #10243e; }
    main { max-width: 32rem; padding: 2rem; text-align: center; }
    a { color: #0057b8; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <h1>We couldn't start the payment</h1>
    <p>Something went wrong while opening the secure checkout. Please go back and try again, or contact the organisers if the problem continues.</p>
  </main>
</body>
</html>`
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertMyposConfigured()

    const { id } = await params
    const registration = await getRegistrationWithEvent(id)
    const currentMypos = registration.payment_data?.mypos
    const orderId = new URL(request.url).searchParams.get('orderId')

    if (!registration.event) {
      return new Response('Registration event not found.', { status: 400 })
    }

    if (!hasEventFee(registration.event)) {
      return new Response('This event does not require an entry fee.', { status: 400 })
    }

    if (isPaid(registration)) {
      return new Response('This registration has already been paid.', { status: 409 })
    }

    if (!orderId || currentMypos?.order_id !== orderId) {
      return new Response('Checkout session not found.', { status: 404 })
    }

    const baseUrl = getBaseUrl(request)
    const locale = normalizeLocale(registration.preferred_language)
    const { itemQuantity, unitAmount, totalAmount, currency } =
      buildCheckoutAmount(registration)
    const urls = buildMyposReturnUrls({
      baseUrl,
      locale,
      eventSlug: registration.event.slug,
      registrationId: registration.id,
    })
    const fields = buildMyposPurchaseFields({
      locale,
      amountCents: totalAmount,
      currency,
      orderId,
      okUrl: urls.okUrl,
      cancelUrl: urls.cancelUrl,
      notifyUrl: urls.notifyUrl,
      customerEmail: registration.contact_email,
      customerPhone: registration.contact_phone,
      customerName: registration.contact_name || registration.skipper_name,
      customerCountry: registration.country,
      itemName: getLocalizedFeeItemName(registration, locale),
      itemQuantity,
      itemUnitAmountCents: unitAmount,
      note: `${registration.boat_name} / ${registration.skipper_name}`,
    })

    return new Response(
      renderMyposCheckoutForm({
        endpoint: getMyposCheckoutEndpoint(),
        fields,
      }),
      {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-store',
        },
      }
    )
  } catch (error) {
    // Log the real reason for operators, but never expose it to the customer.
    console.error('myPOS checkout (GET) failed:', error)

    const isDisabled =
      error instanceof Error && error.message.includes('Payments are disabled')

    return new Response(renderMyposErrorPage(), {
      status: isDisabled ? 503 : 400,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = (await request.json().catch(() => ({}))) as CheckoutPayload
    const { id } = await params
    const session = typeof body.session === 'string' ? body.session : null
    const admin = session === id ? null : await getAdminUser()

    if (session !== id && !admin) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
    }

    assertMyposConfigured()

    const registration = await getRegistrationWithEvent(id)
    const locale = normalizeLocale(registration.preferred_language)

    if (!registration.event) {
      return NextResponse.json(
        { error: 'Unable to create checkout for a registration without an event.' },
        { status: 400 }
      )
    }

    if (!hasEventFee(registration.event)) {
      return NextResponse.json(
        { error: 'This event does not require an entry fee.' },
        { status: 400 }
      )
    }

    if (isPaid(registration)) {
      return NextResponse.json(
        { error: 'This registration has already been paid.', paid: true },
        { status: 409 }
      )
    }

    const { crewCount, unitAmount, totalAmount, currency } =
      buildCheckoutAmount(registration)
    const baseUrl = getBaseUrl(request)
    buildMyposReturnUrls({
      baseUrl,
      locale,
      eventSlug: registration.event.slug,
      registrationId: registration.id,
    })
    const orderId = createMyposOrderId(registration.id)
    const checkoutUrl = `${baseUrl}/api/registrations/${registration.id}/checkout?orderId=${encodeURIComponent(orderId)}`

    const nextPaymentData: RegistrationPaymentData = {
      ...(registration.payment_data && typeof registration.payment_data === 'object'
        ? registration.payment_data
        : {}),
      mypos: {
        order_id: orderId,
        checkout_url: checkoutUrl,
        provider_url: getMyposCheckoutEndpoint(),
        status: 'pending',
        payment_status: 'unpaid',
        method: 'regatta-fee',
        registration_id: registration.id,
        event_id: registration.event_id,
        customer_email: registration.contact_email,
        locale,
        crew_count: crewCount,
        unit_amount: unitAmount,
        total_amount: totalAmount,
        amount: centsToMyposAmount(totalAmount),
        currency,
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
          checkoutUrl,
          sessionId: orderId,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to create myPOS checkout.'
    const status = message.includes('Payments are disabled') ? 503 : 400

    return NextResponse.json(
      {
        error: message,
      },
      { status }
    )
  }
}
