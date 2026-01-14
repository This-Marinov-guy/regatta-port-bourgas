'use client'

import Image from 'next/image'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'
import { PhotoView } from 'react-photo-view'

type GalleryPhoto = {
  src: string
  alt: string
}

type GalleryPhotoGridProps = {
  photos: GalleryPhoto[]
  year: string
}

export default function GalleryPhotoGrid({ photos, year }: GalleryPhotoGridProps) {
  const t = useTranslations('gallery')

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
      {photos.map((photo, idx) => (
        <PhotoView
          key={photo.src}
          src={photo.src}
        >
          <button
            type="button"
            className="group relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
            style={{
              animation: `fade-in-up 0.5s ease-out ${idx * 50}ms both`
            }}
            aria-label={t('openPreview', { year, index: idx + 1 })}
          >
            <div className="relative aspect-square w-full">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
                unoptimized={true}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                <span className="inline-flex items-center gap-1 rounded-md bg-white/90 text-dark px-2 py-1 text-xs font-semibold shadow-lg">
                  <Icon icon="ph:magnifying-glass-plus-bold" width={14} height={14} />
                  {t('preview')}
                </span>
              </div>
            </div>
          </button>
        </PhotoView>
      ))}
    </div>
  )
}
