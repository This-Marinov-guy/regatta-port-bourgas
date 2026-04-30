import { NextResponse } from 'next/server'
import { normalizeLocale } from '@/lib/locale'

function redirectToEvent(request: Request) {
  const url = new URL(request.url)
  const locale = normalizeLocale(url.searchParams.get('locale'))
  const eventSlug = url.searchParams.get('eventSlug')?.trim()

  if (!eventSlug) {
    return NextResponse.redirect(
      new URL(`/${locale}?payment=cancelled`, url.origin),
      303
    )
  }

  return NextResponse.redirect(
    new URL(
      `/${locale}/events/${encodeURIComponent(eventSlug)}?payment=cancelled`,
      url.origin
    ),
    303
  )
}

export function GET(request: Request) {
  return redirectToEvent(request)
}

export function POST(request: Request) {
  return redirectToEvent(request)
}
