import { NextResponse } from 'next/server'
import { getMyposConfigurationStatus } from '@/lib/mypos/server'

export function GET() {
  const status = getMyposConfigurationStatus()

  return NextResponse.json({
    data: {
      enabled: status.enabled,
    },
  })
}
