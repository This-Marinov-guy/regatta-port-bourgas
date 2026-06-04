import { NextResponse } from 'next/server'
import { normalizeLocale } from '@/lib/locale'

function redirectToEvent(request: Request, payment: 'success' | 'cancelled') {
  const url = new URL(request.url)
  const locale = normalizeLocale(url.searchParams.get('locale'))
  const eventSlug = url.searchParams.get('eventSlug')?.trim()
  const registrationId = url.searchParams.get('registrationId')?.trim()

  if (registrationId) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/payment/${encodeURIComponent(registrationId)}?session=${encodeURIComponent(registrationId)}&payment=${payment}`,
        url.origin
      ),
      303
    )
  }

  if (!eventSlug) {
    return NextResponse.redirect(new URL(`/${locale}?payment=${payment}`, url.origin), 303)
  }

  return NextResponse.redirect(
    new URL(
      `/${locale}/events/${encodeURIComponent(eventSlug)}?payment=${payment}`,
      url.origin
    ),
    303
  )
}

export function GET(request: Request) {
  return redirectToEvent(request, 'success')
}

export function POST(request: Request) {
  return redirectToEvent(request, 'success')
}
