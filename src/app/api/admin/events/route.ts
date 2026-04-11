import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import {
  ensureUniqueEventSlug,
  listEvents,
  parseEventPayload
} from '@/lib/adminContent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const data = await listEvents()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load events.' },
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
    const input = (await request.json()) as Record<string, unknown>
    const parsedPayload = parseEventPayload(input)
    const payload = {
      ...parsedPayload,
      slug: await ensureUniqueEventSlug(parsedPayload.slug)
    }
    const supabase = createSupabaseServiceClient()

    const { data, error } = await supabase
      .from('events')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to create event.' },
      { status: 400 }
    )
  }
}
