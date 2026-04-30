import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import {
  assertMyposConfigured,
  buildMyposPurchaseFields,
  buildMyposReturnUrls,
  centsToMyposAmount,
  createMyposOrderId,
  getMyposCheckoutEndpoint,
} from '@/lib/mypos/server'
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

function buildCheckoutAmount(registration: Awaited<ReturnType<typeof getRegistrationWithEvent>>) {
  const crewCount = Math.max(registration.crew_list.length, 1)
  const unitAmount = 5000

  return {
    crewCount,
    unitAmount,
    totalAmount: crewCount * unitAmount,
    currency: 'eur',
  }
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

    if (!orderId || currentMypos?.order_id !== orderId) {
      return new Response('Checkout session not found.', { status: 404 })
    }

    const baseUrl = getBaseUrl(request)
    const locale = normalizeLocale(currentMypos.locale ?? readLocaleFromRequest(request))
    const { crewCount, unitAmount, totalAmount, currency } =
      buildCheckoutAmount(registration)
    const urls = buildMyposReturnUrls({
      baseUrl,
      locale,
      eventSlug: registration.event.slug,
    })
    const fields = buildMyposPurchaseFields({
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
      itemName: `${registration.event.name_en} registration fee`,
      itemQuantity: crewCount,
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
    const message =
      error instanceof Error ? error.message : 'Unable to open myPOS checkout.'

    return new Response(
      message,
      { status: message.includes('Payments are disabled') ? 503 : 400 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertMyposConfigured()

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

    const { crewCount, unitAmount, totalAmount, currency } =
      buildCheckoutAmount(registration)
    const baseUrl = getBaseUrl(request)
    buildMyposReturnUrls({
      baseUrl,
      locale,
      eventSlug: registration.event.slug,
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
