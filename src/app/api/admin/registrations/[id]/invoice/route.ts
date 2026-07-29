import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { updateRegistrationInvoice } from '@/lib/adminContent'

export async function POST() {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  return NextResponse.json(
    {
      error:
        'Invoice generation through Stripe is no longer available after the myPOS migration.',
    },
    { status: 410 }
  )
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAdminUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = (await request.json()) as { invoice_data?: unknown }
    const data = await updateRegistrationInvoice(id, body.invoice_data)

    return NextResponse.json({ data })
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
