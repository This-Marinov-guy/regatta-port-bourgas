import type { Metadata } from 'next'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { getLocale } from 'next-intl/server'

type Locale = 'en' | 'bg'

type Props = {
  params: Promise<{ locale: string }>
}

const OFFICIAL_SITE_URL = 'https://yachtclubportbourgas.org/en/about-us'
const DINGHY_EVENTS_URL =
  'https://www.yachtclubportbourgas.org/en/european-optimist-championship-2017'

const ABOUT_PAGE_CONTENT = {
  en: {
    title: 'About Us',
    eyebrow: 'Yacht Club “Port Bourgas”',
    intro:
      'A public-benefit sailing association with roots in Burgas since 1976, dedicated to youth development, seamanship, and international regatta hosting.',
    stats: [
      { value: '1976', label: 'Established' },
      { value: '150', label: 'Club members' },
      { value: '17', label: 'Qualified officials' },
    ],
    sections: [
      {
        title: 'History and registration',
        paragraphs: [
          'Yacht Club “Port Bourgas” is a non-government organisation in public benefit, organised and registered under the laws of the Republic of Bulgaria. The club has 50 years of history.',
          'Yacht Club “Port Bourgas” was established in 1976 as a department within the Port of Bourgas. In 1996 the club was registered in accordance with the Persons and Family Act at Bourgas District Court and entered under batch No 8, vol. 2, p. 180 company case 1132/1996. In 2000 the club was re-registered as an association under the Bulgarian Non-profit Legal Persons Act. Yacht Club “Port Bourgas” is enrolled in the Central Register of non-profit organizations with the Bulgarian Ministry of Justice to carry out activity in public benefit under No 0296011321.',
        ],
      },
      {
        title: 'People and expertise',
        paragraphs: [
          'The club has 150 members and has employed 2 coaches since 2014 that secure the proper education and training of the young sailors.',
          'The club is managed by a Managing Board of 8 members with skills, knowledge and experience both in sailing and in management. All of them are volunteers. The club is a member of the Bulgarian Sailing Federation. We have 14 qualified National Judges and Race Officers, 2 qualified International Judges and 1 qualified International Race Officer.',
        ],
      },
      {
        title: 'Mission and goals',
        paragraphs: [
          'Yacht Club “Port Bourgas” is focusing on educating and developing youth sailing, training of young people to spend more time among nature.',
        ],
        bullets: [
          'Development of sea sports and tourism with sailing yachts and other boats',
          'Organizing sea adventures for members and supporting their marine education',
          'Protecting the environment',
          'Organizing and taking part in regattas and other sea events',
          'Education and training of children and youths',
          'Establishment of partnership with similar organizations worldwide',
          'Working for social integration and personal improvement',
        ],
      },
      {
        title: 'Legacy and championships',
        paragraphs: [
          'Our club and its members have organized and hosted more than 200 sailing regattas and became an important starting point for many nautical achievements with club sailors in the newest Bulgarian sailing history.',
          'Most of the events and regattas are organized with the kind support and help of the club members. We are proud that many of the members are qualified judges with a certificate from the Bulgarian Sailing Federation Race Officials Committee and WORLD SAILING.',
        ],
        bullets: [
          '470 Junior World Championship in 2007',
          '420 & 470 Junior Europeans Championship in 2015',
          'European Optimist Championship in 2017',
          '470 European Championship in 2018',
          'Balkan Games in 2001 and 2010',
        ],
      },
    ],
    panelTitle: 'More info and dinghy events',
    panelDescription:
      'For official club history, archived event coverage, and dinghy-related championship pages, visit Yacht Club Port Bourgas online.',
    panelLinks: [
      {
        label: 'Official club website',
        href: OFFICIAL_SITE_URL,
      },
      {
        label: 'European Optimist Championship 2017',
        href: DINGHY_EVENTS_URL,
      },
    ],
    panelNote:
      'These links open the official Yacht Club Port Bourgas website in a new tab.',
  },
  bg: {
    title: 'За Нас',
    eyebrow: 'Яхт клуб „Порт Бургас“',
    intro:
      'Сдружение в обществена полза с корени в Бургас от 1976 г., посветено на младежкото ветроходство, морското образование и организирането на международни регати.',
    stats: [
      { value: '1976', label: 'Създаден' },
      { value: '150', label: 'Членове' },
      { value: '17', label: 'Квалифицирани съдии' },
    ],
    sections: [
      {
        title: 'История и регистрация',
        paragraphs: [
          'Яхт клуб „Порт Бургас“ е неправителствена организация в обществена полза, организирана и регистрирана съгласно законите на Република България. Клубът има 50-годишна история.',
          'Яхтклуб „Порт Бургас“ е създаден през 1976 г. като отдел в рамките на Пристанище Бургас. През 1996 г. клубът е регистриран в съответствие със Закона за лицата и семейството в Бургаския окръжен съд и вписан под партиден № 8, т. 2, стр. 180 фирмено дело 1132/1996. През 2000 г. клубът е пререгистриран като сдружение съгласно българския Закон за юридическите лица с нестопанска цел. Яхт клуб „Порт Бургас“ е вписан в Централния регистър на юридическите лица с нестопанска цел към Министерството на правосъдието на Република България за осъществяване на дейност в обществена полза под № 0296011321.',
        ],
      },
      {
        title: 'Хора и експертиза',
        paragraphs: [
          'Клубът има 150 членове и от 2014 г. насам има двама треньори, които се грижат за правилното обучение и подготовка на младите ветроходци.',
          'Клубът се управлява от Управителен съвет от 8 членове с умения, знания и опит както във ветроходството, така и в управлението. Всички те са доброволци. Клубът е член на Българската федерация по ветроходство. Разполагаме с 14 квалифицирани национални съдии и рейс офицери, 2 квалифицирани международни съдии и 1 квалифициран международен рейс офицер.',
        ],
      },
      {
        title: 'Мисия и цели',
        paragraphs: [
          'Яхтклуб „Порт Бургас“ се фокусира върху обучението и развитието на младежкото ветроходство, обучението на младите хора да прекарват повече време сред природата.',
        ],
        bullets: [
          'Развитие на морските спортове и туризма с ветроходни яхти и други лодки',
          'Организиране на морски приключения на своите членове и подпомагането им в морското образование',
          'Опазване на околната среда',
          'Организиране и участие в регати и други морски събития',
          'Образование и обучение на деца и младежи',
          'Установяване на партньорство със сходни организации по света',
          'Работа за социална интеграция и личностно усъвършенстване',
        ],
      },
      {
        title: 'Наследство и първенства',
        paragraphs: [
          'Нашият клуб и неговите членове са организирали и провели повече от 200 ветроходни регати и са станали важна отправна точка за много морски постижения с ветроходците на клуба в най-новата история на българското ветроходство.',
          'Повечето от събитията и регатите се организират с любезната подкрепа и помощ на членовете на клуба. Гордеем се с това, че много от членовете са квалифицирани съдии със сертификат от Комисията за рейс офицери на Българската федерация по ветроходство и WORLD SAILING.',
        ],
        bullets: [
          '470 Junior World Championship през 2007 г.',
          '420 & 470 Junior Europeans Championship през 2015 г.',
          'European Optimist Championship през 2017 г.',
          '470 European Championship през 2018 г.',
          'Balkan Games през 2001 и 2010 г.',
        ],
      },
    ],
    panelTitle: 'Повече информация и динги събития',
    panelDescription:
      'За официалната история на клуба, архивни страници за събития и dinghy първенства, вижте уебсайта на Yacht Club Port Bourgas.',
    panelLinks: [
      {
        label: 'Официален сайт на клуба',
        href: OFFICIAL_SITE_URL,
      },
      {
        label: 'European Optimist Championship 2017',
        href: DINGHY_EVENTS_URL,
      },
    ],
    panelNote: 'Линковете отварят официалния сайт на Yacht Club Port Bourgas в нов раздел.',
  },
} as const

