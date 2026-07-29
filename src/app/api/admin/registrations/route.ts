import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { createRegistrationFromAdmin, listRegistrations } from '@/lib/adminContent'

export async function GET(request: Request) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id') ?? undefined
    const data = await listRegistrations(eventId)
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load registrations.' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const body = (await request.json()) as Record<string, unknown>
    const eventId = typeof body.eventId === 'string' ? body.eventId : ''
    const editableFields = body.editableFields

    if (!editableFields || typeof editableFields !== 'object') {
      return NextResponse.json({ error: 'Invalid registration fields.' }, { status: 400 })
    }

    const data = await createRegistrationFromAdmin(
      eventId,
      editableFields as Record<string, unknown>,
    )

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create registration.' },
      { status: 400 }
    )
  }
}
