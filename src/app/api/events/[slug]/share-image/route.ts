import { NextResponse } from 'next/server'

import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { getSupabaseUrl } from '@/lib/supabase/config'

export const runtime = 'nodejs'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.org'
const fallbackImageUrl = `${siteUrl}/images/banner.png`
const cacheControl =
  'public, max-age=3600, s-maxage=31536000, stale-while-revalidate=86400'

function getShareImageSource(thumbnailImage: string | null) {
  if (!thumbnailImage) {
    return fallbackImageUrl
  }

  try {
    const source = new URL(thumbnailImage, siteUrl)
    const supabaseOrigin = new URL(getSupabaseUrl()).origin

    if (
      source.origin === supabaseOrigin &&
      source.pathname.includes('/storage/v1/object/public/images/')
    ) {
      source.pathname = source.pathname.replace(
        '/storage/v1/object/public/images/',
        '/storage/v1/render/image/public/images/'
      )
      source.searchParams.set('width', '1200')
      source.searchParams.set('height', '630')
      source.searchParams.set('resize', 'cover')
      source.searchParams.set('quality', '80')
      return source.toString()
    }

    // Only proxy assets hosted by this site. Unknown external URLs fall back to
    // the default image rather than turning this endpoint into an open proxy.
    return source.origin === new URL(siteUrl).origin
      ? source.toString()
      : fallbackImageUrl
  } catch {
    return fallbackImageUrl
  }
}

async function fetchImage(url: string) {
  return fetch(url, { next: { revalidate: 86400 } })
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createSupabaseServiceClient()
  const { data: event, error } = await supabase
    .from('events')
    .select('thumbnail_img')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !event) {
    return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
  }

  let imageResponse = await fetchImage(getShareImageSource(event.thumbnail_img))

  if (!imageResponse.ok) {
    imageResponse = await fetchImage(fallbackImageUrl)
  }

  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: 'Unable to load the share image.' },
      { status: 502 }
    )
  }

  const image = await imageResponse.arrayBuffer()

  return new Response(image, {
    headers: {
      'Cache-Control': cacheControl,
      'Content-Length': String(image.byteLength),
      'Content-Type': imageResponse.headers.get('content-type') || 'image/jpeg',
    },
  })
}
