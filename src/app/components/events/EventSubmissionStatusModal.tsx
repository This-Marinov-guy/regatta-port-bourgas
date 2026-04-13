'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@iconify/react'
import { createPortal } from 'react-dom'
import { Button } from '@/app/components/ui/button'

type Props = {
  status: 'loading' | 'success' | 'error'
  title: string
  message: string
  closeLabel: string
  onClose: () => void
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
}

export default function EventSubmissionStatusModal({
  status,
  title,
  message,
  closeLabel,
  onClose,
  actionLabel,
  onAction,
  actionDisabled = false,
}: Props) {
  const [mounted, setMounted] = useState(false)
  const isLoading = status === 'loading'
  const isSuccess = status === 'success'

  useEffect(() => {
    setMounted(true)

    return () => {
      setMounted(false)
    }
  }, [])

  if (!mounted) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[145] bg-black/55 px-4 py-6 backdrop-blur-sm">
      {!isLoading ? (
        <div
          className="absolute inset-0"
          aria-hidden="true"
          onClick={onClose}
        />
      ) : null}
      <div className="relative mx-auto flex min-h-full max-w-xl items-center justify-center">
        <div className="w-full rounded-[1.75rem] border border-black/10 bg-[#f8f6ef] p-6 shadow-2xl dark:border-white/10 dark:bg-[#11110f] sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div
              className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${
                isLoading
                  ? 'bg-primary/12 text-primary'
                  : isSuccess
                    ? 'bg-emerald-500/12 text-emerald-600'
                    : 'bg-red-500/12 text-red-500'
              }`}
            >
              {isLoading ? (
                <Icon
                  icon="ph:spinner-gap-bold"
                  width={30}
                  height={30}
                  className="animate-spin"
                />
              ) : isSuccess ? (
                <Icon icon="ph:check-circle-bold" width={30} height={30} />
              ) : (
                <Icon icon="ph:warning-circle-bold" width={30} height={30} />
              )}
            </div>

            <h3 className="mt-5 text-2xl font-semibold text-dark dark:text-white">
              {title}
            </h3>
            <p className="mt-3  leading-7 text-dark/75 dark:text-white/75">
              {message}
            </p>

            {!isLoading ? (
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
                {actionLabel && onAction ? (
                  <Button
                    type="button"
                    onClick={onAction}
                    disabled={actionDisabled}
                    className="rounded-xl px-5 text-white"
                  >
                    {actionLabel}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl border-black/10 bg-white text-dark dark:border-white/10 dark:bg-black/20 dark:text-white"
                >
                  {closeLabel}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
