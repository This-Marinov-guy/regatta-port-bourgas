import { NextRequest, NextResponse } from 'next/server'

const DRIVE_API_BASE_URL = 'https://www.googleapis.com/drive/v3/files'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string; filename: string }> }
) {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Google Drive API key is not configured.' },
      { status: 500 }
    )
  }

  const { fileId } = await params
  const resourceKey = request.nextUrl.searchParams.get('rk')

  const searchParams = new URLSearchParams({
    alt: 'media',
    key: apiKey,
    supportsAllDrives: 'true'
  })

  const response = await fetch(`${DRIVE_API_BASE_URL}/${fileId}?${searchParams.toString()}`, {
    headers: resourceKey
      ? {
          'X-Goog-Drive-Resource-Keys': `${fileId}/${resourceKey}`
        }
      : undefined,
    next: { revalidate: 900 }
  })

  if (!response.ok) {
    return NextResponse.json(
      { error: `Google Drive image request failed with ${response.status}.` },
      { status: response.status }
    )
  }

  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const buffer = await response.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=900, s-maxage=900, stale-while-revalidate=3600'
    }
  })
}
