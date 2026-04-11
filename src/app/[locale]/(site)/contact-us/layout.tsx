import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contactForm' })
  const title = locale === 'bg' ? 'Свържете се с нас' : 'Contact Us'
  const description = t('description')

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: `${siteUrl}/images/banner.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [`${siteUrl}/images/banner.jpg`] },
    alternates: {
      canonical: `${siteUrl}/${locale}/contact-us`,
      languages: { en: `${siteUrl}/en/contact-us`, bg: `${siteUrl}/bg/contact-us` },
    },
  }
}

export default function ContactUsLayout({ children }: Props) {
  return <>{children}</>
}
