import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { extractNewsAttachmentUrls } from '@/lib/newsAttachments'
import { ensureSlug, slugify } from '@/lib/slug'
import type {
  AdminDocumentPayload,
  AdminDocumentRecord,
  AdminEventPayload,
  AdminEventRecord,
  AdminNewsPayload,
  AdminNewsRecord,
  EventStatus
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

function normalizeStatus(value: unknown): EventStatus {
  const status = Number(value)

  if (status !== 1 && status !== 2 && status !== 3) {
    throw new Error('Status must be 1, 2, or 3.')
  }

  return status
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
    name_bg: normalizeRequiredText(input.name_bg, 'Bulgarian name'),
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
  const bodyBg = normalizeRequiredText(input.body_bg, 'Bulgarian body')

  return {
    slug: normalizeSlug(input.slug, input.name_en, 'news'),
    name_en: normalizeRequiredText(input.name_en, 'English name'),
    name_bg: normalizeRequiredText(input.name_bg, 'Bulgarian name'),
    description_en: normalizeOptionalText(input.description_en),
    description_bg: normalizeOptionalText(input.description_bg),
    body_en: bodyEn,
    body_bg: bodyBg,
    attachments: extractNewsAttachmentUrls(bodyEn, bodyBg)
  }
}

export function parseDocumentPayload(
  input: Record<string, unknown>
): AdminDocumentPayload {
  return {
    name_en: normalizeRequiredText(input.name_en, 'English name'),
    name_bg: normalizeRequiredText(input.name_bg, 'Bulgarian name'),
    source: normalizeRequiredText(input.source, 'Source')
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
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AdminEventRecord[]
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
    attachments: extractNewsAttachmentUrls(item.body_en, item.body_bg)
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
