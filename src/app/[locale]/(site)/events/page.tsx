import { getTranslations, getLocale } from 'next-intl/server'
import EventCard from '@/app/components/events/EventCard'
import { getEvents } from '@/lib/events'
import Breadcrumb from '@/app/components/breadcrumb'

export default async function EventsPage() {
  const t = await getTranslations()
  const locale = await getLocale()

  const events = await getEvents()
  const future = events.filter((e) => e.status === 1)
  const past = events.filter((e) => e.status === 2)

  return (
    <main className="site-page-bg">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-12 md:pt-44 pb-14 md:pb-28">
        <Breadcrumb
          image="/images/breadcrumbs/1.jpg"
          links={[
            { href: `/${locale}`, text: t('navigation.home') },
            { href: `/${locale}/events`, text: t('events.title') }
          ]}
        />

        <section className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t('events.future')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {future.map((event) => (
              <EventCard
                key={event.id}
                href={`/events/${event.slug}`}
                imageSrc={event.thumbnail_img ?? ''}
                title={locale === 'bg' ? event.name_bg : event.name_en}
                dateFrom={event.start_date}
                dateTo={event.end_date}
                detailsLabel={t('events.details')}
                currentLabel={t('events.current')}
              />
            ))}
          </div>
        </section>

        <hr />

        <section className="mt-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t('events.past')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {past.map((event) => (
              <EventCard
                key={event.id}
                href={`/events/${event.slug}`}
                imageSrc={event.thumbnail_img ?? ''}
                title={locale === 'bg' ? event.name_bg : event.name_en}
                dateFrom={event.start_date}
                dateTo={event.end_date}
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
