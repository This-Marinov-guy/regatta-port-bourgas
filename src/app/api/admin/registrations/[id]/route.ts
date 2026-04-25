import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import {
  updateRegistrationPaymentStatus,
  updateRegistrationStatus,
} from '@/lib/adminContent'
import type { RegistrationRecord } from '@/types/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    const { status, feedback, paymentStatus } = (await request.json()) as {
      status?: RegistrationRecord['status']
      feedback?: string | null
      paymentStatus?: 'paid'
    }

    if (paymentStatus) {
      if (paymentStatus !== 'paid') {
        return NextResponse.json({ error: 'Invalid payment status.' }, { status: 400 })
      }

      const data = await updateRegistrationPaymentStatus(id, paymentStatus)
      return NextResponse.json({ data })
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    const data = await updateRegistrationStatus(id, status, feedback)
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update registration.' },
      { status: 400 }
    )
  }
}
