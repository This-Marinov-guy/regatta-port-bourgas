import { getTranslations } from 'next-intl/server'
import NewsCard from '@/app/components/news/NewsCard'
import { NEWS } from '@/lib/news'

export default async function NewsPage() {
  const t = await getTranslations()

  // Sort by date, newest first
  const sortedNews = [...NEWS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <main className="bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <div className="mb-10 md:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
            {t('news.title')}
          </h1>
          <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base max-w-3xl">
            {t('news.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedNews.map((news) => (
            <NewsCard
              key={news.slug}
              href={`/news/${news.slug}`}
              title={t(news.titleKey)}
              description={t(news.descriptionKey)}
              date={news.date}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
