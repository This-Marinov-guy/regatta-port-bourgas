'use client'

import { useEffect, useState } from 'react'

type Props = {
  dateFrom: string
  dateTo: string
  label: string
}

function isTodayBetween(dateFrom: string, dateTo: string) {
  const now = new Date()
  const from = new Date(dateFrom)
  const to = new Date(dateTo)

  // Compare by timestamp (inclusive)
  const t = now.getTime()
  return t >= from.getTime() && t <= to.getTime()
}

export default function CurrentEventBadge({ dateFrom, dateTo, label }: Props) {
  const [isCurrent, setIsCurrent] = useState(false)

  useEffect(() => {
    setIsCurrent(isTodayBetween(dateFrom, dateTo))
  }, [dateFrom, dateTo])

  if (!isCurrent) return null

  return (
    <div className="absolute top-3 right-3 z-10">
      <span className="inline-flex items-center rounded-md bg-primary text-white  font-semibold px-2.5 py-1 shadow-lg">
        {label}
      </span>
    </div>
  )
}

