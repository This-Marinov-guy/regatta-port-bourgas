import type { EventFeeType } from '@/types/admin'

export type EventFee = {
  fee_amount_cents?: number | null
  fee_type?: EventFeeType | null
}

export function hasEventFee(event: EventFee | null | undefined) {
  return (
    Number.isInteger(event?.fee_amount_cents) &&
    Number(event?.fee_amount_cents) > 0 &&
    (event?.fee_type === 'per_crew' || event?.fee_type === 'total')
  )
}

export function calculateEventFeeCents(
  event: EventFee | null | undefined,
  crewMemberCount: number
) {
  if (!hasEventFee(event)) {
    return null
  }

  const amount = Number(event?.fee_amount_cents)
  const crewCount = Math.max(Math.floor(crewMemberCount), 1)

  return event?.fee_type === 'per_crew' ? amount * crewCount : amount
}

export function formatEventFee(
  event: EventFee,
  locale: string,
  perCrewLabel: string
) {
  if (!hasEventFee(event)) {
    return null
  }

  const amount = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(event.fee_amount_cents) / 100)

  return event.fee_type === 'per_crew' ? `${amount} ${perCrewLabel}` : amount
}
