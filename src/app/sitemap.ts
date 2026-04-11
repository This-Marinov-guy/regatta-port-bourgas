import type { MetadataRoute } from 'next'
import { getEvents } from '@/lib/events'
import { getNews } from '@/lib/news'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'
const locales = ['en', 'bg'] as const

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, news] = await Promise.all([getEvents(), getNews()])

  const staticRoutes = [
    { path: '', priority: 1.0, changeFrequency: 'daily' as const },
    { path: '/about-us', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/events', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/news', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/gallery', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/contact-us', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/documents', priority: 0.5, changeFrequency: 'monthly' as const },
  ]

  const staticEntries = staticRoutes.flatMap(({ path, priority, changeFrequency }) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
    }))
  )

  const eventEntries = events.flatMap((event) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}/events/${event.slug}`,
      lastModified: new Date(event.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  )

  const newsEntries = news.flatMap((item) =>
    locales.map((locale) => ({
      url: `${siteUrl}/${locale}/news/${item.slug}`,
      lastModified: new Date(item.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))
  )

  return [...staticEntries, ...eventEntries, ...newsEntries]
}
