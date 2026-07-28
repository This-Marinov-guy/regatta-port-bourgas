export const APP_LOCALES = ['en', 'bg'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const CLIENT_LOCALE_STORAGE_KEY = 'regatta-preferred-locale'
export const CLIENT_REGION_STORAGE_KEY = 'regatta-ip-region'
export const CLIENT_MANUAL_LOCALE_STORAGE_KEY = 'regatta-manual-locale'
export const CLIENT_LOCALE_HEADER = 'x-regatta-locale'
export const CLIENT_LOCALE_COOKIE = 'NEXT_LOCALE'
export const CLIENT_REGION_COOKIE = 'REGATTA_REGION'
export const CLIENT_MANUAL_LOCALE_COOKIE = 'REGATTA_MANUAL_LOCALE'

export type ClientRegion = {
  countryCode: string
  locale: AppLocale
}

export function normalizeLocale(value: unknown): AppLocale {
  return value === 'bg' ? 'bg' : 'en'
}

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'en' || value === 'bg'
}

export function readLocaleFromRequest(request: Request): AppLocale {
  return normalizeLocale(request.headers.get(CLIENT_LOCALE_HEADER))
}

export function readStoredClientLocale() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(CLIENT_LOCALE_STORAGE_KEY)
    return isAppLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function readStoredManualClientLocale() {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(CLIENT_MANUAL_LOCALE_STORAGE_KEY)
    return isAppLocale(stored) ? stored : null
  } catch {
    return null
  }
}

export function readStoredClientRegion(): ClientRegion | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = window.localStorage.getItem(CLIENT_REGION_STORAGE_KEY)
    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored) as Partial<ClientRegion>
    if (
      typeof parsed.countryCode !== 'string' ||
      !parsed.countryCode ||
      !isAppLocale(parsed.locale)
    ) {
      return null
    }

    return {
      countryCode: parsed.countryCode,
      locale: parsed.locale,
    }
  } catch {
    return null
  }
}

export function persistClientRegion(countryCode: string, locale: AppLocale) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(
      CLIENT_REGION_STORAGE_KEY,
      JSON.stringify({
        countryCode: countryCode.toUpperCase(),
        locale,
      } satisfies ClientRegion),
    )
    document.cookie = `${CLIENT_REGION_COOKIE}=${countryCode.toUpperCase()}; path=/; max-age=31536000; SameSite=Lax`
  } catch {
    // Ignore localStorage failures and keep the current locale for this visit.
  }
}

export function persistClientLocale(locale: AppLocale) {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(CLIENT_LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignore localStorage failures and still try to persist via cookie.
  }

  document.cookie = `${CLIENT_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
}

export function persistManualClientLocale(locale: AppLocale) {
  persistClientLocale(locale)

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(CLIENT_MANUAL_LOCALE_STORAGE_KEY, locale)
    document.cookie = `${CLIENT_MANUAL_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`
  } catch {
    // Ignore localStorage failures and keep the current locale for this visit.
  }
}
