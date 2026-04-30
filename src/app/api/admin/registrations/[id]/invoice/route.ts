import { NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/adminAuth'

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
