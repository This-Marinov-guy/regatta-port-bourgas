import GalleryAccordion from '@/app/components/gallery/GalleryAccordion'
import { getTranslations } from 'next-intl/server'

export default async function GalleryPage() {
  const t = await getTranslations('gallery')

  return (
    <main className="bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <div className="mb-10 md:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
            {t('title')}
          </h1>
          <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base max-w-3xl">
            {t('subtitle')}
          </p>
        </div>

        <GalleryAccordion />
      </div>
    </main>
  )
}

