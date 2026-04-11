import { getTranslations } from 'next-intl/server'
import { getGoogleDriveGallery } from '@/lib/googleDriveGallery'
import GalleryAccordionClient from './GalleryAccordionClient'

export default async function GalleryAccordion() {
  const t = await getTranslations('gallery')
  const gallery = await getGoogleDriveGallery()

  const photosByYear = Object.fromEntries(
    gallery.map((group) => [group.year, group.photos])
  )

  const years = gallery.map((group) => group.year)

  if (years.length === 0) {
    return (
      <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] px-6 py-8 text-sm text-dark/65 dark:text-white/65">
        {t('empty')}
      </div>
    )
  }

  return (
    <GalleryAccordionClient
      years={years}
      photosByYear={photosByYear}
      defaultYear={years[0]}
    />
  )
}
