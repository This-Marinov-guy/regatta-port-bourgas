import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Icon } from '@iconify/react'
import { NEWS } from '@/lib/news'

type Props = {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const news = NEWS.find((n) => n.slug === slug)

  if (!news) {
    return {}
  }

  const t = await getTranslations({ locale: (await params).locale })

  return {
    title: t(news.titleKey),
    description: t(news.descriptionKey),
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const t = await getTranslations()

  const news = NEWS.find((n) => n.slug === slug)

  if (!news) {
    notFound()
  }

  const formattedDate = format(new Date(news.date), 'MMMM dd, yyyy')

  return (
    <main className="bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Link
          href="/news"
          className="inline-flex items-center gap-2 font-semibold text-dark/70 dark:text-white/70 hover:text-primary transition-colors mb-6"
        >
          ← {t('news.back')}
        </Link>

        <article className="max-w-4xl">
          <div className="flex items-center gap-2 text-sm text-dark/60 dark:text-white/60 mb-4">
            <Icon icon="ph:calendar-blank-bold" width={18} height={18} className="text-primary" />
            <span>{formattedDate}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-6">
            {t(news.titleKey)}
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-dark/80 dark:text-white/80 mb-6 leading-relaxed">
              {t(news.descriptionKey)}
            </p>
            <div className="text-dark/70 dark:text-white/70 text-base leading-relaxed whitespace-pre-line">
              {t(news.bodyKey)}
            </div>
          </div>
        </article>
      </div>
    </main>
  )
}
