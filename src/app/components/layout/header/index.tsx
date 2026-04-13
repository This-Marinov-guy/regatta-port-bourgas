'use client'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import NavLink from './navigation/NavLink'
import { signOut, useSession } from 'next-auth/react'
import LanguageSwitcher from '../language-switcher'
import { CLUB_PHONE } from '@/utils/defines/CONTACTS'
import type { NavLinks } from '@/app/types/navlink'

const Header: React.FC = () => {
  const { data: session } = useSession()
  const [user, setUser] = useState<{ user: string } | null>(null)
  const [sticky, setSticky] = useState(false)
  const [navbarOpen, setNavbarOpen] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()

  // Create fallback links using translations
  const fallbackLinks = useMemo<NavLinks[]>(() => [
    { label: t('navigation.home'), href: `/${locale}` },
    { label: t('navigation.aboutUs'), href: `/${locale}/about-us` },
    { label: t('navigation.events'), href: `/${locale}/events` },
    { label: t('navigation.news'), href: `/${locale}/news` },
    { label: t('navigation.gallery'), href: `/${locale}/gallery` },
    { label: t('navigation.contactUs'), href: `/${locale}/contact-us` },
    // { label: t('navigation.documents'), href: `/${locale}/documents` },
  ], [locale, t])

  const [navLinks, setNavLinks] = useState<NavLinks[]>(fallbackLinks)

  const sideMenuRef = useRef<HTMLDivElement>(null)
  const authDisplayName =
    user?.user || session?.user?.name || session?.user?.email || null

  const handleClickOutside = (event: MouseEvent) => {
    if (sideMenuRef.current && !sideMenuRef.current.contains(event.target as Node)) {
      setNavbarOpen(false)
    }
  }

  const handleScroll = useCallback(() => {
    setSticky(window.scrollY >= 50)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/layout-data?locale=${locale}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        // Check if links have proper translations (not raw keys)
        if (data?.navLinks && Array.isArray(data.navLinks) && data.navLinks.length > 0) {
          const hasValidTranslations = data.navLinks.every(
            (link: NavLinks) => link.label && !link.label.startsWith('navigation.')
          )
          if (hasValidTranslations) {
            setNavLinks(data.navLinks as NavLinks[])
          } else {
            // API returned keys instead of translations, use fallback
            setNavLinks(fallbackLinks)
          }
        } else {
          // Fallback to translated links
          setNavLinks(fallbackLinks)
        }
      } catch (error) {
        console.error('Error fetching nav links:', error)
        // Fallback to translated links on error
        setNavLinks(fallbackLinks)
      }
    }
    fetchData()
  }, [locale, fallbackLinks])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)

    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as { user?: unknown }
        setUser(
          typeof parsed?.user === 'string' && parsed.user.trim()
            ? { user: parsed.user.trim() }
            : null
        )
      } catch {
        localStorage.removeItem('user')
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pathname, handleScroll])

  const isHomepage = pathname === '/'

  const handleSignOut = () => {
    localStorage.removeItem('user')
    setNavbarOpen(false)
    signOut()
    setUser(null)
  }

  return (
    <header
      className={`fixed py-1 z-50 w-full bg-transparent transition-all duration-300 lg:px-0 px-4 ${
        sticky ? "top-3" : "top-0 rounded-b-3xl"
      }`}
    >
      <nav
        className={`container mx-auto max-w-8xl flex items-center justify-between transition-all duration-300 ${
          sticky
            ? "py-2 shadow-lg bg-white dark:bg-dark rounded-full px-4"
            : "py-4 shadow-none rounded-b-3xl"
        }`}
      >
        <div className="flex justify-between items-center gap-2 w-[98%] m-auto">
          <div>
            <Link href={`/${locale}`}>
              <div
                className="relative overflow-hidden transition-all duration-300"
                style={{ width: sticky ? 48 : 72, height: sticky ? 48 : 72 }}
              >
                <Image
                  src={"/images/logos/logo-50.gif"}
                  alt="logo"
                  fill
                  unoptimized
                  className={`object-contain rounded-full ${
                    isHomepage && !sticky ? "hidden sm:block" : "block"
                  }`}
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <LanguageSwitcher
              variant="header"
              isHomepage={isHomepage}
              isSticky={sticky}
            />

            {/* <button
              className="hover:cursor-pointer"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Icon
                icon={"solar:sun-bold"}
                width={32}
                height={32}
                className={`dark:hidden block ${
                  isHomepage
                    ? sticky
                      ? "text-dark"
                      : "text-white"
                    : "text-dark"
                }`}
              />
              <Icon
                icon={"solar:moon-bold"}
                width={32}
                height={32}
                className="dark:block hidden text-white"
              />
            </button> */}

            {authDisplayName ? (
              <div className="relative group flex items-center justify-center">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 ${
                    isHomepage
                      ? sticky
                        ? 'border-dark/10 bg-dark text-white dark:border-white/10 dark:bg-white dark:text-dark'
                        : 'border-white/20 bg-white text-dark'
                      : 'border-dark/10 bg-dark text-white dark:border-white/10 dark:bg-white dark:text-dark'
                  }`}
                  aria-label={authDisplayName}
                  title={authDisplayName}
                >
                  <Icon icon="ph:user-circle-bold" width={24} height={24} />
                </div>
                <p className="absolute w-fit  font-medium text-center z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 bg-primary dark:bg-middlegreen text-creamwhite py-1 px-2 min-w-28 rounded-xl shadow-2xl top-full left-1/2 transform -translate-x-1/2 mt-3">
                  {authDisplayName}
                </p>
              </div>
            ) : null}
            <div>
              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className={`flex items-center gap-3 p-2 sm:px-2 sm:py-2 rounded-full font-semibold hover:cursor-pointer border ${
                  isHomepage
                    ? sticky
                      ? "text-white bg-dark dark:bg-white dark:text-dark dark:hover:text-white dark:hover:bg-dark hover:text-dark hover:bg-white border-dark dark:border-white"
                      : "text-dark bg-white dark:text-dark hover:bg-transparent hover:text-white border-white"
                    : "bg-dark text-white hover:bg-transparent hover:text-dark dark:bg-white dark:text-dark dark:hover:bg-transparent dark:hover:text-white duration-300"
                }`}
                aria-label="Toggle mobile menu"
              >
                <span>
                  <Icon icon={"ph:list"} width={24} height={24} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {navbarOpen && (
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-40" />
      )}

      <div
        ref={sideMenuRef}
        className={`fixed top-0 right-0 h-full w-full bg-dark shadow-lg transition-transform duration-300 max-w-2xl ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        } z-50 px-20 overflow-auto no-scrollbar`}
      >
        <div className="flex flex-col h-full justify-between">
          <div className="">
            <div className="flex items-center justify-start py-10">
              <button
                onClick={() => setNavbarOpen(false)}
                aria-label="Close mobile menu"
                className="bg-white p-3 rounded-full hover:cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="none"
                    stroke="black"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col items-start gap-4">
              <ul className="w-full">
                {authDisplayName ? (
                  <li className="mb-6 flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-dark">
                      <Icon icon="ph:user-circle-bold" width={28} height={28} />
                    </div>
                    <div>
                      <p className=" font-semibold uppercase tracking-[0.2em] text-white/45">
                        Account
                      </p>
                      <p className="mt-1 text-base font-medium text-white">
                        {authDisplayName}
                      </p>
                    </div>
                  </li>
                ) : null}
                {navLinks &&
                  navLinks?.map((item, index) => (
                    <NavLink
                      key={index}
                      item={item}
                      onClick={() => setNavbarOpen(false)}
                    />
                  ))}
                {authDisplayName ? (
                  <li className="mt-6">
                    <button
                      onClick={() => handleSignOut()}
                      className="inline-flex items-center gap-3 rounded-full border border-primary bg-primary px-6 py-3 text-base font-semibold leading-4 text-white transition duration-300 hover:bg-transparent hover:text-primary"
                    >
                      <Icon icon="ph:sign-out-bold" width={18} height={18} />
                      Sign Out
                    </button>
                  </li>
                ) : null}
              </ul>
            </nav>

            <LanguageSwitcher
              variant="mobile"
              onLanguageChange={() => setNavbarOpen(false)}
            />
          </div>

          <div className="flex flex-col gap-1 my-16 text-white">
            <p className="text-base sm:text-xm font-normal text-white/40">
              {t('contactPanel.contact')}
            </p>
            {/* <Link
              href={`mailto:${CLUB_EMAIL}`}
              className="text-base sm:text-xm font-medium text-inherit hover:text-primary"
            >
              {CLUB_EMAIL}
            </Link> */}
            <Link
              href={`tel:${CLUB_PHONE.replace(/\s/g, '')}`}
              className="text-base sm:text-xm font-medium text-inherit hover:text-primary"
            >
              {CLUB_PHONE}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header
