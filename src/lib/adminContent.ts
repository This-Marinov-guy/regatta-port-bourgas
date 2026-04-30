import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { extractNewsAttachmentUrls } from '@/lib/newsAttachments'
import { ensureSlug, slugify } from '@/lib/slug'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { sendRegistrationStatusEmail } from '@/lib/registrations/email'
import type {
  AdminDocumentPayload,
  AdminDocumentRecord,
  AdminEventPayload,
  AdminEventRecord,
  AdminNewsPayload,
  AdminNewsRecord,
  EventStatus,
  NewsStatus,
  RegistrationPaymentData,
  RegistrationRecord
} from '@/types/admin'

function normalizeRequiredText(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeSlug(value: unknown, fallbackSource: unknown, entityName: string) {
  const raw = typeof value === 'string' ? value.trim() : ''
  const fallback =
    typeof fallbackSource === 'string' ? ensureSlug(fallbackSource, entityName) : entityName
  const normalized = raw ? slugify(raw) : fallback

  if (!normalized) {
    throw new Error('Slug is required.')
  }

  return normalized
}

function normalizeDate(value: unknown, fieldName: string) {
  const date = normalizeRequiredText(value, fieldName)

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${fieldName} must be a valid date in YYYY-MM-DD format.`)
  }

  return date
}

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function normalizeBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function stripHtmlToText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildNewsExcerptFromBody(value: string, maxLength = 180) {
  const plainText = stripHtmlToText(value)

  if (plainText.length <= maxLength) {
    return plainText || null
  }

  return `${plainText.slice(0, maxLength).trimEnd()}...`
}

function normalizeStatus(value: unknown): EventStatus {
  const status = Number(value)

  if (status !== 1 && status !== 2 && status !== 3) {
    throw new Error('Status must be 1, 2, or 3.')
  }

  return status
}

function normalizeNewsStatus(value: unknown): NewsStatus {
  return normalizeStatus(value)
}

export function parseEventPayload(input: Record<string, unknown>): AdminEventPayload {
  const startDate = normalizeDate(input.start_date, 'Start date')
  const endDate = normalizeDate(input.end_date, 'End date')

  if (startDate > endDate) {
    throw new Error('End date must be on or after the start date.')
  }

  return {
    slug: normalizeSlug(input.slug, input.name_en, 'event'),
    name_en: normalizeRequiredText(input.name_en, 'English name'),
    name_bg: normalizeOptionalText(input.name_bg),
    description_en: normalizeOptionalText(input.description_en),
    description_bg: normalizeOptionalText(input.description_bg),
    thumbnail_img: normalizeOptionalText(input.thumbnail_img),
    status: normalizeStatus(input.status),
    start_date: startDate,
    end_date: endDate,
    documents: normalizeStringArray(input.documents),
    notice_board: normalizeStringArray(input.notice_board),
    results: normalizeStringArray(input.results),
    register_form: normalizeStringArray(input.register_form)
  }
}

export function parseNewsPayload(input: Record<string, unknown>): AdminNewsPayload {
  const bodyEn = normalizeRequiredText(input.body_en, 'English body')
  const bodyBg = normalizeOptionalText(input.body_bg)

  return {
    slug: normalizeSlug(input.slug, input.name_en, 'news'),
    name_en: normalizeRequiredText(input.name_en, 'English name'),
    name_bg: normalizeOptionalText(input.name_bg),
    description_en: buildNewsExcerptFromBody(bodyEn),
    description_bg: bodyBg ? buildNewsExcerptFromBody(bodyBg) : null,
    body_en: bodyEn,
    body_bg: bodyBg,
    status: normalizeNewsStatus(input.status),
    attachments: extractNewsAttachmentUrls(bodyEn, bodyBg ?? bodyEn)
  }
}

export function parseDocumentPayload(
  input: Record<string, unknown>
): AdminDocumentPayload {
  return {
    name_en: normalizeRequiredText(input.name_en, 'English name'),
    name_bg: normalizeOptionalText(input.name_bg),
    source: normalizeRequiredText(input.source, 'Source'),
    general_use: normalizeBoolean(input.general_use)
  }
}

async function resolveUniqueSlug(params: {
  table: 'events' | 'news'
  slug: string
  excludeId?: string
}) {
  const supabase = createSupabaseServiceClient()
  const baseSlug = params.slug
  let candidate = baseSlug
  let counter = 2

  for (;;) {
    const { data, error } = await supabase
      .from(params.table)
      .select('id')
      .eq('slug', candidate)
      .limit(1)

    if (error) {
      throw new Error(error.message)
    }

    const conflictingRow = (data ?? [])[0] as { id: string } | undefined

    if (!conflictingRow || conflictingRow.id === params.excludeId) {
      return candidate
    }

    candidate = `${baseSlug}-${counter}`
    counter += 1
  }
}

export async function ensureUniqueEventSlug(slug: string, excludeId?: string) {
  return resolveUniqueSlug({
    table: 'events',
    slug,
    excludeId
  })
}

export async function ensureUniqueNewsSlug(slug: string, excludeId?: string) {
  return resolveUniqueSlug({
    table: 'news',
    slug,
    excludeId
  })
}

export async function listEvents() {
  const supabase = createSupabaseServiceClient()
  const [{ data, error }, { data: registrations, error: registrationsError }] =
    await Promise.all([
      supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false }),
      supabase.from('registrations').select('event_id')
    ])

  if (error) {
    throw new Error(error.message)
  }

  if (registrationsError) {
    throw new Error(registrationsError.message)
  }

  const totalsByEventId = new Map<string, number>()

  for (const registration of registrations ?? []) {
    const eventId = registration.event_id
    if (typeof eventId !== 'string' || !eventId) {
      continue
    }

    totalsByEventId.set(eventId, (totalsByEventId.get(eventId) ?? 0) + 1)
  }

  return ((data ?? []) as Omit<AdminEventRecord, 'total_entries'>[]).map((item) => ({
    ...item,
    total_entries: totalsByEventId.get(item.id) ?? 0
  }))
}

export async function listNews() {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return ((data ?? []) as AdminNewsRecord[]).map((item) => ({
    ...item,
    attachments: extractNewsAttachmentUrls(item.body_en, item.body_bg ?? item.body_en)
  }))
}

export async function listDocuments() {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AdminDocumentRecord[]
}

export async function listRegistrations(eventId?: string) {
  const supabase = createSupabaseServiceClient()
  let query = supabase
    .from('registrations')
    .select('*')
    .order('created_at', { ascending: false })

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((reg) => ({
    ...reg,
    generated_form_url: reg.blank_link ?? null,
  })) as RegistrationRecord[]
}

export async function updateRegistrationStatus(
  id: string,
  status: RegistrationRecord['status'],
  feedback?: string | null
) {
  const supabase = createSupabaseServiceClient()

  const updatePayload: Record<string, unknown> = { status }
  if (status === 'rejected') {
    updatePayload.rejection_feedback = feedback ?? null
  }

  const { data, error } = await supabase
    .from('registrations')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  if (status === 'approved' || status === 'rejected') {
    try {
      const registration = await getRegistrationWithEvent(id)
      await sendRegistrationStatusEmail({
        registration,
        status,
        feedback: status === 'rejected' ? (feedback ?? null) : undefined,
      })
    } catch (emailError) {
      console.error('Failed to send status change email:', emailError)
    }
  }

  return data as RegistrationRecord
}

export async function updateRegistrationPaymentStatus(
  id: string,
  paymentStatus: 'paid'
) {
  const registration = await getRegistrationWithEvent(id)
  const supabase = createSupabaseServiceClient()
  const existingPayment =
    registration.payment_data?.mypos &&
    typeof registration.payment_data.mypos === 'object'
      ? registration.payment_data.mypos
      : {}

  const timestamp = new Date().toISOString()
  const crewCount = Math.max(existingPayment.crew_count ?? registration.crew_list.length, 1)

  const nextPaymentData: RegistrationPaymentData = {
    ...(registration.payment_data && typeof registration.payment_data === 'object'
      ? registration.payment_data
      : {}),
    mypos: {
      ...existingPayment,
      status: existingPayment.status ?? 'complete',
      payment_status: paymentStatus,
      method: existingPayment.method ?? 'manual-admin',
      registration_id: existingPayment.registration_id ?? registration.id,
      event_id: existingPayment.event_id ?? registration.event_id,
      customer_email: existingPayment.customer_email ?? registration.contact_email,
      locale: existingPayment.locale ?? registration.preferred_language,
      crew_count: crewCount,
      created_at: existingPayment.created_at ?? timestamp,
      completed_at: existingPayment.completed_at ?? timestamp,
    },
  }

  const { data, error } = await supabase
    .from('registrations')
    .update({ payment_data: nextPaymentData })
    .eq('id', id)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    ...data,
    generated_form_url: data.blank_link ?? null,
  } as RegistrationRecord
}
