'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  CLIENT_LOCALE_HEADER,
  isAppLocale,
  persistClientLocale,
  persistClientRegion,
  readStoredClientLocale,
  readStoredManualClientLocale,
  readStoredClientRegion,
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

function getPathLocale(pathname: string) {
  const firstSegment = pathname.split('/')[1]
  return isAppLocale(firstSegment) ? firstSegment : null
}

function replacePathLocale(pathname: string, currentLocale: AppLocale, nextLocale: AppLocale) {
  const suffix = pathname === `/${currentLocale}`
    ? ''
    : pathname.slice(`/${currentLocale}`.length)

  return `/${nextLocale}${suffix || ''}`
}

function redirectToLocale(
  pathname: string,
  currentLocale: AppLocale | null,
  nextLocale: AppLocale,
) {
  const nextPath = currentLocale
    ? replacePathLocale(pathname, currentLocale, nextLocale)
    : `/${nextLocale}`

  window.location.replace(
    `${nextPath}${window.location.search}${window.location.hash}`,
  )
}

async function fetchClientRegion() {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 5000)

  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error('Unable to determine region.')
    }

    const payload = (await response.json()) as { country_code?: unknown }
    const countryCode =
      typeof payload.country_code === 'string' && payload.country_code.trim()
        ? payload.country_code.trim().toUpperCase()
        : 'UNKNOWN'

    return countryCode
  } catch {
    return 'UNKNOWN'
  } finally {
    window.clearTimeout(timeoutId)
  }
}

export default function LocalePersistence({ locale }: Props) {
  const pathname = usePathname()
  const regionCheckStartedRef = useRef(false)

  useLayoutEffect(() => {
    patchLocaleHeaderIntoFetch()
  }, [])

  useEffect(() => {
    const currentPathname = pathname ?? window.location.pathname
    const pathLocale = getPathLocale(currentPathname)
    const currentLocale = locale ?? pathLocale

    if (currentLocale === 'bg') {
      persistClientLocale('bg')
      return
    }

    if (currentLocale !== 'en' && currentPathname !== '/') {
      return
    }

    const manualLocale = readStoredManualClientLocale()
    if (manualLocale) {
      if (currentLocale !== manualLocale) {
        redirectToLocale(currentPathname, currentLocale, manualLocale)
      }
      return
    }

    const cachedRegion = readStoredClientRegion()
    if (cachedRegion) {
      persistClientLocale(cachedRegion.locale)
      if (currentLocale !== cachedRegion.locale) {
        redirectToLocale(currentPathname, currentLocale, cachedRegion.locale)
      }
      return
    }

    if (regionCheckStartedRef.current) {
      return
    }

    regionCheckStartedRef.current = true
    void fetchClientRegion().then((countryCode) => {
      const detectedLocale: AppLocale = countryCode === 'BG' ? 'bg' : 'en'
      persistClientRegion(countryCode, detectedLocale)
      persistClientLocale(detectedLocale)

      if (detectedLocale === 'bg') {
        redirectToLocale(currentPathname, currentLocale, detectedLocale)
      }
    })
  }, [locale, pathname])

  return null
}
