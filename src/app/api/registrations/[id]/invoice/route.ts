import { NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import { normalizeRegistrationInvoiceData } from '@/lib/registrations/invoice'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const session = new URL(request.url).searchParams.get('session')

    if (!id || session !== id) {
      return NextResponse.json({ error: 'Invalid registration session.' }, { status: 401 })
    }

    const body = (await request.json()) as { invoice_data?: unknown }
    const invoiceData = normalizeRegistrationInvoiceData(body.invoice_data)

    if (!invoiceData) {
      return NextResponse.json(
        { error: 'Invoice details are required.' },
        { status: 400 },
      )
    }

    const supabase = createSupabaseServiceClient()
    const { data, error } = await supabase
      .from('registrations')
      .update({ invoice_data: invoiceData })
      .eq('id', id)
      .select('invoice_data')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save invoice details.',
      },
      { status: 400 },
    )
  }
}
