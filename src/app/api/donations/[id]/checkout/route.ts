import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { donationBaseUrl, donationCheckoutPage, isDonationId } from '@/lib/donations'
import {
  assertMyposConfigured,
  assertMyposReturnUrl,
  buildMyposPurchaseFields,
  getMyposCheckoutEndpoint,
} from '@/lib/mypos/server'

export const runtime = 'nodejs'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    assertMyposConfigured('donations')
    const { id } = await params
    if (!isDonationId(id)) return new Response('Checkout not found.', { status: 404 })
    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase.from('donations')
      .select('id, amount_cents, currency, name, order_id, status')
      .eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) return new Response('Checkout not found.', { status: 404 })
    if (data.status !== 'pending') return new Response('This checkout is no longer pending.', { status: 409 })

    const baseUrl = donationBaseUrl(request)
    const okUrl = `${baseUrl}/api/donations/${id}/return?result=success`
    const cancelUrl = `${baseUrl}/api/donations/${id}/return?result=failure`
    const notifyUrl = `${baseUrl}/api/mypos/webhook/checkout`
    for (const url of [okUrl, cancelUrl, notifyUrl]) assertMyposReturnUrl(url)
    const fields = buildMyposPurchaseFields({
      profile: 'donations',
      amountCents: data.amount_cents,
      currency: data.currency,
      orderId: data.order_id,
      okUrl,
      cancelUrl,
      notifyUrl,
      customerEmail: '',
      customerName: data.name ?? '',
      itemName: '50 Години Яхт Клуб "Порт Бургас"',
      itemQuantity: 1,
      itemUnitAmountCents: data.amount_cents,
    })
    return new Response(donationCheckoutPage(getMyposCheckoutEndpoint(), fields), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': `default-src 'none'; script-src 'unsafe-inline'; form-action ${new URL(getMyposCheckoutEndpoint()).origin}; style-src 'none'`,
      },
    })
  } catch (error) {
    console.error('Unable to open donation checkout:', error)
    return new Response('Donation checkout is unavailable.', { status: 503 })
  }
}
