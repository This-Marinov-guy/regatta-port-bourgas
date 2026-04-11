import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import {
  ensureUniqueNewsSlug,
  listNews,
  parseNewsPayload
} from '@/lib/adminContent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const data = await listNews()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load news.' },
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
    const parsedPayload = parseNewsPayload(input)
    const payload = {
      ...parsedPayload,
      slug: await ensureUniqueNewsSlug(parsedPayload.slug)
    }
    const supabase = createSupabaseServiceClient()

    const { data, error } = await supabase
      .from('news')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to create news item.'
      },
      { status: 400 }
    )
  }
}
