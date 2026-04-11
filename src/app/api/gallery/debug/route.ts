import { NextResponse } from 'next/server'

const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files'
const DEFAULT_GALLERY_FOLDER_ID = '1L7iALLBsMHbBftZl41NAyr4wwujnxM87'

export async function GET() {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const folderId =
    process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_GALLERY_FOLDER_ID
  const existingResourceKey = process.env.GOOGLE_DRIVE_GALLERY_RESOURCE_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_DRIVE_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  const searchParams = new URLSearchParams({
    fields: 'id,name,mimeType,resourceKey,webViewLink',
    supportsAllDrives: 'true',
    key: apiKey
  })

  const response = await fetch(`${DRIVE_API_BASE_URL}/${folderId}?${searchParams.toString()}`, {
    headers: existingResourceKey
      ? {
          'X-Goog-Drive-Resource-Keys': `${folderId}/${existingResourceKey}`
        }
      : undefined,
    cache: 'no-store'
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return NextResponse.json(
      {
        error: `Google Drive request failed with ${response.status}.`,
        folderId,
        existingResourceKey: existingResourceKey || null,
        details: data
      },
      { status: response.status }
    )
  }

  return NextResponse.json({
    folderId,
    existingResourceKey: existingResourceKey || null,
    drive: data
  })
}
