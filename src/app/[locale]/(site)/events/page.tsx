import { getTranslations } from 'next-intl/server'
import EventCard from '@/app/components/events/EventCard'
import { EVENTS } from '@/lib/events'

export default async function EventsPage() {
  const t = await getTranslations()

  const future = EVENTS.filter((e) => e.status === 'future')
  const past = EVENTS.filter((e) => e.status === 'past')

  return (
    <main className="bg-white dark:bg-black">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <div className="mb-10 md:mb-14">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white mb-3">
            {t('events.title')}
          </h1>
          <p className="text-dark/60 dark:text-white/60 text-sm sm:text-base max-w-3xl">
            {t('events.subtitle')}
          </p>
        </div>

        <section className="mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t('events.future')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {future.map((event) => (
              <EventCard
                key={event.slug}
                href={`/events/${event.slug}`}
                imageSrc={event.imageSrc}
                title={t(event.titleKey)}
                dateFrom={event.dateFrom}
                dateTo={event.dateTo}
                detailsLabel={t('events.details')}
                currentLabel={t('events.current')}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t('events.past')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {past.map((event) => (
              <EventCard
                key={event.slug}
                href={`/events/${event.slug}`}
                imageSrc={event.imageSrc}
                title={t(event.titleKey)}
                dateFrom={event.dateFrom}
                dateTo={event.dateTo}
                detailsLabel={t('events.details')}
                currentLabel={t('events.current')}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

