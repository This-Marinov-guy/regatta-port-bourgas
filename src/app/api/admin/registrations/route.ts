import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { listRegistrations } from '@/lib/adminContent'

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
