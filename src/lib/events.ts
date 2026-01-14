export type EventItem = {
  slug: string
  imageSrc: string
  // ISO date strings
  dateFrom: string
  dateTo: string
  // Translation keys
  titleKey: string
  excerptKey: string
  bodyKey: string
  status: 'future' | 'past'
}

export const EVENTS: EventItem[] = [
  {
    slug: 'regatta-port-bourgas-2025',
    imageSrc:
      '/images/gallery/156467829049067701756_1575359959267787_7588640456737554432_o.jpg',
    dateFrom: '2025-06-14',
    dateTo: '2025-06-16',
    titleKey: 'events.items.regatta-port-bourgas-2025.title',
    excerptKey: 'events.items.regatta-port-bourgas-2025.excerpt',
    bodyKey: 'events.items.regatta-port-bourgas-2025.body',
    status: 'future'
  },
  {
    slug: 'training-weekend-spring-2025',
    imageSrc:
      '/images/gallery/156467829048867671567_1575360165934433_153690572849152000_o.jpg',
    dateFrom: '2025-04-05',
    dateTo: '2025-04-06',
    titleKey: 'events.items.training-weekend-spring-2025.title',
    excerptKey: 'events.items.training-weekend-spring-2025.excerpt',
    bodyKey: 'events.items.training-weekend-spring-2025.body',
    status: 'future'
  },
  {
    slug: 'regatta-port-bourgas-2024',
    imageSrc:
      '/images/gallery/156467829050067899964_1575360175934432_1389068341368324096_o.jpg',
    dateFrom: '2024-06-15',
    dateTo: '2024-06-17',
    titleKey: 'events.items.regatta-port-bourgas-2024.title',
    excerptKey: 'events.items.regatta-port-bourgas-2024.excerpt',
    bodyKey: 'events.items.regatta-port-bourgas-2024.body',
    status: 'past'
  },
  {
    slug: 'autumn-cup-2024',
    imageSrc:
      '/images/gallery/156467829049967824348_1575368012600315_7815880630838755328_o.jpg',
    dateFrom: '2024-10-12',
    dateTo: '2024-10-13',
    titleKey: 'events.items.autumn-cup-2024.title',
    excerptKey: 'events.items.autumn-cup-2024.excerpt',
    bodyKey: 'events.items.autumn-cup-2024.body',
    status: 'past'
  }
]

