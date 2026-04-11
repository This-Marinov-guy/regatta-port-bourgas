import { NextRequest, NextResponse } from 'next/server'

const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files'

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY
  const fileId = request.nextUrl.searchParams.get('fileId')
  const resourceKey = request.nextUrl.searchParams.get('rk')

  if (!apiKey) {
    return NextResponse.json(
      { error: 'GOOGLE_DRIVE_API_KEY is not configured.' },
      { status: 500 }
    )
  }

  if (!fileId) {
    return NextResponse.json(
      { error: 'Missing fileId query parameter.' },
      { status: 400 }
    )
  }

  const metadataParams = new URLSearchParams({
    fields: 'id,name,mimeType,resourceKey,thumbnailLink,webViewLink,webContentLink',
    supportsAllDrives: 'true',
    key: apiKey
  })

  const mediaParams = new URLSearchParams({
    alt: 'media',
    supportsAllDrives: 'true',
    key: apiKey
  })

  const headers = resourceKey
    ? {
        'X-Goog-Drive-Resource-Keys': `${fileId}/${resourceKey}`
      }
    : undefined

  const [metadataResponse, mediaResponse] = await Promise.all([
    fetch(`${DRIVE_API_BASE_URL}/${fileId}?${metadataParams.toString()}`, {
      headers,
      cache: 'no-store'
    }),
    fetch(`${DRIVE_API_BASE_URL}/${fileId}?${mediaParams.toString()}`, {
      headers,
      cache: 'no-store'
    })
  ])

  const metadata = await metadataResponse.json().catch(() => null)
  const mediaText = await mediaResponse.text().catch(() => null)

  return NextResponse.json({
    fileId,
    resourceKey: resourceKey || null,
    metadataStatus: metadataResponse.status,
    mediaStatus: mediaResponse.status,
    metadata,
    mediaPreview: mediaResponse.ok ? null : mediaText
  })
}
