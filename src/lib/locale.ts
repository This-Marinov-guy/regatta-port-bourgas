export const APP_LOCALES = ['en', 'bg'] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const CLIENT_LOCALE_STORAGE_KEY = 'regatta-preferred-locale'
export const CLIENT_LOCALE_HEADER = 'x-regatta-locale'
export const CLIENT_LOCALE_COOKIE = 'NEXT_LOCALE'

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
