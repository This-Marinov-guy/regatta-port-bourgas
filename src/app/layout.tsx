import type { Metadata } from 'next'
import { Manrope, Cormorant_Infant } from 'next/font/google'
import './globals.css'

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

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'International Regatta Port Bourgas | Sailing Events & Competitions',
    template: '%s | International Regatta Port Bourgas'
  },
  description: 'Official website of the International Regatta Port Bourgas. Discover upcoming sailing events, regatta competitions, past events, photo galleries, and connect with the sailing community in Bourgas, Bulgaria.',
  keywords: [
    'regatta',
    'sailing',
    'yacht racing',
    'Bourgas',
    'Bulgaria',
    'sailing events',
    'sailing competitions',
    'yacht club',
    'sailing regatta',
    'sailing rules',
    'racing rules of sailing',
    'sailing community',
    'sailing photos',
    'sailing gallery'
  ],
  authors: [{ name: 'Yacht Club Port Bourgas' }],
  creator: 'Yacht Club Port Bourgas',
  publisher: 'Yacht Club Port Bourgas',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['bg_BG'],
    url: siteUrl,
    siteName: 'International Regatta Port Bourgas',
    title: 'International Regatta Port Bourgas | Sailing Events & Competitions',
    description: 'Official website of the International Regatta Port Bourgas. Discover upcoming sailing events, regatta competitions, past events, photo galleries, and connect with the sailing community in Bourgas, Bulgaria.',
    images: [
      {
        url: `${siteUrl}/images/splashscreen/splash-screen-1.jpeg`,
        width: 1200,
        height: 630,
        alt: 'International Regatta Port Bourgas - Sailing Competition',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'International Regatta Port Bourgas | Sailing Events & Competitions',
    description: 'Official website of the International Regatta Port Bourgas. Discover upcoming sailing events, regatta competitions, and connect with the sailing community.',
    images: [`${siteUrl}/images/splashscreen/splash-screen-1.jpeg`],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      'en': `${siteUrl}/en`,
      'bg': `${siteUrl}/bg`,
      'x-default': siteUrl,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/images/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/favicons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/images/favicons/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
}

// Root layout - provides HTML/body structure for pages outside [locale] (like not-found)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${manrope.variable} ${cormorantInfant.variable} ${manrope.className} bg-white dark:bg-black antialiased`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}

