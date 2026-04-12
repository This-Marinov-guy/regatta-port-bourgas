'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/app/components/ui/button'
import EventRegistrationForm from '@/app/components/events/EventRegistrationForm'

type Props = {
  eventId: string
  eventTitle: string
  eventDate: string
}

const ANIMATION_DURATION_MS = 240

export default function EventRegistrationModal({
  eventId,
  eventTitle,
  eventDate,
}: Props) {
  const t = useTranslations('events')
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const isOpen = searchParams.get('register') === '1'
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [isVisible, setIsVisible] = useState(false)
  const closeTimeoutRef = useRef<number | null>(null)

  function clearCloseTimeout() {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  function finishClose() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('register')
    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
    router.replace(nextUrl, { scroll: false })
  }

  function closeModal() {
    clearCloseTimeout()
    setIsVisible(false)
    closeTimeoutRef.current = window.setTimeout(() => {
      finishClose()
    }, ANIMATION_DURATION_MS)
  }

  useEffect(() => {
    if (isOpen) {
      clearCloseTimeout()
      setShouldRender(true)
      const frame = window.requestAnimationFrame(() => {
        setIsVisible(true)
      })

      return () => {
        window.cancelAnimationFrame(frame)
      }
    }

    if (shouldRender) {
      clearCloseTimeout()
      setIsVisible(false)
      closeTimeoutRef.current = window.setTimeout(() => {
        setShouldRender(false)
      }, ANIMATION_DURATION_MS)
    }
  }, [isOpen, shouldRender])

  useEffect(() => {
    if (!shouldRender) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('register')
        const nextUrl = params.toString()
          ? `${pathname}?${params.toString()}`
          : pathname
        router.replace(nextUrl, { scroll: false })
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pathname, router, searchParams, shouldRender])

  useEffect(() => {
    return () => {
      clearCloseTimeout()
    }
  }, [])

  if (!shouldRender) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[100] backdrop-blur-sm transition-all duration-200 ease-out ${
        isVisible ? 'bg-black/65 opacity-100' : 'bg-black/0 opacity-0'
      }`}
    >
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={closeModal}
      />

      <div className="relative h-full w-full overflow-y-auto">
        <div className="min-h-full px-4 py-4 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
          <div
            className={`mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col rounded-[2rem] border border-black/10 bg-[#f8f6ef] shadow-2xl transition-all duration-200 ease-out dark:border-white/10 dark:bg-[#11110f] sm:min-h-[calc(100vh-3rem)] ${
              isVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-6 scale-[0.985] opacity-0'
            }`}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-[2rem] border-b border-black/10 bg-[#f8f6ef]/95 px-5 py-5 backdrop-blur dark:border-white/10 dark:bg-[#11110f]/95 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary/80">
                  {t('registerModalEyebrow')}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-dark dark:text-white sm:text-3xl">
                  {eventTitle}
                </h2>
                <p className="mt-2 text-sm font-medium text-dark/60 dark:text-white/60">
                  {eventDate}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                className="rounded-xl border-black/10 bg-white text-dark dark:border-white/10 dark:bg-black/20 dark:text-white"
              >
                {t('closeRegistration')}
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6">
              <EventRegistrationForm
                eventId={eventId}
                onCancel={closeModal}
                onSuccess={closeModal}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
