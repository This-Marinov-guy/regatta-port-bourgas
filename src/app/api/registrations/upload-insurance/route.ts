import { NextResponse } from 'next/server'
import { isEventRegistrationOpen } from '@/lib/events'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

const DOCUMENTS_BUCKET = 'documents'
const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'jpg',
  'jpeg',
  'png',
  'webp',
])

function requireText(value: FormDataEntryValue | null, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required.`)
  }

  return value.trim()
}

function normalizeFileName(fileName: string) {
  const extension = fileName.includes('.')
    ? `.${fileName.split('.').pop()?.toLowerCase() ?? 'bin'}`
    : ''
  const safeName = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${Date.now()}-${crypto.randomUUID()}-${safeName || 'insurance-document'}${extension}`
}

function isAllowedFile(file: File) {
  if (ALLOWED_MIME_TYPES.has(file.type)) {
    return true
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  return Boolean(extension && ALLOWED_EXTENSIONS.has(extension))
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const eventId = requireText(formData.get('event_id'), 'Event')
    const fileEntry = formData.get('file')

    if (!(fileEntry instanceof File)) {
      return NextResponse.json({ error: 'Insurance document file is required.' }, { status: 400 })
    }

    if (!isAllowedFile(fileEntry)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload a PDF, office document, text file, or image.' },
        { status: 400 }
      )
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. The maximum size is 10 MB.' },
        { status: 400 }
      )
    }

    const supabase = createSupabaseServiceClient()
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id, start_date')
      .eq('id', eventId)
      .single()

    if (eventError || !eventData) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    if (!isEventRegistrationOpen(eventData.start_date)) {
      return NextResponse.json(
        { error: 'Registration for this event is closed.' },
        { status: 400 }
      )
    }

    const path = `registrations/${eventId}/insurance/${normalizeFileName(fileEntry.name)}`
    const buffer = Buffer.from(await fileEntry.arrayBuffer())
    const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer, {
      contentType: fileEntry.type || undefined,
      upsert: false,
    })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    return NextResponse.json(
      {
        data: {
          url: supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(path).data.publicUrl,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Unable to upload the insurance document.' },
      { status: 500 }
    )
  }
}
