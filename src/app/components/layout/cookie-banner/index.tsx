'use client'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'

const CookieBanner = () => {
  const t = useTranslations('cookieBanner')
  const [showBanner, setShowBanner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check if user has already made a choice in localStorage
    const checkCookieConsent = () => {
      try {
        const cookieConsent = localStorage.getItem('cookieConsent')
        // Show banner only if there's no value or if the value is invalid
        if (!cookieConsent || (cookieConsent !== 'all' && cookieConsent !== 'mandatory')) {
          setShowBanner(true)
        }
      } catch (error) {
        // If localStorage is not available, show the banner
        console.error('Error accessing localStorage:', error)
        setShowBanner(true)
      }
    }
    
    checkCookieConsent()
  }, [])

  const handleAccept = (type: 'all' | 'mandatory') => {
    try {
      localStorage.setItem('cookieConsent', type)
      setShowBanner(false)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  if (!mounted || !showBanner) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="container mx-auto max-w-8xl">
        <div className="bg-white dark:bg-dark border border-black/10 dark:border-white/10 rounded-lg md:rounded-xl shadow-2xl p-4 md:p-6 lg:p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex-1">
              <div className="flex items-start gap-3 mb-2">
                <Icon 
                  icon="ph:cookie-bold" 
                  width={24} 
                  height={24} 
                  className="text-primary flex-shrink-0 mt-0.5" 
                />
                <h3 className="text-lg md:text-xl font-semibold text-dark dark:text-white">
                  {t('title')}
                </h3>
              </div>
              <p className=" md:text-base text-dark/70 dark:text-white/70 leading-relaxed">
                {t('description')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                onClick={() => handleAccept('mandatory')}
                className="px-4 md:px-6 py-2.5 md:py-3 rounded-md border border-dark dark:border-white bg-transparent text-dark dark:text-white hover:bg-dark dark:hover:bg-white hover:text-white dark:hover:text-dark transition-colors duration-300  md:text-base font-medium whitespace-nowrap"
              >
                {t('mandatoryOnly')}
              </button>
              <button
                onClick={() => handleAccept('all')}
                className="px-4 md:px-6 py-2.5 md:py-3 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors duration-300  md:text-base font-medium whitespace-nowrap"
              >
                {t('acceptAll')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner
