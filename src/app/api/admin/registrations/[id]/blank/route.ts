import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { getRegistrationWithEvent } from '@/lib/registrations/data'

function isAllowedBlankUrl(url: string) {
  const parsed = new URL(url)
  if (parsed.protocol !== 'https:') {
    return false
  }

  const outputBucket = process.env.AWS_REGISTRATION_OUTPUT_BUCKET
  const outputRegion =
    process.env.CUSTOM_AWS_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'eu-central-1'
  const configuredPublicBaseUrl = process.env.AWS_REGISTRATION_OUTPUT_PUBLIC_BASE_URL

  if (configuredPublicBaseUrl) {
    const base = new URL(configuredPublicBaseUrl)
    return parsed.origin === base.origin && parsed.pathname.startsWith(base.pathname.replace(/\/$/, '') + '/')
  }

  if (!outputBucket) {
    return false
  }

  return (
    parsed.hostname === `${outputBucket}.s3.${outputRegion}.amazonaws.com` ||
    parsed.hostname === `${outputBucket}.s3.amazonaws.com`
  )
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const registration = await getRegistrationWithEvent(id)
    const blankUrl = registration.blank_link ?? registration.generated_form_url

    if (!blankUrl) {
      return NextResponse.json({ error: 'This form is still being generated.' }, { status: 404 })
    }

    if (!isAllowedBlankUrl(blankUrl)) {
      return NextResponse.json({ error: 'The blank form URL is not allowed.' }, { status: 400 })
    }

    const response = await fetch(blankUrl, { cache: 'no-store' })
    if (!response.ok || !response.body) {
      return NextResponse.json({ error: 'Unable to download the blank form.' }, { status: 502 })
    }

    const headers = new Headers()
    headers.set('content-type', response.headers.get('content-type') || 'application/pdf')
    headers.set('content-disposition', `attachment; filename="registration-${id}.pdf"`)

    const contentLength = response.headers.get('content-length')
    if (contentLength) {
      headers.set('content-length', contentLength)
    }

    return new NextResponse(response.body, { headers })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to download the blank form.' },
      { status: 500 }
    )
  }
}