function resolveLocale(locale: string): Locale {
  return locale === 'bg' ? 'bg' : 'en'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const content = ABOUT_PAGE_CONTENT[resolveLocale(locale)]

  return {
    title: content.title,
    description: content.intro,
  }
}

export default async function AboutUsPage() {
  const locale = resolveLocale(await getLocale())
  const content = ABOUT_PAGE_CONTENT[locale]

  return (
    <main className="site-page-bg">
      <div className="container mx-auto max-w-8xl px-5 pt-32 pb-14 md:pt-44 md:pb-28 2xl:px-0">
        <div className="mb-12 max-w-4xl">
          

          <h1 className="mb-4 text-4xl font-semibold text-dark dark:text-white sm:text-5xl md:text-6xl">
            {content.title}
          </h1>

          <p className="max-w-3xl text-base leading-8 text-dark/70 dark:text-white/70 sm:text-lg">
            {content.intro}
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-[1.75rem]">
            <Image
              src="/images/about/1.jpg"
              alt="Yacht Club Port Bourgas"
              fill
              className="object-cover"
            />
          </div>
          <div className="relative aspect-video overflow-hidden rounded-[1.75rem]">
            <Image
              src="/images/about/2.jpg"
              alt="Yacht Club Port Bourgas"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {content.stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-[1.75rem] border border-black/10 p-6 shadow-sm dark:border-white/10"
            >
              <div className="mb-2 text-3xl font-semibold text-primary sm:text-4xl">
                {stat.value}
              </div>
              <p className=" font-medium uppercase tracking-[0.22em] text-dark/50 dark:text-white/50">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <article className="space-y-8">
            {content.sections.map((section) => (
              <section
                key={section.title}
                className="rounded-[2rem] border border-black/10 bg-white/80 p-7 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/20 sm:p-8"
              >
                <h2 className="mb-5 text-2xl font-semibold text-dark dark:text-white sm:text-3xl">
                  {section.title}
                </h2>

                <div className="space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-dark/75 dark:text-white/70"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                {section.bullets ? (
                  <ul className="mt-6 grid gap-3 text-dark/75 dark:text-white/75">
                    {section.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Icon
                          icon="ph:check-circle-fill"
                          width={20}
                          height={20}
                          className="mt-1 shrink-0 text-primary"
                        />
                        <span className="leading-7">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>

          <aside className="space-y-6 xl:sticky xl:top-32 xl:self-start">
            <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-primary p-8 text-white shadow-xl">
              <div className="absolute inset-0 opacity-20" />
              <div className="relative">
                

                <h2 className="mb-3 text-2xl font-semibold text-white">
                  {content.panelTitle}
                </h2>

                <p className="mb-6  leading-7 text-white/75">
                  {content.panelDescription}
                </p>

                <div className="space-y-3">
                  {content.panelLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-4  font-semibold text-white transition-colors hover:bg-white/15"
                    >
                      <span className="max-w-[18rem]">{link.label}</span>
                      <Icon icon="ph:arrow-up-right-bold" width={18} height={18} />
                    </a>
                  ))}
                </div>

                <p className="mt-4  leading-6 text-white/55">{content.panelNote}</p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-primary/20 bg-primary p-7 shadow-sm">
              <h2 className="mb-4 text-2xl font-semibold text-white">
                {locale === 'bg' ? 'Клубът накратко' : 'Club at a glance'}
              </h2>

              <div className="space-y-4  leading-7 text-white/80">
                <div className="flex items-start gap-3">
                  <Icon icon="ph:sailboat-bold" width={26} height={26} className="mt-0.5 shrink-0 text-white" />
                  <span>
                    {locale === 'bg'
                      ? 'Член на Българската федерация по ветроходство с активна програма за млади състезатели.'
                      : 'Member of the Bulgarian Sailing Federation with an active development program for young sailors.'}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <Icon icon="ph:users-three-bold" width={26} height={26} className="mt-0.5 shrink-0 text-white" />
                  <span>
                    {locale === 'bg'
                      ? 'Управлява се от доброволен Управителен съвет от 8 души с опит както във ветроходството, така и в управлението.'
                      : 'Led by an 8-member volunteer Managing Board with experience in both sailing and club management.'}
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <Icon icon="ph:trophy-bold" width={26} height={26} className="mt-0.5 shrink-0 text-white" />
                  <span>
                    {locale === 'bg'
                      ? 'Домакин на повече от 200 регати, включително европейски и световни първенства.'
                      : 'Host of more than 200 regattas, including European and world-level championships.'}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
