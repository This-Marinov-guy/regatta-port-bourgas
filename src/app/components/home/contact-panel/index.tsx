'use client'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { CLUB_PHONE } from '@/utils/defines/CONTACTS'
import { CLUB_FB, CLUB_INSTA } from '@/utils/defines/SOCIAL'
import Link from 'next/link'

const ContactPanel: React.FC = () => {
  const t = useTranslations('contactPanel')

  return (
    <div className="fixed bottom-6 left-6 z-50 hidden lg:block">
      <div className="bg-white/95 dark:bg-black/95 backdrop-blur-sm rounded-lg p-5 shadow-lg border border-white/20 dark:border-white/10 min-w-[200px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon
              icon="ph:phone-bold"
              width={20}
              height={20}
              className="text-primary"
            />
            <p className=" font-semibold text-dark dark:text-white">
              {t('contact')}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
            <a
              href={`tel:${CLUB_PHONE.replace(/\s/g, '')}`}
              className="flex items-center gap-2  text-dark dark:text-white hover:text-primary transition-colors"
            >
              <Icon
                icon="ph:phone-fill"
                width={16}
                height={16}
                className="text-primary"
              />
              <span>{CLUB_PHONE}</span>
            </a>
            
            {/* <a
              href={`mailto:${CLUB_EMAIL}`}
              className="flex items-center gap-2  text-dark dark:text-white hover:text-primary transition-colors"
            >
              <Icon
                icon="ph:envelope-fill"
                width={16}
                height={16}
                className="text-primary"
              />
              <span className="break-all">{CLUB_EMAIL}</span>
            </a> */}
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-black/10 dark:border-white/10">
            <Link
              href={CLUB_FB}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark dark:text-white hover:text-primary transition-colors"
              aria-label="Facebook"
            >
              <Icon
                icon="ph:facebook-logo-fill"
                width={20}
                height={20}
              />
            </Link>
            <Link
              href={CLUB_INSTA}
              target="_blank"
              rel="noopener noreferrer"
              className="text-dark dark:text-white hover:text-primary transition-colors"
              aria-label="Instagram"
            >
              <Icon
                icon="ph:instagram-logo-fill"
                width={20}
                height={20}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPanel
