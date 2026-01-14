import { getTranslations } from 'next-intl/server'
import GalleryAccordionClient from './GalleryAccordionClient'

type GalleryPhoto = {
  src: string
  alt: string
}

export default async function GalleryAccordion() {
  const t = await getTranslations('gallery')

  const photosByYear: Record<string, GalleryPhoto[]> = {
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
  }

  const years = Object.keys(photosByYear)

  return (
    <GalleryAccordionClient
      years={years}
      photosByYear={photosByYear}
      defaultYear={years[0]}
    />
  )
}
