import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { isDonationId } from '@/lib/donations'

export const runtime = 'nodejs'

async function redirect(request: Request, id: string) {
  if (!isDonationId(id)) return new Response('Donation not found.', { status: 404 })
  try {
    const { data, error } = await createSupabaseServiceClient().from('donations')
      .select('success_url, failure_url').eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return new Response('Donation not found.', { status: 404 })
    const result = new URL(request.url).searchParams.get('result')
    if (result !== 'success' && result !== 'failure') return new Response('Invalid result.', { status: 400 })
    const target = new URL(result === 'success' ? data.success_url : data.failure_url)
    target.searchParams.set('donationId', id)
    return NextResponse.redirect(target, 303)
  } catch (error) {
    console.error('Unable to load donation redirect:', error)
    return new Response('Unable to complete redirect.', { status: 503 })
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return redirect(request, (await params).id)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return redirect(request, (await params).id)
}
