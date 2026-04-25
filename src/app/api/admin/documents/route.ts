import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { listDocuments, parseDocumentPayload } from '@/lib/adminContent'
import { createSupabaseServiceClient } from '@/lib/supabase/service'

function requiresLegacyBgName(errorMessage: string) {
  return (
    errorMessage.includes('null value in column "name_bg"') &&
    errorMessage.includes('relation "documents"')
  )
}

export async function GET() {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const data = await listDocuments()
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to load documents.'
      },
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
    const payload = parseDocumentPayload(input)
    const supabase = createSupabaseServiceClient()

    let { data, error } = await supabase
      .from('documents')
      .insert(payload)
      .select('*')
      .single()

    if (error && requiresLegacyBgName(error.message)) {
      const legacyInsert = await supabase
        .from('documents')
        .insert({
          ...payload,
          name_bg: payload.name_bg ?? payload.name_en
        })
        .select('*')
        .single()

      data = legacyInsert.data
      error = legacyInsert.error
    }

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to create document.'
      },
      { status: 400 }
    )
  }
}
