import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/routing'

import EventCard from '@/app/components/events/EventCard'
import { EVENTS } from '@/lib/events'
import Image from 'next/image'

export default async function EventsPreview() {
  const t = await getTranslations()

  const future = EVENTS.filter((e) => e.status === 'future')
    .slice()
    .sort((a, b) => new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime())

  const firstTwo = future.slice(0, 2)

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
              {t("events.future")}
            </h2>
            <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base max-w-2xl">
              {t("events.previewSubtitle")}
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary bg-primary text-white hover:bg-primary/90 transition-colors duration-300 font-semibold text-sm sm:text-base"
          >
            {t("events.seeMore")}
            <Image src="/images/SVGs/arrow-right.svg" alt="Arrow Right" className='ml-2 brightness-0 invert' width={24} height={24} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {firstTwo.map((event) => (
            <EventCard
              key={event.slug}
              href={`/events/${event.slug}`}
              imageSrc={event.imageSrc}
              title={t(event.titleKey)}
              dateFrom={event.dateFrom}
              dateTo={event.dateTo}
              detailsLabel={t("events.details")}
              currentLabel={t("events.current")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

