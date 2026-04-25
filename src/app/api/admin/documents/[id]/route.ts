import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { parseDocumentPayload } from '@/lib/adminContent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

function requiresLegacyBgName(errorMessage: string) {
  return (
    errorMessage.includes('null value in column "name_bg"') &&
    errorMessage.includes('relation "documents"')
  )
}

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
    const payload = parseDocumentPayload(input)
    const supabase = createSupabaseServiceClient()

    let { data, error } = await supabase
      .from('documents')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error && requiresLegacyBgName(error.message)) {
      const legacyUpdate = await supabase
        .from('documents')
        .update({
          ...payload,
          name_bg: payload.name_bg ?? payload.name_en
        })
        .eq('id', id)
        .select('*')
        .single()

      data = legacyUpdate.data
      error = legacyUpdate.error
    }

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to update document.'
      },
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

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, notice_board, results')

    if (eventsError) {
      throw new Error(eventsError.message)
    }

    await Promise.all(
      (events ?? []).map(async (event) => {
        const nextNoticeBoard = Array.isArray(event.notice_board)
          ? event.notice_board.filter((item) => item !== id)
          : []
        const nextResults = Array.isArray(event.results)
          ? event.results.filter((item) => item !== id)
          : []

        if (
          nextNoticeBoard.length === (event.notice_board?.length ?? 0) &&
          nextResults.length === (event.results?.length ?? 0)
        ) {
          return
        }

        const { error: updateError } = await supabase
          .from('events')
          .update({
            notice_board: nextNoticeBoard,
            results: nextResults
          })
          .eq('id', event.id)

        if (updateError) {
          throw new Error(updateError.message)
        }
      })
    )

    const { error } = await supabase.from('documents').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ id })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to delete document.'
      },
      { status: 400 }
    )
  }
}
