'use client'

import { useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import { PhotoProvider } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/app/components/ui/accordion'
import GalleryPhotoGrid from './GalleryPhotoGrid'
import type { GalleryPhoto } from '@/lib/googleDriveGallery'

type GalleryAccordionClientProps = {
  years: string[]
  photosByYear: Record<string, GalleryPhoto[]>
  defaultYear: string
}

export default function GalleryAccordionClient({
  years,
  photosByYear,
  defaultYear
}: GalleryAccordionClientProps) {
  const t = useTranslations('gallery')

  return (
    <PhotoProvider
      speed={() => 300}
      easing={(type) =>
        type === 2 ? 'cubic-bezier(0.36, 0, 0.66, -0.56)' : 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
      toolbarRender={({ rotate, onRotate, scale, onScale, images, index }) => {
        const handleDownload = async () => {
          const image = images[index]
          if (!image?.src) return
          
          try {
            const response = await fetch(image.src)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            
            // Extract filename from URL or use default
            const urlPath = new URL(image.src, window.location.origin).pathname
            const filename = decodeURIComponent(
              urlPath.split('/').pop() || `image-${index + 1}.jpg`
            )
            link.download = filename
            
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
          } catch (error) {
            console.error('Download failed:', error)
          }
        }

        return (
          <div className="flex items-center gap-2 bg-white/90 dark:bg-dark/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-black/10 dark:border-white/10">
            <button
              onClick={() => onScale(1)}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-dark dark:text-white"
              aria-label="Reset zoom"
              title="Reset zoom"
            >
              <Icon icon="ph:arrows-out-bold" width={20} height={20} />
            </button>
            <button
              onClick={() => onScale(scale + 0.5)}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-dark dark:text-white"
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Icon icon="ph:plus-bold" width={20} height={20} />
            </button>
            <button
              onClick={() => onScale(Math.max(0.5, scale - 0.5))}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-dark dark:text-white"
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Icon icon="ph:minus-bold" width={20} height={20} />
            </button>
            <button
              onClick={() => onRotate(rotate + 90)}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-dark dark:text-white"
              aria-label="Rotate"
              title="Rotate"
            >
              <Icon icon="ph:arrow-clockwise-bold" width={20} height={20} />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-dark dark:text-white"
              aria-label="Download"
              title="Download"
            >
              <Icon icon="ph:download-bold" width={20} height={20} />
            </button>
          </div>
        )
      }}
    >
      <Accordion type="single" collapsible defaultValue={defaultYear} className="space-y-2">
        {years.map((year) => (
          <AccordionItem
            key={year}
            value={year}
            className="border-b border-black/10 dark:border-white/10 transition-all duration-300"
          >
            <AccordionTrigger className="px-4 sm:px-6 transition-all duration-300 hover:bg-dark/5 dark:hover:bg-white/5">
              <div className="flex items-center justify-between w-full">
                <span className="text-base sm:text-lg md:text-xl font-semibold transition-colors duration-200">
                  {year}
                </span>
                <span className="text-sm text-dark/60 dark:text-white/60">
                  {photosByYear[year].length} {t('photosLabel')}
                </span>
              </div>
            </AccordionTrigger>

            <AccordionContent className="px-4 sm:px-6 pb-6 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <GalleryPhotoGrid
                photos={photosByYear[year]}
                year={year}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </PhotoProvider>
  )
}
