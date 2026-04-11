import { getTranslations, getLocale } from 'next-intl/server'
import NewsCard from '@/app/components/news/NewsCard'
import { getNews } from '@/lib/news'
import Breadcrumb from '@/app/components/breadcrumb'

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
              title={locale === 'bg' ? item.name_bg : item.name_en}
              description={
                (locale === 'bg' ? item.description_bg : item.description_en) ?? ''
              }
              date={item.created_at}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
