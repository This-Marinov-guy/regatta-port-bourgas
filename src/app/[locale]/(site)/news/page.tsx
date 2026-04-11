import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import NewsCard from '@/app/components/news/NewsCard'
import { getNews } from '@/lib/news'
import Breadcrumb from '@/app/components/breadcrumb'
import { localizeText } from '@/lib/localizedContent'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'news' })
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
      canonical: `${siteUrl}/${locale}/news`,
      languages: { en: `${siteUrl}/en/news`, bg: `${siteUrl}/bg/news` },
    },
  }
}

export default async function NewsPage() {
  const t = await getTranslations()
  const locale = await getLocale()

  const news = await getNews()

  return (
    <main className="site-page-bg">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Breadcrumb
          image="/images/breadcrumbs/2.jpg"
          links={[
            { href: `/${locale}`, text: t('navigation.home') },
            { href: `/${locale}/news`, text: t('news.title') }
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <NewsCard
              key={item.id}
              href={`/news/${item.slug}`}
              title={localizeText(locale, item.name_en, item.name_bg)}
              description={localizeText(locale, item.description_en, item.description_bg)}
              date={item.created_at}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
