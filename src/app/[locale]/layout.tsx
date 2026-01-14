import type { Metadata } from 'next'
import { Manrope, Cormorant_Infant } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '../globals.css'
import { ThemeProvider } from 'next-themes'
import NextTopLoader from 'nextjs-toploader';
import Header from '../components/layout/header';
import Footer from '../components/layout/footer';
import CookieBanner from '../components/layout/cookie-banner';
import SessionProviderComp from '../../providers/SessionProvider';
import ScrollToTop from '../components/scroll-to-top';

const manrope = Manrope({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-manrope',
});

const cormorantInfant = Cormorant_Infant({ 
  subsets: ["latin"],
  weight: ["400"],
  variable: '--font-cormorant-infant',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.regattaportbourgas.com'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: 'seo' });
  
  const localeMap: Record<string, string> = {
    en: 'en_US',
    bg: 'bg_BG',
  };

  const ogLocale = localeMap[locale] || 'en_US';
  const alternateLocale = locale === 'en' ? 'bg_BG' : 'en_US';
  const localeUrl = `${siteUrl}/${locale}`;
  const alternateUrl = locale === 'en' ? `${siteUrl}/bg` : `${siteUrl}/en`;
  const ogImageUrl = `${siteUrl}/images/splashscreen/splash-screen-1.jpeg`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t('title'),
      template: t('titleTemplate'),
    },
    description: t('description'),
    keywords: t('keywords').split(', '),
    authors: [{ name: 'Yacht Club Port Bourgas' }],
    creator: 'Yacht Club Port Bourgas',
    publisher: 'Yacht Club Port Bourgas',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      alternateLocale: [alternateLocale],
      url: localeUrl,
      siteName: t('siteName'),
      title: t('ogTitle'),
      description: t('ogDescription'),
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('ogImageAlt'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('twitterTitle'),
      description: t('twitterDescription'),
      images: [ogImageUrl],
      creator: '@regattaportbourgas',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/images/favicons/favicon.ico', sizes: 'any' },
        { url: '/images/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/images/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/images/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: [
        { url: '/images/favicons/apple-icon-57x57.png', sizes: '57x57', type: 'image/png' },
        { url: '/images/favicons/apple-icon-60x60.png', sizes: '60x60', type: 'image/png' },
        { url: '/images/favicons/apple-icon-72x72.png', sizes: '72x72', type: 'image/png' },
        { url: '/images/favicons/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
        { url: '/images/favicons/apple-icon-114x114.png', sizes: '114x114', type: 'image/png' },
        { url: '/images/favicons/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
        { url: '/images/favicons/apple-icon-144x144.png', sizes: '144x144', type: 'image/png' },
        { url: '/images/favicons/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
        { url: '/images/favicons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      ],
      other: [
        { rel: 'android-chrome', url: '/images/favicons/android-icon-192x192.png' },
        { rel: 'msapplication-TileImage', url: '/images/favicons/ms-icon-144x144.png' },
      ],
    },
    manifest: '/manifest.json',
    alternates: {
      canonical: localeUrl,
      languages: {
        'en': `${siteUrl}/en`,
        'bg': `${siteUrl}/bg`,
        'x-default': siteUrl,
      },
    },
    category: t('category'),
    classification: t('classification'),
  };
}

export default async function LocaleLayout({
  children,
  params,
  session,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
  session?: any;
}) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${manrope.variable} ${cormorantInfant.variable} ${manrope.className} bg-white dark:bg-black antialiased`} suppressHydrationWarning>
        <NextTopLoader color="#3435AA" />
        <NextIntlClientProvider messages={messages}>
          <SessionProviderComp session={session}>
            <ThemeProvider
              attribute='class'
              enableSystem={true}
              defaultTheme='light'>
              <Header />
              {children}
              <Footer />
              <CookieBanner />
              <ScrollToTop />
            </ThemeProvider>
          </SessionProviderComp>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

