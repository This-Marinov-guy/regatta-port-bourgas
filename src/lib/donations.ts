export const DONATION_ORIGIN = 'https://ycpb.netlify.app'

export type DonationStatus = 'pending' | 'paid' | 'rolled_back'

export function normalizeDonationName(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function donationNameFromMyposFields(fields: Record<string, string>) {
  const name = normalizeDonationName(
    [fields.CustomerFirstNames, fields.CustomerFamilyName]
      .filter((part) => typeof part === 'string' && part.trim())
      .join(' ')
  )

  return name && name.length <= 200 && !/[\u0000-\u001f\u007f]/.test(name)
    ? name
    : null
}

export function donationCorsHeaders(origin: string | null): Record<string, string> {
  return origin === DONATION_ORIGIN
    ? {
        'Access-Control-Allow-Origin': DONATION_ORIGIN,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
      }
    : { Vary: 'Origin' }
}

export function parseDonationAmount(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const amount = String(value)
  const match = /^(\d{1,6})(?:\.(\d{1,2}))?$/.exec(amount)
  if (!match) return null
  const cents = Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
  return cents > 0 ? cents : null
}

export function parseDonationRedirect(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 2048) return null
  try {
    const url = new URL(value)
    if (url.origin !== DONATION_ORIGIN || url.username || url.password) return null
    return url.toString()
  } catch {
    return null
  }
}

export function donationOrderId(id: string) {
  return `don_${id}`
}

export function isDonationId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

export function donationIdFromOrderId(orderId: string) {
  return /^don_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(orderId)?.[1] ?? null
}

export function donationBaseUrl(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  return (configured || new URL(request.url).origin).replace(/\/$/, '')
}

export function donationCheckoutPage(endpoint: string, fields: Record<string, string | number>) {
  const escape = (value: string | number) => String(value)
    .replaceAll('&', '&amp;').replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const inputs = Object.entries(fields).map(([name, value]) =>
    `<input type="hidden" name="${escape(name)}" value="${escape(value)}">`
  ).join('')
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Opening checkout</title></head><body><p>Opening secure donation checkout…</p><form id="checkout" method="post" action="${escape(endpoint)}">${inputs}<button type="submit">Continue to payment</button></form><script>document.getElementById('checkout').submit()</script></body></html>`
}
