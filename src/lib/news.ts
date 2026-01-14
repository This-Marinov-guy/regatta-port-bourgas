export type NewsItem = {
  slug: string
  // ISO date string
  date: string
  // Translation keys
  titleKey: string
  descriptionKey: string
  bodyKey: string
}

export const NEWS: NewsItem[] = [
  {
    slug: 'regatta-2025-announcement',
    date: '2025-01-15',
    titleKey: 'news.items.regatta-2025-announcement.title',
    descriptionKey: 'news.items.regatta-2025-announcement.description',
    bodyKey: 'news.items.regatta-2025-announcement.body'
  },
  {
    slug: 'new-training-program',
    date: '2025-01-10',
    titleKey: 'news.items.new-training-program.title',
    descriptionKey: 'news.items.new-training-program.description',
    bodyKey: 'news.items.new-training-program.body'
  },
  {
    slug: 'winter-season-update',
    date: '2024-12-20',
    titleKey: 'news.items.winter-season-update.title',
    descriptionKey: 'news.items.winter-season-update.description',
    bodyKey: 'news.items.winter-season-update.body'
  },
  {
    slug: 'championship-results-2024',
    date: '2024-11-15',
    titleKey: 'news.items.championship-results-2024.title',
    descriptionKey: 'news.items.championship-results-2024.description',
    bodyKey: 'news.items.championship-results-2024.body'
  },
  {
    slug: 'safety-guidelines-update',
    date: '2024-10-05',
    titleKey: 'news.items.safety-guidelines-update.title',
    descriptionKey: 'news.items.safety-guidelines-update.description',
    bodyKey: 'news.items.safety-guidelines-update.body'
  }
]
