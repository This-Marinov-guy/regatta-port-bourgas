import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { extractNewsAttachmentUrls } from '@/lib/newsAttachments'
import { ensureSlug, slugify } from '@/lib/slug'
import { getRegistrationWithEvent } from '@/lib/registrations/data'
import { sendRegistrationStatusEmail } from '@/lib/registrations/email'
import { hasEventFee } from '@/lib/eventFees'
import type {
  AdminDocumentPayload,
  AdminDocumentRecord,
  AdminEventPayload,
  AdminEventRecord,
  AdminNewsPayload,
  AdminNewsRecord,
  EventFeeType,
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

function normalizeRegistrationRequiredText(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`)
  }

  return value.trim()
}

function normalizeRegistrationOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeRegistrationEmail(value: unknown) {
  const email = normalizeRegistrationRequiredText(value, 'Contact email')

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Contact email must be a valid email address.')
  }

  return email
}

function normalizeRegistrationDate(value: unknown, fieldName: string) {
  const date = normalizeRegistrationOptionalText(value)

  if (!date) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${fieldName} must be a valid date in YYYY-MM-DD format.`)
  }

  return date
}

function normalizeRegistrationInteger(
  value: unknown,
  fieldName: string,
  required = false,
) {
  if (!required && (value === null || value === undefined || value === '')) {
    return null
  }

  const normalized =
    typeof value === 'number'
      ? value
      : Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${fieldName} must be a whole number.`)
  }

  return normalized
}

function normalizeRegistrationDecimal(value: unknown, fieldName: string) {
  const normalized =
    typeof value === 'number'
      ? value
      : Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`${fieldName} must be a positive number.`)
  }

  return normalized
}

function normalizeRegistrationCrewList(value: unknown) {
  if (!Array.isArray(value)) {
    throw new Error('Crew list must be an array.')
  }

  return value
    .map((member) => {
      if (!member || typeof member !== 'object') {
        return null
      }

      const payload = member as {
        name?: unknown
        date_of_birth?: unknown
      }
      const name = normalizeRegistrationOptionalText(payload.name)
      const dateOfBirth = normalizeRegistrationDate(
        payload.date_of_birth,
        'Crew member date of birth',
      )

      if (!name && !dateOfBirth) {
        return null
      }

      return {
        name: name ?? 'Unnamed crew member',
        ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {}),
      }
    })
    .filter(Boolean)
}

function normalizeEventFee(input: Record<string, unknown>) {
  const rawAmount =
    typeof input.fee_amount === 'string' ? input.fee_amount.trim() : input.fee_amount

  if (rawAmount === '' || rawAmount === null || rawAmount === undefined) {
    return {
      fee_amount_cents: null,
      fee_type: null,
    }
  }

  const amount = Number(rawAmount)
  const feeType = input.fee_type

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Fee amount must be a positive number.')
  }

  if (feeType !== 'per_crew' && feeType !== 'total') {
    throw new Error('Fee type must be per crew member or total.')
  }

  return {
    fee_amount_cents: Math.round(amount * 100),
    fee_type: feeType as EventFeeType,
  }
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
  const fee = normalizeEventFee(input)

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
    register_form: normalizeStringArray(input.register_form),
    ...fee,
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
      supabase
        .from('registrations')
        .select('event_id')
        .is('deleted_at', null)
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
    .is('deleted_at', null)
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

export function parseRegistrationAdminPayload(input: Record<string, unknown>) {
  return {
    boat_name: normalizeRegistrationRequiredText(input.boat_name, 'Boat name'),
    border_number: normalizeRegistrationInteger(input.border_number, 'Border number'),
    country: normalizeRegistrationRequiredText(input.country, 'Country'),
    certificate_of_navigation: normalizeRegistrationInteger(
      input.certificate_of_navigation,
      'Certificate of navigation',
    ),
    certificate_of_navigation_expiry: normalizeRegistrationDate(
      input.certificate_of_navigation_expiry,
      'Navigation certificate expiry',
    ),
    model_design: normalizeRegistrationRequiredText(input.model_design, 'Model / design'),
    sail_number: normalizeRegistrationRequiredText(input.sail_number, 'Sail number'),
    boat_age: normalizeRegistrationInteger(input.boat_age, 'Boat age', true),
    port_of_registry: normalizeRegistrationOptionalText(input.port_of_registry),
    gph_irc: normalizeRegistrationRequiredText(input.gph_irc, 'GPH / IRC'),
    loa: normalizeRegistrationDecimal(input.loa, 'LOA'),
    boat_color: normalizeRegistrationOptionalText(input.boat_color),
    yacht_club: normalizeRegistrationOptionalText(input.yacht_club),
    skipper_name: normalizeRegistrationRequiredText(input.skipper_name, 'Skipper name'),
    skipper_yacht_club: normalizeRegistrationRequiredText(
      input.skipper_yacht_club,
      'Skipper yacht club',
    ),
    charterer_name: normalizeRegistrationOptionalText(input.charterer_name),
    certificate_of_competency: normalizeRegistrationRequiredText(
      input.certificate_of_competency,
      'Certificate of competency',
    ),
    certificate_of_competency_expiry: normalizeRegistrationDate(
      input.certificate_of_competency_expiry,
      'Competency certificate expiry',
    ),
    contact_name: normalizeRegistrationRequiredText(input.contact_name, 'Contact name'),
    contact_phone: normalizeRegistrationRequiredText(input.contact_phone, 'Contact phone'),
    contact_email: normalizeRegistrationEmail(input.contact_email),
    receive_documents_by_email: normalizeBoolean(input.receive_documents_by_email),
    crew_insurance: normalizeBoolean(input.crew_insurance),
    third_party_insurance: normalizeBoolean(input.third_party_insurance),
    disclaimer_accepted: normalizeBoolean(input.disclaimer_accepted),
    gdpr_accepted: normalizeBoolean(input.gdpr_accepted),
    crew_list: normalizeRegistrationCrewList(input.crew_list),
  }
}

export async function updateRegistrationDetails(
  id: string,
  input: Record<string, unknown>,
) {
  const supabase = createSupabaseServiceClient()
  const updatePayload = parseRegistrationAdminPayload(input)
  const { data, error } = await supabase
    .from('registrations')
    .update(updatePayload)
    .eq('id', id)
    .is('deleted_at', null)
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

export async function deleteRegistration(id: string) {
  const supabase = createSupabaseServiceClient()

  const { error } = await supabase
    .from('registrations')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }
}

export async function updateRegistrationPaymentStatus(
  id: string,
  paymentStatus: 'paid'
) {
  const registration = await getRegistrationWithEvent(id)

  if (!hasEventFee(registration.event)) {
    throw new Error('This event does not require an entry fee.')
  }

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
