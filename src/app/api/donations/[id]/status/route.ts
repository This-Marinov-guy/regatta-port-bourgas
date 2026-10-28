import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { DONATION_ORIGIN, donationCorsHeaders, isDonationId } from '@/lib/donations'

export const runtime = 'nodejs'

export function OPTIONS(request: Request) {
  const origin = request.headers.get('origin')
  return new Response(null, { status: origin === DONATION_ORIGIN ? 204 : 403, headers: donationCorsHeaders(origin) })
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get('origin')
  if (origin !== DONATION_ORIGIN) return NextResponse.json({ error: 'Origin is not allowed.' }, { status: 403 })
  const { id } = await params
  const headers = { ...donationCorsHeaders(origin), 'Cache-Control': 'no-store' }
  if (!isDonationId(id)) return NextResponse.json({ error: 'Donation not found.' }, { status: 404, headers })
  try {
    const { data, error } = await createSupabaseServiceClient().from('donations')
      .select('id, amount_cents, currency, status, paid_at, created_at')
      .eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Donation not found.' }, { status: 404, headers })
    return NextResponse.json({ donationId: data.id, status: data.status, amount: (data.amount_cents / 100).toFixed(2), currency: data.currency, paidAt: data.paid_at, createdAt: data.created_at }, { headers })
  } catch (error) {
    console.error('Unable to read donation status:', error)
    return NextResponse.json({ error: 'Unable to read donation status.' }, { status: 503, headers })
  }
}
