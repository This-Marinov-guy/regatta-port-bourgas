import { after, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { ensureUniqueEventSlug, parseEventPayload } from '@/lib/adminContent'
import { sendEventDocumentUpdateNotifications } from '@/lib/eventDocumentNotifications'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

function getAddedRefs(previous: string[] | null | undefined, next: string[]) {
  const previousSet = new Set(previous ?? [])
  return next.filter((value) => value.trim() && !previousSet.has(value))
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
    const parsedPayload = parseEventPayload(input)
    const shouldSendDocumentNotifications =
      input.send_document_notifications === true
    const payload = {
      ...parsedPayload,
      slug: await ensureUniqueEventSlug(parsedPayload.slug, id)
    }
    const supabase = createSupabaseServiceClient()
    const { data: currentEvent, error: currentEventError } = await supabase
      .from('events')
      .select('notice_board, results')
      .eq('id', id)
      .single()

    if (currentEventError) {
      throw new Error(currentEventError.message)
    }

    const addedNoticeBoardDocumentIds = getAddedRefs(
      Array.isArray(currentEvent.notice_board) ? currentEvent.notice_board : [],
      payload.notice_board
    )
    const addedResultDocumentIds = getAddedRefs(
      Array.isArray(currentEvent.results) ? currentEvent.results : [],
      payload.results
    )

    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    if (
      shouldSendDocumentNotifications &&
      (addedNoticeBoardDocumentIds.length > 0 ||
        addedResultDocumentIds.length > 0)
    ) {
      after(async () => {
        try {
          await sendEventDocumentUpdateNotifications({
            eventId: id,
            noticeBoardDocumentIds: addedNoticeBoardDocumentIds,
            resultDocumentIds: addedResultDocumentIds,
          })
        } catch (notificationError) {
          console.error(
            'Unable to send event document update notifications:',
            notificationError
          )
        }
      })
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
