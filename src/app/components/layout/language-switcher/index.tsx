'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { Icon } from '@iconify/react'

interface LanguageSwitcherProps {
  variant?: 'header' | 'mobile'
  isHomepage?: boolean
  isSticky?: boolean
  onLanguageChange?: () => void
}

export default function LanguageSwitcher({ 
  variant = 'header', 
  isHomepage = false, 
  isSticky = false,
  onLanguageChange 
}: LanguageSwitcherProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()

  const switchLocale = (newLocale: string) => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    // Navigate to new locale using next-intl router
    router.replace(pathWithoutLocale, { locale: newLocale })
    // Call callback if provided (e.g., to close mobile menu)
    if (onLanguageChange) {
      onLanguageChange()
    }
  }

  const languageNames: Record<string, string> = {
    en: 'English',
    bg: 'Български'
  }

  if (variant === 'mobile') {
    return (
      <div className="flex flex-col gap-3 mt-6">
        <p className="text-base font-semibold text-white/60 mb-2">Language</p>
        <div className="flex flex-col gap-2">
          {routing.locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={`flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors text-left ${
                locale === loc
                  ? 'bg-primary text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Icon 
                icon={locale === loc ? 'mdi:check-circle' : 'mdi:circle-outline'} 
                width={20} 
                height={20} 
                className={locale === loc ? 'text-white' : 'text-white/40'}
              />
              <span>{languageNames[loc] || loc.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-lg px-1.5 py-1">
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all duration-200 ${
            locale === loc
              ? 'bg-primary text-white shadow-sm'
              : isHomepage && !isSticky
                ? 'text-white hover:bg-white/20'
                : 'text-dark dark:text-white hover:bg-white/20 dark:hover:bg-white/10'
          }`}
          title={languageNames[loc] || loc.toUpperCase()}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

