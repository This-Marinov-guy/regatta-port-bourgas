import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import RegistrationPaymentAction from '@/app/components/payments/RegistrationPaymentAction'
import { Link } from '@/i18n/routing'
import { calculateEventFeeCents, hasEventFee } from '@/lib/eventFees'
import { localizeText } from '@/lib/localizedContent'
import { getRegistrationWithEvent } from '@/lib/registrations/data'

type Props = {
  params: Promise<{ id: string; locale: string }>
  searchParams: Promise<{ session?: string; payment?: string }>
}

export const dynamic = 'force-dynamic'

export default async function RegistrationPaymentPage({ params, searchParams }: Props) {
  const { id, locale } = await params
  const query = await searchParams

  if (query.session !== id) {
    notFound()
  }

  const registration = await getRegistrationWithEvent(id).catch(() => null)

  if (!registration?.event) {
    notFound()
  }

  const t = await getTranslations('payment')
  const feeRequired = hasEventFee(registration.event)
  const paid =
    !feeRequired ||
    registration.payment_data?.mypos?.payment_status === 'paid' ||
    registration.payment_data?.stripe?.payment_status === 'paid'
  const amountCents = calculateEventFeeCents(
    registration.event,
    registration.crew_list.length
  )
  const amount = amountCents
    ? new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'EUR',
      }).format(amountCents / 100)
    : null
  const eventName = localizeText(
    locale,
    registration.event.name_en,
    registration.event.name_bg
  )

  return (
    <main className="site-page-bg min-h-screen">
      <div className="container mx-auto max-w-3xl px-5 pb-28 pt-36 md:pt-44">
        <div className="rounded-[2rem] border border-black/10 bg-white/90 p-7 shadow-xl dark:border-white/10 dark:bg-black/25 sm:p-10">
          <p className="font-semibold uppercase tracking-[0.18em] text-primary">
            {t('eyebrow')}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-dark dark:text-white sm:text-4xl">
            {paid ? t('paidTitle') : t('unpaidTitle')}
          </h1>
          <p className="mt-4 leading-7 text-dark/70 dark:text-white/70">
            {paid
              ? feeRequired
                ? t('paidBody', { boatName: registration.boat_name })
                : t('noFeeBody', { boatName: registration.boat_name })
              : t('unpaidBody', { boatName: registration.boat_name })}
          </p>

          <dl className="mt-7 grid gap-4 rounded-2xl bg-black/[0.03] p-5 dark:bg-white/[0.05] sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.08em] text-dark/50 dark:text-white/50">
                {t('event')}
              </dt>
              <dd className="mt-1 font-medium text-dark dark:text-white">{eventName}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.08em] text-dark/50 dark:text-white/50">
                {t('boat')}
              </dt>
              <dd className="mt-1 font-medium text-dark dark:text-white">
                {registration.boat_name}
              </dd>
            </div>
            {amount ? (
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.08em] text-dark/50 dark:text-white/50">
                  {t('amount')}
                </dt>
                <dd className="mt-1 font-medium text-dark dark:text-white">{amount}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.08em] text-dark/50 dark:text-white/50">
                {t('status')}
              </dt>
              <dd className="mt-1 font-medium text-dark dark:text-white">
                {paid ? t('paidStatus') : t('unpaidStatus')}
              </dd>
            </div>
          </dl>

          {query.payment === 'cancelled' && !paid ? (
            <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800">
              {t('cancelled')}
            </p>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            {!paid ? (
              <RegistrationPaymentAction
                registrationId={registration.id}
                session={query.session}
                locale={locale}
                buttonLabel={t('payAction')}
                loadingLabel={t('payLoading')}
                errorMessage={t('payError')}
              />
            ) : null}
            <Link
              href={`/events/${registration.event.slug}`}
              className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white px-6 py-3 font-medium text-dark transition hover:border-primary hover:text-primary dark:border-white/10 dark:bg-black/20 dark:text-white"
            >
              {t('backToEvent')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
