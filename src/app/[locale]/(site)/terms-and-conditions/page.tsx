import type { Metadata } from "next"
import { getLocale, getTranslations } from "next-intl/server"
import Breadcrumb from "@/app/components/breadcrumb"
import TermsTabs from "./TermsTabs"

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.regattaportbourgas.org"

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "terms" })

  return {
    title: t("title"),
    description: t("subtitle"),
    openGraph: {
      title: t("title"),
      description: t("subtitle"),
      images: [
        {
          url: `${siteUrl}/images/banner.png`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("subtitle"),
      images: [`${siteUrl}/images/banner.png`],
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/terms-and-conditions`,
      languages: {
        en: `${siteUrl}/en/terms-and-conditions`,
        bg: `${siteUrl}/bg/terms-and-conditions`,
      },
    },
  }
}

export default async function TermsAndConditionsPage() {
  const locale = await getLocale()
  const t = await getTranslations("terms")
  const tCommon = await getTranslations()

  return (
    <main className="site-page-bg">
      <div className="container mx-auto max-w-8xl px-5 pb-14 pt-22 md:pb-28 2xl:px-0">
        <Breadcrumb
          image="/images/breadcrumbs/2.jpg"
          links={[
            { href: `/${locale}`, text: tCommon("navigation.home") },
            { href: `/${locale}/terms-and-conditions`, text: t("title") },
          ]}
        />

        <section className="mx-auto max-w-5xl py-0">
          <div className="mb-8 text-center md:mb-12">
            <h1 className="text-4xl font-medium text-dark dark:text-white md:text-6xl">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-3xl leading-7 text-dark/70 dark:text-white/70">
              {t("subtitle")}
            </p>
          </div>

          <TermsTabs />
        </section>
      </div>
    </main>
  )
}
