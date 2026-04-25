import { Icon } from '@iconify/react'
import { Link } from '@/i18n/routing'
import { formatDisplayDate } from '@/lib/formatDate'

type Props = {
  href: string
  title: string
  description: string
  date: string
}

export default function NewsCard({
  href,
  title,
  description,
  date
}: Props) {
  const formattedDate = formatDisplayDate(date)

  return (
    <Link
      href={href}
      className="bg-map aspect-[356/223] block rounded-xl border border-dark/10 dark:border-white/10 p-6 hover:shadow-lg dark:hover:shadow-white/10 transition-all duration-300 hover:border-primary/50 group"
    >
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="mb-3 flex items-center justify-center gap-2  text-primary">
        <Icon icon="ph:calendar-blank-bold" width={16} height={16} className="text-primary" />
        <span>{formattedDate}</span>
        </div>

        <h3 className="mb-3 text-lg leading-snug font-semibold text-primary transition-colors group-hover:text-primary/80 sm:text-xl">
          {title}
        </h3>

        <p className="max-w-[28ch]  text-primary/70 line-clamp-3 sm:text-base">
          {description}
        </p>
      </div>
    </Link>
  )
}
