import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import EventCard from '@/app/components/events/EventCard'
import { getEvents } from '@/lib/events'
import Breadcrumb from '@/app/components/breadcrumb'
import { localizeText } from '@/lib/localizedContent'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'events' })
  return {
    title: t('title'),
    description: t('subtitle'),
    openGraph: {
      title: t('title'),
      description: t('subtitle'),
      images: [{ url: `${siteUrl}/images/banner.png`, width: 1200, height: 630, alt: t('title') }],
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('subtitle'), images: [`${siteUrl}/images/banner.png`] },
    alternates: {
      canonical: `${siteUrl}/${locale}/events`,
      languages: { en: `${siteUrl}/en/events`, bg: `${siteUrl}/bg/events` },
    },
  }
}

export default async function EventsPage() {
  const t = await getTranslations()
  const locale = await getLocale()

  const events = await getEvents()
  const future = events.filter((e) => e.status === 1)
  const past = events.filter((e) => e.status === 2)

  return (
    <main className="site-page-bg">
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-14 md:pb-28">
        <Breadcrumb
          image="/images/breadcrumbs/1.jpg"
          links={[
            { href: `/${locale}`, text: t("navigation.home") },
            { href: `/${locale}/events`, text: t("events.title") },
          ]}
        />

        <section className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t("events.future")}
          </h2>
          {future.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-8 text-sm text-dark/60 dark:border-white/10 dark:bg-black/20 dark:text-white/60">
              {t("events.futureEmpty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {future.map((event) => (
                <EventCard
                  key={event.id}
                  href={`/events/${event.slug}`}
                  imageSrc={event.thumbnail_img ?? ""}
                  title={localizeText(locale, event.name_en, event.name_bg)}
                  dateFrom={event.start_date}
                  dateTo={event.end_date}
                  detailsLabel={t("events.details")}
                  currentLabel={t("events.current")}
                />
              ))}
            </div>
          )}
        </section>

        <hr />

        <section className="mt-8">
          <h2 className="text-2xl sm:text-3xl font-semibold text-dark dark:text-white mb-6">
            {t("events.past")}
          </h2>
          {past.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white/80 px-5 py-8 text-sm text-dark/60 dark:border-white/10 dark:bg-black/20 dark:text-white/60">
              {t("events.pastEmpty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {past.map((event) => (
                <EventCard
                  key={event.id}
                  href={`/events/${event.slug}`}
                  imageSrc={event.thumbnail_img ?? ""}
                  title={localizeText(locale, event.name_en, event.name_bg)}
                  dateFrom={event.start_date}
                  dateTo={event.end_date}
                  detailsLabel={t("events.details")}
                  currentLabel={t("events.current")}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
