"use client"

import Image from "next/image"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"

type SectionPoint = {
  title: string
  text: string
}

const tabValues = ["general", "refund", "privacy"] as const

type TabValue = (typeof tabValues)[number]

function normalizeTab(value: string | null): TabValue {
  return tabValues.includes(value as TabValue) ? (value as TabValue) : "general"
}

export default function TermsTabs() {
  const t = useTranslations("terms")
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = normalizeTab(searchParams.get("tab"))

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", nextTab)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <div className="mb-6 flex justify-center sm:mb-8">
        <TabsList className="w-full flex-wrap sm:w-auto sm:flex-nowrap">
          {tabValues.map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="min-w-0 flex-1 px-2 sm:min-w-[150px] sm:flex-none sm:px-4 md:px-6"
            >
              <span className="truncate">{t(`tabs.${tab}`)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {tabValues.map((tab) => {
        const points = t.raw(`sections.${tab}.points`) as SectionPoint[]

        return (
          <TabsContent key={tab} value={tab} className="mt-0">
            <article className="rounded-lg p-5 sm:rounded-xl sm:p-8 md:p-10">
              <h2 className="text-2xl font-semibold text-dark dark:text-white sm:text-3xl">
                {t(`sections.${tab}.title`)}
              </h2>
              <p className="mt-4 leading-7 text-dark/70 dark:text-white/70">
                {t(`sections.${tab}.intro`)}
              </p>

              {tab === "general" ? (
                <div className="mt-6 flex flex-col gap-4 rounded-md border border-black/10 p-4 dark:border-white/10 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-dark dark:text-white">
                      {t("sections.general.paymentProvider.title")}
                    </h3>
                    <p className="mt-2 leading-7 text-dark/70 dark:text-white/70">
                      {t.rich("sections.general.paymentProvider.text", {
                        mypos: (chunks) => (
                          <a
                            href="https://www.mypos.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-primary underline underline-offset-2 transition-colors hover:text-primary/80"
                          >
                            {chunks}
                          </a>
                        ),
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-start sm:justify-center">
                    <Image
                      src="/images/brands/mypos.webp"
                      alt={t("sections.general.paymentProvider.logoAlt")}
                      width={150}
                      height={60}
                      className="h-auto w-8 sm:w-14"
                    />
                  </div>
                </div>
              ) : null}

              <div className="mt-8 space-y-5">
                {points.map((point) => (
                  <div
                    key={point.title}
                    className="rounded-md border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.04]"
                  >
                    <h3 className="text-xl font-semibold text-dark dark:text-white">
                      {point.title}
                    </h3>
                    <p className="mt-2 leading-7 text-dark/70 dark:text-white/70">
                      {point.text}
                    </p>
                  </div>
                ))}
              </div>
            </article>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
