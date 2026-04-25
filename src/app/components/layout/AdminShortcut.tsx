'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'

type Props = {
  variant?: 'header' | 'mobile'
  isHomepage?: boolean
  isSticky?: boolean
}

export default function AdminShortcut({ variant = 'header', isHomepage = false, isSticky = false }: Props) {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getSession().then(({ data }) => {
      setIsAdmin(!!data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!isAdmin) return null

  if (variant === 'mobile') {
    return (
      <Link
        href="/admin"
        className="flex items-center gap-3 px-4 py-3 mt-4 rounded-md text-base font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <Icon icon="ph:user-check-bold" width={20} height={20} className="text-white/70" />
        Admin dashboard
      </Link>
    )
  }

  return (
    <Link
      href="/admin"
      aria-label="Admin dashboard"
      title="Admin dashboard"
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 hover:scale-105 ${
        isHomepage && !isSticky
          ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
          : 'border-dark/10 bg-dark/5 text-dark hover:bg-dark/10'
      }`}
    >
      <Icon icon="ph:user-bold" width={18} height={18} />
    </Link>
  )
}
