import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { getTranslations } from 'next-intl/server'

import { EVENTS } from '@/lib/events'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function EventDetailsPage({ params }: Props) {
  const { slug } = await params
  const event = EVENTS.find((e) => e.slug === slug)
  if (!event) notFound()

  const t = await getTranslations()
  const from = format(new Date(event.dateFrom), 'MMM dd, yyyy')
  const to = format(new Date(event.dateTo), 'MMM dd, yyyy')

  return (
    <main className="bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-semibold text-dark/70 dark:text-white/70 hover:text-primary transition-colors"
        >
          ← {t('events.back')}
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div className="relative w-full overflow-hidden rounded-2xl border border-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
            <div className="relative w-full aspect-[4/3]">
              <Image
                src={event.imageSrc}
                alt={t(event.titleKey)}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 600px"
                unoptimized={true}
              />
            </div>
          </div>

          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3 leading-tight">
              {t(event.titleKey)}
            </h1>
            <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base mb-6">
              {from} — {to}
            </p>

            <p className="text-dark/70 dark:text-white/70 text-base sm:text-lg leading-relaxed mb-6">
              {t(event.excerptKey)}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none">
              <p>{t(event.bodyKey)}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

