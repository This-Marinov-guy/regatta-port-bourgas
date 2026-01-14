import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import NewsCard from '@/app/components/news/NewsCard'
import { NEWS } from '@/lib/news'
import Image from 'next/image'

export default async function LatestNews() {
  const t = await getTranslations()

  // Get 3 latest news items, sorted by date (newest first)
  const latestNews = [...NEWS]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3)

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
              {t('news.latest')}
            </h2>
            <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base max-w-2xl">
              {t('news.previewSubtitle')}
            </p>
          </div>

          <Link
            href="/news"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary bg-primary text-white hover:bg-primary/90 transition-colors duration-300 font-semibold text-sm sm:text-base"
          >
            {t('news.seeMore')}
            <Image
              src="/images/SVGs/arrow-right.svg"
              alt="Arrow Right"
              className="ml-2 brightness-0 invert"
              width={24}
              height={24}
            />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestNews.map((news) => (
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
    </section>
  )
}
