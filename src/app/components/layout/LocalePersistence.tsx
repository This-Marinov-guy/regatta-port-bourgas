'use client'

import { useEffect, useLayoutEffect } from 'react'
import {
  CLIENT_LOCALE_HEADER,
  persistClientLocale,
  readStoredClientLocale,
  type AppLocale,
} from '@/lib/locale'

declare global {
  interface Window {
    __regattaLocaleFetchPatched?: boolean
    __regattaOriginalFetch?: typeof window.fetch
  }
}

function resolveApiRequestUrl(input: RequestInfo | URL) {
  if (typeof window === 'undefined') {
    return null
  }

  if (typeof input === 'string') {
    return new URL(input, window.location.origin)
  }

  if (input instanceof URL) {
    return input
  }

  if (input instanceof Request) {
    return new URL(input.url, window.location.origin)
  }

  return null
}

function patchLocaleHeaderIntoFetch() {
  if (typeof window === 'undefined' || window.__regattaLocaleFetchPatched) {
    return
  }

  const originalFetch = window.fetch.bind(window)
  window.__regattaOriginalFetch = originalFetch

  window.fetch = async (input, init) => {
    const url = resolveApiRequestUrl(input)

    if (
      !url ||
      url.origin !== window.location.origin ||
      !url.pathname.startsWith('/api/')
    ) {
      return originalFetch(input, init)
    }

    const locale = readStoredClientLocale()

    if (!locale) {
      return originalFetch(input, init)
    }

    if (input instanceof Request) {
      const headers = new Headers(input.headers)

      if (!headers.has(CLIENT_LOCALE_HEADER)) {
        headers.set(CLIENT_LOCALE_HEADER, locale)
      }

      return originalFetch(new Request(input, { headers }), init)
    }

    const headers = new Headers(init?.headers)

    if (!headers.has(CLIENT_LOCALE_HEADER)) {
      headers.set(CLIENT_LOCALE_HEADER, locale)
    }

    return originalFetch(input, {
      ...init,
      headers,
    })
  }

  window.__regattaLocaleFetchPatched = true
}

type Props = {
  locale?: AppLocale
}

export default function LocalePersistence({ locale }: Props) {
  useLayoutEffect(() => {
    patchLocaleHeaderIntoFetch()
  }, [])

  useEffect(() => {
    const nextLocale = locale ?? readStoredClientLocale()

    if (nextLocale) {
      persistClientLocale(nextLocale)
    }
  }, [locale])

  return null
}
