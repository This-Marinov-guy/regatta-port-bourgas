import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { ensureUniqueEventSlug, parseEventPayload } from '@/lib/adminContent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const input = (await request.json()) as Record<string, unknown>
    const parsedPayload = parseEventPayload(input)
    const payload = {
      ...parsedPayload,
      slug: await ensureUniqueEventSlug(parsedPayload.slug, id)
    }
    const supabase = createSupabaseServiceClient()

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update event.' },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const supabase = createSupabaseServiceClient()
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete event.' },
      { status: 400 }
    )
  }
}
