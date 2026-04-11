import GalleryAccordion from '@/app/components/gallery/GalleryAccordion'
import { getLocale, getTranslations } from 'next-intl/server'
import Breadcrumb from '@/app/components/breadcrumb'

export const dynamic = 'force-dynamic'

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

