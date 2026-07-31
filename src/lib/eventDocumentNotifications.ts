import { format } from 'date-fns'
import { localizeText } from '@/lib/localizedContent'
import { normalizeLocale, type AppLocale } from '@/lib/locale'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import {
  sendNoticeBoardDocumentUpdateEmail,
  sendResultsPublishedEmail,
} from '@/lib/registrations/email'

type EventNotificationRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  start_date: string
  end_date: string
}

type DocumentNotificationRecord = {
  id: string
  name_en: string
  name_bg: string | null
  source: string
}

type RegistrationNotificationRecipient = {
  id: string
  contact_name: string | null
  contact_email: string
  preferred_language: AppLocale | null
}

function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.org'
  ).replace(/\/$/, '')
}

function eventDates(event: EventNotificationRecord) {
  return `${format(new Date(event.start_date), 'dd.MM.yyyy')} - ${format(
    new Date(event.end_date),
    'dd.MM.yyyy'
  )}`
}

function eventUrl(event: EventNotificationRecord, locale: AppLocale) {
  return `${getSiteUrl()}/${locale}/events/${encodeURIComponent(event.slug)}`
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter((value) => value.trim()))]
}

async function getNotificationContext(args: {
  eventId: string
  documentIds: string[]
}) {
  const supabase = createSupabaseServiceClient()
  const documentIds = uniqueValues(args.documentIds)

  const [
    { data: event, error: eventError },
    { data: documents, error: documentsError },
    { data: registrations, error: registrationsError },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, slug, name_en, name_bg, start_date, end_date')
      .eq('id', args.eventId)
      .single(),
    documentIds.length > 0
      ? supabase
          .from('documents')
          .select('id, name_en, name_bg, source')
          .in('id', documentIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('registrations')
      .select('id, contact_name, contact_email, preferred_language')
      .eq('event_id', args.eventId)
      .is('deleted_at', null),
  ])

  if (eventError) {
    throw new Error(eventError.message)
  }

  if (documentsError) {
    throw new Error(documentsError.message)
  }

  if (registrationsError) {
    throw new Error(registrationsError.message)
  }

  return {
    event: event as EventNotificationRecord,
    documents: ((documents ?? []) as DocumentNotificationRecord[]).filter(
      (document) => documentIds.includes(document.id)
    ),
    recipients: (registrations ?? []) as RegistrationNotificationRecipient[],
  }
}

export async function sendEventDocumentUpdateNotifications(args: {
  eventId: string
  noticeBoardDocumentIds: string[]
  resultDocumentIds: string[]
}) {
  const allDocumentIds = uniqueValues([
    ...args.noticeBoardDocumentIds,
    ...args.resultDocumentIds,
  ])

  if (allDocumentIds.length === 0) {
    return
  }

  const { event, documents, recipients } = await getNotificationContext({
    eventId: args.eventId,
    documentIds: allDocumentIds,
  })
  const documentsById = new Map(documents.map((document) => [document.id, document]))
  const dates = eventDates(event)

  for (const recipient of recipients) {
    const to = recipient.contact_email.trim()
    if (!to) {
      continue
    }

    const locale = normalizeLocale(recipient.preferred_language)
    const recipientName = recipient.contact_name?.trim() || null
    const localizedEventName = localizeText(locale, event.name_en, event.name_bg)
    const localizedEventUrl = eventUrl(event, locale)

    for (const documentId of args.noticeBoardDocumentIds) {
      const document = documentsById.get(documentId)
      if (!document) {
        continue
      }

      await sendNoticeBoardDocumentUpdateEmail({
        to,
        locale,
        recipientName,
        eventName: localizedEventName,
        eventDates: dates,
        eventUrl: localizedEventUrl,
        documentName: localizeText(locale, document.name_en, document.name_bg),
        documentUrl: document.source,
      })
    }

    for (const documentId of args.resultDocumentIds) {
      const document = documentsById.get(documentId)
      if (!document) {
        continue
      }

      await sendResultsPublishedEmail({
        to,
        locale,
        recipientName,
        eventName: localizedEventName,
        eventDates: dates,
        eventUrl: localizedEventUrl,
        documentName: localizeText(locale, document.name_en, document.name_bg),
        documentUrl: document.source,
      })
    }
  }
}
