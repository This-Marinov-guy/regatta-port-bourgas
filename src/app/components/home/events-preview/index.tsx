import { getTranslations, getLocale } from 'next-intl/server'
import { Link } from '@/i18n/routing'
import EventCard from '@/app/components/events/EventCard'
import { getEvents } from '@/lib/events'
import { localizeText } from '@/lib/localizedContent'
import Image from 'next/image'

export default async function EventsPreview() {
  const t = await getTranslations()
  const locale = await getLocale()

  const events = await getEvents()
  const firstTwo = events
    .filter((e) => e.status === 1)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 2)

  return (
    <section className="py-16 md:py-24 bg-transparent">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-14">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
              {t("events.future")}
            </h2>
            <p className="text-dark/60 dark:text-white/60  sm:text-base max-w-2xl">
              {t("events.previewSubtitle")}
            </p>
          </div>

          <Link
            href="/events"
            className="inline-flex items-center justify-center px-6 py-3 rounded-md border border-primary bg-primary text-white hover:bg-primary/90 transition-colors duration-300 font-semibold  sm:text-base"
          >
            {t("events.seeMore")}
            <Image src="/images/SVGs/arrow-right.svg" alt="Arrow Right" className='ml-2 brightness-0 invert' width={24} height={24} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {firstTwo.map((event) => (
            <EventCard
              key={event.id}
              href={`/events/${event.slug}`}
              imageSrc={event.thumbnail_img ?? ''}
              title={localizeText(locale, event.name_en, event.name_bg)}
              dateFrom={event.start_date}
              dateTo={event.end_date}
              detailsLabel={t("events.details")}
              currentLabel={t("events.current")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
