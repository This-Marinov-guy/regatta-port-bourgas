'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { KeyRound, LoaderCircle, Trash2 } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type AdminPasskey = {
  id: string
  friendly_name?: string
  created_at: string
  last_used_at?: string
}

const passkeyUnavailableError =
  'Passkeys are not enabled for this Supabase project yet.'

function passkeyMessage(error: unknown, fallback: string) {
  const message =
    typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: string }).message || '')
      : ''
  const lower = message.toLowerCase()

  if (lower.includes('passkey') && lower.includes('disabled')) {
    return passkeyUnavailableError
  }

  if (lower.includes('cancel') || lower.includes('abort')) {
    return 'Passkey registration was cancelled.'
  }

  return message || fallback
}

function formatPasskeyDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}

type AdminPasskeySettingsProps = {
  open: boolean
}

export default function AdminPasskeySettings({
  open
}: AdminPasskeySettingsProps) {
  const [loading, setLoading] = useState(false)
  const [loadingPasskeys, setLoadingPasskeys] = useState(false)
  const [passkeys, setPasskeys] = useState<AdminPasskey[]>([])

  async function refreshPasskeys() {
    setLoadingPasskeys(true)

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.passkey.list()

    setLoadingPasskeys(false)

    if (error) {
      toast.error(passkeyMessage(error, 'Could not load passkeys.'))
      return
    }

    setPasskeys(data ?? [])
  }

  useEffect(() => {
    if (open) {
      void refreshPasskeys()
    }
  }, [open])

  async function handleAddPasskey() {
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.registerPasskey()

    if (!error && data?.id) {
      const { error: updateError } = await supabase.auth.passkey.update({
        passkeyId: data.id,
        friendlyName: 'Regatta Port Bourgas Admin'
      })

      if (updateError) {
        setLoading(false)
        toast.error(
          passkeyMessage(
            updateError,
            'Passkey connected, but could not name it.'
          )
        )
        await refreshPasskeys()
        return
      }
    }

    setLoading(false)

    if (error) {
      toast.error(passkeyMessage(error, 'Could not connect passkey.'))
      return
    }

    toast.success('Passkey connected.')
    await refreshPasskeys()
  }

  async function handleDeletePasskey(passkeyId: string) {
    setLoading(true)

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.passkey.delete({ passkeyId })

    setLoading(false)

    if (error) {
      toast.error(passkeyMessage(error, 'Could not remove passkey.'))
      return
    }

    setPasskeys((items) => items.filter((item) => item.id !== passkeyId))
    toast.success('Passkey removed.')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm leading-6 text-dark/65">
          Use Face ID, Touch ID, a device PIN, or a security key to sign in
          without a password.
        </p>
        <button
          type="button"
          onClick={() => void handleAddPasskey()}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <KeyRound className="h-4 w-4" aria-hidden="true" />
          )}
          {loading ? 'Working...' : 'Add passkey'}
        </button>
      </div>

      <div className="divide-y divide-black/10 rounded-2xl border border-black/10 px-4">
        {loadingPasskeys ? (
          <p className="py-4 text-sm text-dark/55">Loading passkeys...</p>
        ) : passkeys.length === 0 ? (
          <p className="py-4 text-sm text-dark/55">No passkeys connected.</p>
        ) : (
          passkeys.map((passkey) => (
            <div
              key={passkey.id}
              className="flex items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="text-sm font-medium text-dark">
                  {passkey.friendly_name || 'Passkey'}
                </p>
                <p className="text-xs text-dark/55">
                  {passkey.last_used_at
                    ? `Last used ${formatPasskeyDate(passkey.last_used_at)}`
                    : `Added ${formatPasskeyDate(passkey.created_at)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDeletePasskey(passkey.id)}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-black/10 px-3 py-2 text-xs font-medium text-dark/65 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
