import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { publishRegistrationCreated } from '@/lib/registrations/publish'
import { isEventRegistrationOpen } from '@/lib/events'
import { readLocaleFromRequest } from '@/lib/locale'

type CrewMemberPayload = {
  name?: unknown
  date_of_birth?: unknown
}

type RegistrationPayload = {
  event_id?: unknown
  boat_name?: unknown
  border_number?: unknown
  country?: unknown
  certificate_of_navigation?: unknown
  certificate_of_navigation_expiry?: unknown
  model_design?: unknown
  sail_number?: unknown
  boat_age?: unknown
  port_of_registry?: unknown
  gph_irc?: unknown
  loa?: unknown
  boat_color?: unknown
  yacht_club?: unknown
  skipper_name?: unknown
  skipper_yacht_club?: unknown
  charterer_name?: unknown
  certificate_of_competency?: unknown
  certificate_of_competency_expiry?: unknown
  contact_name?: unknown
  contact_phone?: unknown
  contact_email?: unknown
  receive_documents_by_email?: unknown
  crew_insurance?: unknown
  third_party_insurance?: unknown
  insurance_documents?: unknown
  disclaimer_accepted?: unknown
  gdpr_accepted?: unknown
  crew_list?: unknown
}

function requireText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required.`)
  }

  return value.trim()
}

function optionalText(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function requireEmail(value: unknown, label: string) {
  const email = requireText(value, label)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`${label} must be a valid email address.`)
  }

  return email
}

function optionalDate(value: unknown, label: string) {
  const date = optionalText(value)

  if (!date) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error(`${label} must be a valid date in YYYY-MM-DD format.`)
  }

  return date
}

function requireInteger(value: unknown, label: string) {
  const normalized =
    typeof value === 'number' ? value : Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${label} must be a whole number.`)
  }

  return normalized
}

function optionalInteger(value: unknown, label: string) {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value === 'string' && !value.trim()) {
    return null
  }

  const normalized =
    typeof value === 'number' ? value : Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isInteger(normalized) || normalized <= 0) {
    throw new Error(`${label} must be a whole number.`)
  }

  return normalized
}

function requireDecimal(value: unknown, label: string) {
  const normalized =
    typeof value === 'number' ? value : Number(typeof value === 'string' ? value.trim() : value)

  if (!Number.isFinite(normalized) || normalized <= 0) {
    throw new Error(`${label} must be a positive number.`)
  }

  return normalized
}

function toBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeCrewList(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((member) => {
      if (!member || typeof member !== 'object') {
        return null
      }

      const payload = member as CrewMemberPayload
      const name = optionalText(payload.name)
      const dateOfBirth = optionalDate(
        payload.date_of_birth,
        'Crew member date of birth'
      )

      if (!name && !dateOfBirth) {
        return null
      }

      return {
        name: name ?? 'Unnamed crew member',
        ...(dateOfBirth ? { date_of_birth: dateOfBirth } : {})
      }
    })
    .filter(Boolean)
}

function normalizeDocumentUrls(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => optionalText(item))
    .filter((item): item is string => Boolean(item))
}

function requiresLegacyEmailColumn(errorMessage: string) {
  return (
    errorMessage.includes('null value in column "email"') &&
    errorMessage.includes('relation "registrations"')
  )
}

export async function POST(request: Request) {
  try {
    const locale = readLocaleFromRequest(request)
    const body = (await request.json()) as RegistrationPayload

    const payload = {
      event_id: requireText(body.event_id, 'Event'),
      boat_name: requireText(body.boat_name, 'Boat name'),
      border_number: optionalInteger(body.border_number, 'Border number'),
      country: requireText(body.country, 'Country'),
      certificate_of_navigation: optionalInteger(
        body.certificate_of_navigation,
        'Certificate of navigation'
      ),
      certificate_of_navigation_expiry: optionalDate(
        body.certificate_of_navigation_expiry,
        'Navigation certificate expiry'
      ),
      model_design: requireText(body.model_design, 'Model / design'),
      sail_number: requireText(body.sail_number, 'Sail number'),
      boat_age: requireInteger(body.boat_age, 'Boat age'),
      port_of_registry: optionalText(body.port_of_registry),
      gph_irc: requireText(body.gph_irc, 'GPH / IRC'),
      loa: requireDecimal(body.loa, 'LOA'),
      boat_color: optionalText(body.boat_color),
      yacht_club: optionalText(body.yacht_club),
      skipper_name: requireText(body.skipper_name, 'Skipper name'),
      skipper_yacht_club: requireText(body.skipper_yacht_club, 'Skipper yacht club'),
      charterer_name: optionalText(body.charterer_name),
      certificate_of_competency: requireText(
        body.certificate_of_competency,
        'Certificate of competency'
      ),
      certificate_of_competency_expiry: optionalDate(
        body.certificate_of_competency_expiry,
        'Competency certificate expiry'
      ),
      contact_name: requireText(body.contact_name, 'Contact name'),
      contact_phone: requireText(body.contact_phone, 'Contact phone'),
      contact_email: requireEmail(body.contact_email, 'Contact email'),
      receive_documents_by_email: toBoolean(body.receive_documents_by_email, true),
      crew_insurance: toBoolean(body.crew_insurance),
      third_party_insurance: toBoolean(body.third_party_insurance),
      insurance_documents: normalizeDocumentUrls(body.insurance_documents),
      disclaimer_accepted: toBoolean(body.disclaimer_accepted),
      gdpr_accepted: toBoolean(body.gdpr_accepted),
      crew_list: normalizeCrewList(body.crew_list),
      preferred_language: locale,
    }

    if (!payload.disclaimer_accepted || !payload.gdpr_accepted) {
      return NextResponse.json(
        { error: 'You must accept the required declarations before submitting.' },
        { status: 400 }
      )
    }

    if (payload.insurance_documents.length === 0) {
      return NextResponse.json(
        { error: 'Insurance documents are required.' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServiceClient()
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, start_date')
      .eq('id', payload.event_id)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json(
        { error: 'Event not found.' },
        { status: 404 }
      )
    }

    if (!isEventRegistrationOpen(eventData.start_date)) {
      return NextResponse.json(
        { error: 'Registration for this event is closed.' },
        { status: 400 }
      )
    }

    let { data, error } = await supabase
      .from('registrations')
      .insert(payload)
      .select('id')
      .single()

    if (error && requiresLegacyEmailColumn(error.message)) {
      const legacyInsert = await supabase
        .from('registrations')
        .insert({
          ...payload,
          email: payload.contact_email,
        })
        .select('id')
        .single()

      data = legacyInsert.data
      error = legacyInsert.error
    }

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      throw new Error('Unable to create registration.')
    }

    try {
      await publishRegistrationCreated({
        registrationId: data.id,
        eventId: payload.event_id,
        createdAt: new Date().toISOString(),
        locale,
      })
    } catch (queueError) {
      await supabase.from('registrations').delete().eq('id', data.id)
      throw queueError
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to submit registration.'
      },
      { status: 400 }
    )
  }
}
