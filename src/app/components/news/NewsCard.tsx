import { format } from 'date-fns'
import { Icon } from '@iconify/react'
import { Link } from '@/i18n/routing'

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
  const formattedDate = format(new Date(date), 'MMM dd, yyyy')

  return (
    <Link
      href={href}
      className="block rounded-xl border border-dark/10 dark:border-white/10 p-6 hover:shadow-lg dark:hover:shadow-white/10 bg-white dark:bg-black transition-all duration-300 hover:border-primary/50 group"
    >
      <div className="flex items-center gap-2 text-sm text-dark/60 dark:text-white/60 mb-3">
        <Icon icon="ph:calendar-blank-bold" width={16} height={16} className="text-primary" />
        <span>{formattedDate}</span>
      </div>

      <h3 className="text-lg sm:text-xl font-semibold text-dark dark:text-white mb-3 leading-snug group-hover:text-primary transition-colors">
        {title}
      </h3>

      <p className="text-dark/70 dark:text-white/70 text-sm sm:text-base line-clamp-3">
        {description}
      </p>
    </Link>
  )
}
