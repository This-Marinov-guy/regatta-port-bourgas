import type { Metadata } from "next";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getTranslations, getLocale } from "next-intl/server";

import { getEvent, isEventRegistrationOpen } from "@/lib/events";
import EventTabs from "@/app/components/events/EventTabs";
import EventRegistrationModal from "@/app/components/events/EventRegistrationModal";
import { localizeText } from "@/lib/localizedContent";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params
  const event = await getEvent(slug)
  if (!event) return {}

  const title = localizeText(locale, event.name_en, event.name_bg)
  const description = localizeText(
    locale,
    event.description_en,
    event.description_bg
  )
  const image = event.thumbnail_img || `${siteUrl}/images/banner.png`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    alternates: {
      canonical: `${siteUrl}/${locale}/events/${slug}`,
      languages: { en: `${siteUrl}/en/events/${slug}`, bg: `${siteUrl}/bg/events/${slug}` },
    },
  }
}

export default async function EventDetailsPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  const t = await getTranslations();
  const locale = await getLocale();
  const from = format(new Date(event.start_date), "MMM dd, yyyy");
  const to = format(new Date(event.end_date), "MMM dd, yyyy");

  const title = localizeText(locale, event.name_en, event.name_bg);
  const description = localizeText(
    locale,
    event.description_en,
    event.description_bg
  );
  const registrationOpen = isEventRegistrationOpen(event.start_date)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    startDate: event.start_date,
    endDate: event.end_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'Port of Bourgas',
      address: { '@type': 'PostalAddress', addressLocality: 'Bourgas', addressCountry: 'BG' },
    },
    organizer: {
      '@type': 'SportsOrganization',
      name: 'Yacht Club Port Bourgas',
      url: siteUrl,
    },
    ...(event.thumbnail_img && { image: event.thumbnail_img }),
    url: `${siteUrl}/${locale}/events/${event.slug}`,
  }

  return (
    <main className="site-page-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container max-w-8xl mx-auto px-5 2xl:px-0 pt-32 md:pt-44 pb-32 md:pb-36">
        <Link
          href={`/events`}
          className="inline-flex items-center gap-2 font-semibold text-dark/70 dark:text-white/70 hover:text-primary transition-colors"
        >
          ← {t("events.back")}
        </Link>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {event.thumbnail_img && (
            <div className="relative w-full overflow-hidden rounded-2xl border border-dark/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={event.thumbnail_img}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 600px"
                  unoptimized={true}
                />
              </div>
            </div>
          )}

          <div>
            <div className="mb-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-dark dark:text-white leading-tight">
                {title}
              </h1>
            </div>
            <p className="text-dark/60 dark:text-white/60  sm:text-base mb-6">
              {from} — {to}
            </p>

            <div className="prose prose-zinc dark:prose-invert max-w-none whitespace-pre-line">
              <p>{description}</p>
            </div>
          </div>
        </div>

        <EventTabs
          registerHref={`/events/${event.slug}?register=1`}
          registerOpen={registrationOpen}
          documents={event.documents}
          noticeBoard={event.notice_board}
          results={event.results}
          registerForm={event.register_form}
        />
        {registrationOpen ? (
          <EventRegistrationModal
            eventId={event.id}
            eventTitle={title}
            eventDate={`${from} — ${to}`}
          />
        ) : null}

        {registrationOpen ? (
          <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:bottom-6">
            <div className="relative">
              <div className="absolute inset-x-[-2.5rem] inset-y-[-1.25rem] rounded-[999px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.92)_0%,rgba(255,255,255,0.72)_42%,rgba(255,255,255,0.18)_72%,rgba(255,255,255,0)_100%)] blur-xl dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.10)_42%,rgba(255,255,255,0.04)_72%,rgba(255,255,255,0)_100%)]" />
              <Link
                href={`/events/${event.slug}?register=1`}
                scroll={false}
                className="pointer-events-auto relative inline-flex min-h-14 items-center justify-center rounded-2xl bg-primary px-7 py-4 text-base font-medium text-white shadow-[0_18px_40px_rgba(0,87,184,0.32)] transition hover:bg-primary/90 sm:text-lg"
              >
                {t("events.register")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
