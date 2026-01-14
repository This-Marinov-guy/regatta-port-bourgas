'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { useTranslations } from 'next-intl'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/app/components/ui/accordion'

type GalleryPhoto = {
  src: string
  alt: string
}

type PreviewPhoto = GalleryPhoto & {
  year: string
}

export default function GalleryAccordion() {
  const t = useTranslations('gallery')

  const photosByYear = useMemo<Record<string, GalleryPhoto[]>>(
    () => ({
      '2024': [
        {
          src: '/images/gallery/156467829050067899964_1575360175934432_1389068341368324096_o.jpg',
          alt: t('photos.2024.0')
        },
        {
          src: '/images/gallery/156467829049967824348_1575368012600315_7815880630838755328_o.jpg',
          alt: t('photos.2024.1')
        },
        {
          src: '/images/gallery/156467829049467783122_1575360045934445_1886569139296796672_o.jpg',
          alt: t('photos.2024.2')
        }
      ],
      '2025': [
        {
          src: '/images/gallery/156467829049067701756_1575359959267787_7588640456737554432_o.jpg',
          alt: t('photos.2025.0')
        },
        {
          src: '/images/gallery/156467829048867671567_1575360165934433_153690572849152000_o.jpg',
          alt: t('photos.2025.1')
        },
        {
          src: '/images/gallery/156467829048767649711_1575359452601171_5341553343162482688_o.jpg',
          alt: t('photos.2025.2')
        }
      ]
    }),
    [t]
  )

  const years = useMemo(() => Object.keys(photosByYear), [photosByYear])

  const [preview, setPreview] = useState<PreviewPhoto | null>(null)

  // Close on Escape + lock scroll when preview is open
  useEffect(() => {
    if (!preview) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null)
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [preview])

  return (
    <>
      <Accordion type="single" collapsible defaultValue={years[0]}>
        {years.map((year) => (
          <AccordionItem key={year} value={year} className="border-b border-black/10 dark:border-white/10">
            <AccordionTrigger className="px-4 sm:px-6">
              <div className="flex items-center justify-between w-full">
                <span className="text-base sm:text-lg md:text-xl font-semibold">
                  {year}
                </span>
                <span className="text-sm text-dark/60 dark:text-white/60">
                  {photosByYear[year].length} {t('photosLabel')}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 sm:px-6 pb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4">
                {photosByYear[year].map((photo, idx) => (
                  <button
                    key={photo.src}
                    type="button"
                    onClick={() => setPreview({ ...photo, year })}
                    className="group relative overflow-hidden rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={t('openPreview', { year, index: idx + 1 })}
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 360px"
                        unoptimized={true}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="inline-flex items-center gap-1 rounded-md bg-white/90 text-dark px-2 py-1 text-xs font-semibold">
                          <Icon icon="ph:magnifying-glass-plus-bold" width={14} height={14} />
                          {t('preview')}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {preview && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 p-4 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={t('previewDialogLabel', { year: preview.year })}
          onMouseDown={(e) => {
            // click outside closes
            if (e.target === e.currentTarget) setPreview(null)
          }}
        >
          <div className="relative w-full max-w-5xl rounded-xl overflow-hidden bg-black">
            <button
              type="button"
              onClick={() => setPreview(null)}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center rounded-md bg-white/90 text-dark w-10 h-10 hover:bg-white transition-colors"
              aria-label={t('close')}
            >
              <Icon icon="ph:x-bold" width={18} height={18} />
            </button>

            <div className="relative w-full h-[70vh] sm:h-[75vh]">
              <Image
                src={preview.src}
                alt={preview.alt}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
                unoptimized={true}
              />
            </div>

            <div className="p-3 sm:p-4 bg-dark text-white/80 text-xs sm:text-sm flex items-center justify-between gap-3">
              <span className="truncate">
                {preview.year} — {preview.alt}
              </span>
              <span className="text-white/60 whitespace-nowrap">{t('tapOutsideToClose')}</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

