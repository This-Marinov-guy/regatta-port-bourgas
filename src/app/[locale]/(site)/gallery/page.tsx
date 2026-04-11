import type { Metadata } from 'next'
import GalleryAccordion from '@/app/components/gallery/GalleryAccordion'
import { getLocale, getTranslations } from 'next-intl/server'
import Breadcrumb from '@/app/components/breadcrumb'

export const dynamic = 'force-dynamic'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'gallery' })
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      images: [{ url: `${siteUrl}/images/banner.png`, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('subtitle'), images: [`${siteUrl}/images/banner.png`] },
    alternates: {
      canonical: `${siteUrl}/${locale}/gallery`,
      languages: { en: `${siteUrl}/en/gallery`, bg: `${siteUrl}/bg/gallery` },
    },
  }
}

export default async function GalleryPage() {
  const t = await getTranslations('gallery')
  const tCommon = await getTranslations()
  const locale = await getLocale()

  return (
    <main className="site-page-bg">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Breadcrumb
          image="/images/breadcrumbs/3.jpg"
          links={[
            { href: `/${locale}`, text: tCommon('navigation.home') },
            { href: `/${locale}/gallery`, text: t('title') }
          ]}
        />

        <GalleryAccordion />
      </div>
    </main>
  )
}

