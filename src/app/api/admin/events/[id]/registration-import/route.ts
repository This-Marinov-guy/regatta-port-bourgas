import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'

export const runtime = 'nodejs'

const MAX_FILES = 8
const MAX_FILE_SIZE_BYTES = 12 * 1024 * 1024
const DEFAULT_MODEL = 'gpt-5.6-terra'

type ImportContentItem =
  | { type: 'input_text'; text: string }
  | { type: 'input_image'; image_url: string; detail: 'high' }
  | { type: 'input_file'; filename: string; file_data: string }

const editableFieldsSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'boat_name',
    'border_number',
    'country',
    'certificate_of_navigation',
    'certificate_of_navigation_expiry',
    'model_design',
    'sail_number',
    'boat_age',
    'port_of_registry',
    'gph_irc',
    'loa',
    'boat_color',
    'yacht_club',
    'skipper_name',
    'skipper_yacht_club',
    'charterer_name',
    'certificate_of_competency',
    'certificate_of_competency_expiry',
    'contact_name',
    'contact_phone',
    'contact_email',
    'receive_documents_by_email',
    'crew_insurance',
    'third_party_insurance',
    'disclaimer_accepted',
    'gdpr_accepted',
    'crew_list',
  ],
  properties: {
    boat_name: { type: 'string' },
    border_number: { type: 'string' },
    country: { type: 'string' },
    certificate_of_navigation: { type: 'string' },
    certificate_of_navigation_expiry: { type: 'string' },
    model_design: { type: 'string' },
    sail_number: { type: 'string' },
    boat_age: { type: 'string' },
    port_of_registry: { type: 'string' },
    gph_irc: { type: 'string' },
    loa: { type: 'string' },
    boat_color: { type: 'string' },
    yacht_club: { type: 'string' },
    skipper_name: { type: 'string' },
    skipper_yacht_club: { type: 'string' },
    charterer_name: { type: 'string' },
    certificate_of_competency: { type: 'string' },
    certificate_of_competency_expiry: { type: 'string' },
    contact_name: { type: 'string' },
    contact_phone: { type: 'string' },
    contact_email: { type: 'string' },
    receive_documents_by_email: { type: 'boolean' },
    crew_insurance: { type: 'boolean' },
    third_party_insurance: { type: 'boolean' },
    disclaimer_accepted: { type: 'boolean' },
    gdpr_accepted: { type: 'boolean' },
    crew_list: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'date_of_birth'],
        properties: {
          name: { type: 'string' },
          date_of_birth: { type: 'string' },
        },
      },
    },
  },
}

const responseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['editableFields', 'notes'],
  properties: {
    editableFields: editableFieldsSchema,
    notes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
}

function isImageMimeType(type: string) {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type)
}

function isSupportedFile(file: File) {
  return isImageMimeType(file.type) || file.type === 'application/pdf' || file.type === 'text/plain'
}

function getOutputText(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const response = payload as {
    output_text?: unknown
    output?: Array<{
      content?: Array<{
        type?: string
        text?: unknown
      }>
    }>
  }

  if (typeof response.output_text === 'string') {
    return response.output_text
  }

  return (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .map((item) => (typeof item.text === 'string' ? item.text : ''))
    .filter(Boolean)
    .join('\n')
}

async function fileToContentItem(file: File): Promise<ImportContentItem> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${buffer.toString('base64')}`

  if (isImageMimeType(file.type)) {
    return {
      type: 'input_image',
      image_url: dataUrl,
      detail: 'high',
    }
  }

  return {
    type: 'input_file',
    filename: file.name,
    file_data: dataUrl,
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured.' },
      { status: 500 },
    )
  }

  try {
    const { id: eventId } = await params
    const formData = await request.formData()
    const files = formData
      .getAll('files')
      .filter((value): value is File => value instanceof File && value.size > 0)

    if (files.length === 0) {
      return NextResponse.json({ error: 'Upload at least one registration file.' }, { status: 400 })
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json({ error: `Upload ${MAX_FILES} files or fewer.` }, { status: 400 })
    }

    const invalidFile = files.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES || !isSupportedFile(file),
    )

    if (invalidFile) {
      return NextResponse.json(
        {
          error:
            'Supported registration imports are PDF, TXT, JPG, PNG, GIF or WebP files up to 12 MB each.',
        },
        { status: 400 },
      )
    }

    const uploadedContent = await Promise.all(files.map(fileToContentItem))
    const content: ImportContentItem[] = [
      {
        type: 'input_text',
        text: [
          `Event ID: ${eventId}`,
          'Extract the registration data from these uploaded registration form files.',
          'Return empty strings for unknown text/date/number fields.',
          'Return dates as YYYY-MM-DD only when the date is clear, otherwise empty string.',
          'Return numeric fields as strings without units. LOA should be metres if present.',
          'For boat_age, prefer the production year if the form labels it as year.',
          'Set booleans to true only when the document clearly indicates the option was selected or accepted.',
          'Make the first crew_list item the skipper when possible.',
        ].join('\n'),
      },
      ...uploadedContent,
    ]

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_REGISTRATION_IMPORT_MODEL || DEFAULT_MODEL,
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text:
                  'You extract yacht racing registration forms into editable admin fields. Be conservative: never invent values, and keep unknown fields blank.',
              },
            ],
          },
          {
            role: 'user',
            content,
          },
        ],
        reasoning: { effort: 'low' },
        text: {
          format: {
            type: 'json_schema',
            name: 'registration_import',
            schema: responseSchema,
            strict: true,
          },
        },
      }),
    })

    const payload = (await openaiResponse.json().catch(() => null)) as unknown

    if (!openaiResponse.ok) {
      const error = payload as { error?: { message?: string } } | null
      return NextResponse.json(
        { error: error?.error?.message || 'Unable to extract registration fields.' },
        { status: openaiResponse.status },
      )
    }

    const outputText = getOutputText(payload)
    if (!outputText) {
      return NextResponse.json(
        { error: 'OpenAI did not return extracted registration fields.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ data: JSON.parse(outputText) })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to import registration files.',
      },
      { status: 400 },
    )
  }
}
