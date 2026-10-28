import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import {
  DONATION_ORIGIN,
  donationBaseUrl,
  donationCorsHeaders,
  donationOrderId,
  parseDonationAmount,
  parseDonationRedirect,
} from '@/lib/donations'
import {
  assertMyposConfigured,
  assertMyposReturnUrl,
  getMyposCheckoutEndpoint,
} from '@/lib/mypos/server'

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

  if (amountCents === null) {
    return json({ error: 'amount must be a positive EUR amount with at most two decimal places (maximum 999999.99).' }, 400, origin)
  }
  if (!successUrl || !failureUrl) {
    return json({ error: 'successUrl and failureUrl, when supplied, must be HTTPS URLs on https://ycpb.netlify.app.' }, 400, origin)
  }
  if (note !== null && (typeof note !== 'string' || note.length > 500)) {
    return json({ error: 'note must be a string of at most 500 characters.' }, 400, origin)
  }

  try {
    assertMyposConfigured('donations')
    const baseUrl = donationBaseUrl(request)
    const id = randomUUID()
    const orderId = donationOrderId(id)
    const checkoutUrl = `${baseUrl}/api/donations/${id}/checkout`
    const statusUrl = `${baseUrl}/api/donations/${id}/status`
    assertMyposReturnUrl(`${baseUrl}/api/donations/${id}/return`)
    assertMyposReturnUrl(`${baseUrl}/api/mypos/webhook/checkout`)
    getMyposCheckoutEndpoint()

    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.from('donations').insert({
      id,
      amount_cents: amountCents,
      currency: 'EUR',
      note,
      success_url: successUrl,
      failure_url: failureUrl,
      order_id: orderId,
    })
    if (error) throw error

    return json({ donationId: id, checkoutUrl, statusUrl, status: 'pending', amount: (amountCents / 100).toFixed(2), currency: 'EUR' }, 201, origin)
  } catch (error) {
    console.error('Unable to create donation checkout:', error)
    const unavailable = error instanceof Error && error.message.includes('Payments are disabled')
    return json({ error: 'Donation checkout is unavailable.' }, unavailable ? 503 : 500, origin)
  }
}
