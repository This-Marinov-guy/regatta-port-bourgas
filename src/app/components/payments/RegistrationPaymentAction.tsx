'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/app/components/ui/button'

type Props = {
  registrationId: string
  session: string
  locale: string
  buttonLabel: string
  loadingLabel: string
  errorMessage: string
}

export default function RegistrationPaymentAction({
  registrationId,
  session,
  locale,
  buttonLabel,
  loadingLabel,
  errorMessage,
}: Props) {
  const [loading, setLoading] = useState(false)

  async function startCheckout() {
    setLoading(true)

    try {
      const response = await fetch(`/api/registrations/${registrationId}/checkout`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ locale, session }),
      })
      const payload = (await response.json().catch(() => null)) as
        | { data?: { checkoutUrl?: string }; paid?: boolean }
        | null

      if (payload?.paid) {
        window.location.reload()
        return
      }

      if (!response.ok || !payload?.data?.checkoutUrl) {
        throw new Error(errorMessage)
      }

      window.location.assign(payload.data.checkoutUrl)
    } catch {
      toast.error(errorMessage)
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      onClick={startCheckout}
      disabled={loading}
      className="rounded-xl px-6 py-3 text-white"
    >
      {loading ? loadingLabel : buttonLabel}
    </Button>
  )
}
