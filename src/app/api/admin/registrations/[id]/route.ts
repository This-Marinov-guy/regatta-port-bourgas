import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import {
  deleteRegistration,
  updateRegistrationDetails,
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
    const body = (await request.json()) as Record<string, unknown>
    const { status, feedback, paymentStatus } = body as {
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

    if (body.editableFields) {
      if (!body.editableFields || typeof body.editableFields !== 'object') {
        return NextResponse.json({ error: 'Invalid registration fields.' }, { status: 400 })
      }

      const data = await updateRegistrationDetails(
        id,
        body.editableFields as Record<string, unknown>,
      )
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  try {
    const { id } = await params
    await deleteRegistration(id)
    return NextResponse.json({ data: { id } })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to delete registration.' },
      { status: 400 }
    )
  }
}
