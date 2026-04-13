import Image from 'next/image'
import { format } from 'date-fns'
import { Icon } from '@iconify/react'
import { Link } from '@/i18n/routing'
import CurrentEventBadge from './CurrentEventBadge'

type Props = {
  href: string
  imageSrc: string
  title: string
  dateFrom: string
  dateTo: string
  detailsLabel: string
  currentLabel?: string
}

export default function EventCard({
  href,
  imageSrc,
  title,
  dateFrom,
  dateTo,
  detailsLabel,
  currentLabel
}: Props) {
  const from = format(new Date(dateFrom), 'MMM dd, yyyy')
  const to = format(new Date(dateTo), 'MMM dd, yyyy')

  return (
    <div className="relative rounded-2xl border border-dark/10 dark:border-white/10 overflow-hidden group hover:shadow-3xl duration-300 dark:hover:shadow-white/10 bg-white dark:bg-black">
      {currentLabel ? (
        <CurrentEventBadge dateFrom={dateFrom} dateTo={dateTo} label={currentLabel} />
      ) : null}
      <div className="relative w-full h-[220px] sm:h-[260px] overflow-hidden">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover transition duration-300 group-hover:scale-110 group-hover:brightness-75"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 420px"
          unoptimized={true}
        />
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-2  text-dark/60 dark:text-white/60 mb-2">
          <Icon icon="ph:calendar-blank-bold" width={18} height={18} className="text-primary" />
          <span>
            {from} — {to}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-semibold text-dark dark:text-white mb-4 leading-snug">
          {title}
        </h3>

        <Link
          href={href}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-primary text-white  sm:text-base font-semibold hover:bg-primary/90 transition-colors duration-300"
          aria-label={detailsLabel}
        >
          {detailsLabel}
          <Icon icon="ph:arrow-right-bold" width={18} height={18} />
        </Link>
      </div>
    </div>
  )
}

