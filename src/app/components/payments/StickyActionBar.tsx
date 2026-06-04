'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function StickyActionBar({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show the sticky bar whenever the inline actions are out of view.
        setShowSticky(!entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={ref} className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {children}
      </div>

      <div
        aria-hidden={!showSticky}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 px-5 py-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 dark:border-white/10 dark:bg-black/80 ${
          showSticky
            ? 'translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-full opacity-0'
        }`}
      >
        <div className="container mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3">
          {children}
        </div>
      </div>
    </>
  )
}
