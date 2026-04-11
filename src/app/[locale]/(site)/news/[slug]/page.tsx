import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import { Icon } from '@iconify/react'
import { getNewsItem } from '@/lib/news'
import { extractNewsAttachmentLinks } from '@/lib/newsAttachments'
import markdownToHtml from '@/lib/markdownToHtml'

type Props = {
  params: Promise<{ slug: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug, locale } = await params
  const news = await getNewsItem(slug)

  if (!news) {
    return {}
  }

  return {
    title: locale === 'bg' ? news.name_bg : news.name_en,
    description: (locale === 'bg' ? news.description_bg : news.description_en) ?? '',
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const t = await getTranslations()
  const locale = await getLocale()

  const news = await getNewsItem(slug)

  if (!news) {
    notFound()
  }

  const title = locale === 'bg' ? news.name_bg : news.name_en
  const description = (locale === 'bg' ? news.description_bg : news.description_en) ?? ''
  const body = locale === 'bg' ? news.body_bg : news.body_en
  const formattedDate = format(new Date(news.created_at), 'MMMM dd, yyyy')
  const bodyHtml = /<([a-z][^/\s>]*)\b[^>]*>/i.test(body)
    ? body
    : await markdownToHtml(body)
  const attachments = extractNewsAttachmentLinks(body)

  return (
    <main className="site-page-bg">
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
            {title}
          </h1>

          {description ? (
            <p className="mb-8 text-xl leading-relaxed text-dark/80 dark:text-white/80">
              {description}
            </p>
          ) : null}

          <div className="blog-details prose prose-lg prose-zinc max-w-none dark:prose-invert prose-a:text-primary prose-img:rounded-2xl prose-img:shadow-lg">
            <div
              className="text-dark/75 dark:text-white/75"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          </div>

          {attachments.length > 0 ? (
            <section className="mt-12 rounded-[1.75rem] border border-black/10 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/30">
              <h2 className="mb-4 text-2xl font-semibold text-dark dark:text-white">
                Attachments
              </h2>
              <ul className="space-y-3">
                {attachments.map((attachment) => {
                  const fallbackLabel =
                    attachment.url.split('/').pop()?.split('?')[0] ||
                    attachment.url

                  return (
                    <li key={attachment.url}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <Icon icon="ph:paperclip-bold" width={18} height={18} />
                        {decodeURIComponent(attachment.label || fallbackLabel)}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </article>
      </div>
    </main>
  )
}
