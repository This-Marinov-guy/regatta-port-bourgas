'use client'
import { Icon } from '@iconify/react'
import Link from 'next/link'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import NavLink from './navigation/NavLink'
import { signOut, useSession } from 'next-auth/react'
import LanguageSwitcher from '../language-switcher'

const Header: React.FC = () => {
  const { data: session } = useSession();
  const [navLinks, setNavLinks] = useState<any>(null);
  const [user, setUser] = useState<{ user: any } | null>(null);
  const [sticky, setSticky] = useState(false)
  const [navbarOpen, setNavbarOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  const sideMenuRef = useRef<HTMLDivElement>(null)

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
        const res = await fetch('/api/layout-data')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setNavLinks(data?.navLinks)
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    document.addEventListener('mousedown', handleClickOutside)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [pathname,handleScroll])

  const isHomepage = pathname === '/'

  const handleSignOut = () => {
    localStorage.removeItem("user");
    signOut();
    setUser(null);
  };

  return (
    <header
      className={`fixed h-24 py-1 z-50 w-full bg-transparent transition-all duration-300 lg:px-0 px-4 ${
        sticky ? "top-3" : "top-0"
      }`}
    >
      <nav
        className={`container mx-auto max-w-8xl flex items-center justify-between py-4 duration-300 ${
          sticky
            ? "shadow-lg bg-white dark:bg-dark rounded-full top-5 px-4 "
            : "shadow-none top-0"
        }`}
      >
        <div className="flex justify-between items-center gap-2 w-full">
          <div>
            <Link href="/">
              <Image
                src={"/images/logos/logo-50.gif"}
                alt="logo"
                width={100}
                height={100}
                unoptimized={true}
                className={`logo ${
                  isHomepage
                    ? sticky
                      ? "block dark:hidden"
                      : "hidden"
                    : sticky
                    ? "block dark:hidden"
                    : "block dark:hidden"
                }`}
              />
              <Image
                src={"/images/logos/logo-50.gif"}
                alt="logo"
                width={100}
                height={100}
                unoptimized={true}
                className={`logo ${
                  isHomepage
                    ? sticky
                      ? "hidden dark:block"
                      : "block"
                    : sticky
                    ? "dark:block hidden"
                    : "dark:block hidden"
                }`}
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <LanguageSwitcher
              variant="header"
              isHomepage={isHomepage}
              isSticky={sticky}
            />

            <button
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
            </button>

            {(user?.user || session?.user) && (
              <div className="relative group flex items-center justify-center">
                <Image
                  src={"/images/avatar/avatar_1.jpg"}
                  alt="avatar"
                  width={35}
                  height={35}
                  className="rounded-full"
                />
                <p className="absolute w-fit text-sm font-medium text-center z-10 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-opacity duration-200 bg-primary dark:bg-middlegreen text-creamwhite py-1 px-2 min-w-28 rounded-xl shadow-2xl top-full left-1/2 transform -translate-x-1/2 mt-3">
                  {user?.user || session?.user?.name}
                </p>
              </div>
            )}

            <div className={`hidden md:block`}>
              <Link
                href="#"
                className={`text-base text-inherit flex items-center gap-2 border-r pr-6 ${
                  isHomepage
                    ? sticky
                      ? "text-dark dark:text-white hover:text-primary border-dark dark:border-white"
                      : "text-white hover:text-primary"
                    : "text-dark hover:text-primary"
                }`}
              >
                <Icon icon={"ph:phone-bold"} width={24} height={24} />
                +1-212-456-789
              </Link>
            </div>
            <div>
              <button
                onClick={() => setNavbarOpen(!navbarOpen)}
                className={`flex items-center gap-3 p-2 sm:px-5 sm:py-3 rounded-full font-semibold hover:cursor-pointer border ${
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
                <span className="hidden sm:block">Menu</span>
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
                {navLinks &&
                  navLinks?.map((item: any, index: any) => (
                    <NavLink
                      key={index}
                      item={item}
                      onClick={() => setNavbarOpen(false)}
                    />
                  ))}
                {user?.user || session?.user ? (
                  <>
                    <button
                      onClick={() => handleSignOut()}
                      className="py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full border border-primary font-semibold mt-3 hover:bg-transparent hover:text-primary duration-300 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <li className="flex items-center gap-4">
                    <Link
                      onClick={() => setNavbarOpen(false)}
                      href="/signin"
                      className="py-4 px-8 bg-primary text-base leading-4 block w-fit text-white rounded-full border border-primary font-semibold mt-3 hover:bg-transparent hover:text-primary duration-300"
                    >
                      Sign In
                    </Link>
                    <Link
                      onClick={() => setNavbarOpen(false)}
                      href="/signup"
                      className="py-4 px-8 bg-transparent border border-primary text-base leading-4 block w-fit text-primary rounded-full font-semibold mt-3 hover:bg-primary hover:text-white duration-300"
                    >
                      Sign up
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            <LanguageSwitcher
              variant="mobile"
              onLanguageChange={() => setNavbarOpen(false)}
            />
          </div>

          <div className="flex flex-col gap-1 my-16 text-white">
            <p className="text-base sm:text-xm font-normal text-white/40">
              Contact
            </p>
            <Link
              href="#"
              className="text-base sm:text-xm font-medium text-inherit hover:text-primary"
            >
              hello@homely.com
            </Link>
            <Link
              href="#"
              className="text-base sm:text-xm font-medium text-inherit hover:text-primary"
            >
              +1-212-456-7890{" "}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header
