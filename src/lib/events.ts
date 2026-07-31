import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { AdminDocumentRecord, EventFeeType } from '@/types/admin'

export type DbEvent = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  description_en: string | null
  description_bg: string | null
  thumbnail_img: string | null
  status: 1 | 2 | 3
  start_date: string
  end_date: string
  documents: string[]
  notice_board: string[]
  results: string[]
  register_form: string[]
  fee_amount_cents: number | null
  fee_type: EventFeeType | null
  created_at: string
  updated_at: string
}

export type EventDocumentRecord = {
  id: string
  name_en: string
  name_bg: string | null
  source: string
  created_at: string | null
  general_use: boolean
}

function normalizeUrlArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value]
  }

  return []
}

function normalizeEvent(data: Record<string, unknown>): DbEvent {
  return {
    ...(data as unknown as DbEvent),
    documents: normalizeUrlArray(data.documents),
    notice_board: normalizeUrlArray(data.notice_board),
    results: normalizeUrlArray(data.results),
    register_form: normalizeUrlArray(data.register_form),
  }
}

export async function getEvents(): Promise<DbEvent[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch events:', error)
    return []
  }

  return (data ?? []).map((item) => normalizeEvent(item as Record<string, unknown>))
}

export async function getEvent(slug: string): Promise<DbEvent | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return normalizeEvent(data as Record<string, unknown>)
}

export async function getEventDocumentsByRefs(
  refs: string[]
): Promise<EventDocumentRecord[]> {
  const normalizedRefs = refs.filter((value) => typeof value === 'string' && value.trim())

  if (normalizedRefs.length === 0) {
    return []
  }

  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('documents')
    .select('id, name_en, name_bg, source, created_at, general_use')
    .in('id', normalizedRefs)

  if (error) {
    throw new Error(error.message)
  }

  const documentsById = new Map(
    ((data ?? []) as Pick<
      AdminDocumentRecord,
      'id' | 'name_en' | 'name_bg' | 'source' | 'created_at' | 'general_use'
    >[]).map((item) => [
      item.id,
      {
        id: item.id,
        name_en: item.name_en,
        name_bg: item.name_bg,
        source: item.source,
        created_at: item.created_at,
        general_use: item.general_use,
      } satisfies EventDocumentRecord,
    ])
  )

  return normalizedRefs
    .map((ref) => {
      const existing = documentsById.get(ref)

      if (existing) {
        return existing
      }

      // Legacy fallback for older event rows that still store raw URLs.
      return {
        id: ref,
        name_en: ref.split('/').pop()?.split('?')[0] || ref,
        name_bg: null,
        source: ref,
        created_at: null,
        general_use: false,
      } satisfies EventDocumentRecord
    })
}

const REGISTRATION_CUTOFF_TIME_ZONE = 'Europe/Sofia'
const REGISTRATION_CUTOFF_HOUR = 13

// Registration for an event stays open through the day after it starts,
// closing at 13:00 local (Bulgaria) time on that day.
function addDaysToDateOnly(dateOnly: string, days: number) {
  const [year, month, day] = dateOnly.split('-').map(Number)
  const utcMs = Date.UTC(year, month - 1, day) + days * 24 * 60 * 60 * 1000
  return new Date(utcMs).toISOString().slice(0, 10)
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    value('year'),
    value('month') - 1,
    value('day'),
    value('hour'),
    value('minute'),
    value('second')
  )

  return asUtc - date.getTime()
}

function zonedTimeToUtcMs(
  dateOnly: string,
  hour: number,
  minute: number,
  timeZone: string
) {
  const guessMs = Date.parse(
    `${dateOnly}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00.000Z`
  )
  const offsetMs = getTimeZoneOffsetMs(new Date(guessMs), timeZone)
  return guessMs - offsetMs
}

export function isEventRegistrationOpen(
  startDate: string,
  now = new Date()
) {
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  const cutoffDate = addDaysToDateOnly(startDate.slice(0, 10), 1)
  const cutoffMs = zonedTimeToUtcMs(
    cutoffDate,
    REGISTRATION_CUTOFF_HOUR,
    0,
    REGISTRATION_CUTOFF_TIME_ZONE
  )
  return now.getTime() < cutoffMs
}

export function hasPassedEventDayRegisterButtonCutoff(
  startDate: string,
  now = new Date()
) {
  const cutoff = Date.parse(`${startDate}T13:00:00.000Z`)

  if (!Number.isFinite(cutoff)) {
    return false
  }

  return now.getTime() >= cutoff
}
