import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'
import { updateRegistrationStatus } from '@/lib/adminContent'
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
    const { status } = (await request.json()) as { status: RegistrationRecord['status'] }

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 })
    }

    const data = await updateRegistrationStatus(id, status)
    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to update registration.' },
      { status: 400 }
    )
  }
}
