"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Button } from "@/app/components/ui/button"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"

type Props = {
  registerHref: string
  documents: string[]
  noticeBoard: string[]
  results: string[]
  registerForm: string[]
}

function normalizeUrls(urls: unknown): string[] {
  if (Array.isArray(urls)) {
    return urls.filter(
      (url): url is string => typeof url === "string" && url.trim().length > 0
    )
  }

  if (typeof urls === "string" && urls.trim().length > 0) {
    return [urls]
  }

  return []
}

function FileList({ urls }: { urls: string[] }) {
  const safeUrls = normalizeUrls(urls)

  if (safeUrls.length === 0) {
    return <p className="text-dark/50 dark:text-white/50 text-sm italic">—</p>
  }
  return (
    <ul className="space-y-2">
      {safeUrls.map((url, i) => (
        <li key={i}>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-primary hover:underline text-sm sm:text-base break-all"
          >
            {url.split('/').pop() || url}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function EventTabs({
  registerHref,
  documents,
  noticeBoard,
  results,
  registerForm
}: Props) {
  const t = useTranslations("events")
  const safeRegisterForm = normalizeUrls(registerForm)

  return (
    <div className="mt-8 sm:mt-12 lg:mt-16 w-full px-4 sm:px-0">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="documents" className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8">
            <TabsList className="w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger
                value="documents"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px] text-xs sm:text-sm md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.documents")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="noticeBoard"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px] text-xs sm:text-sm md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.noticeBoard")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="applications"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px] text-xs sm:text-sm md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.applications")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px] text-xs sm:text-sm md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.results")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="documents" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <FileList urls={documents} />
            </div>
          </TabsContent>

          <TabsContent value="noticeBoard" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <FileList urls={noticeBoard} />
            </div>
          </TabsContent>

          <TabsContent value="applications" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <div className="mx-auto flex min-h-[180px] max-w-3xl flex-col items-center justify-center text-center">
                <h3 className="text-2xl font-semibold text-dark dark:text-white">
                  {t("register")}
                </h3>
                <p className="mt-4 text-sm leading-7 text-dark/65 dark:text-white/65">
                  {t("tabsContent.applications")}
                </p>
                <p className="mt-3 text-sm leading-7 text-dark/55 dark:text-white/55">
                  {safeRegisterForm.length > 0
                    ? t("tabsContent.applicationsFiles")
                    : t("tabsContent.applicationsEmpty")}
                </p>
                <Button asChild className="mt-6 rounded-xl px-6 text-white">
                  <Link href={registerHref} scroll={false}>
                    {t("openRegistration")}
                  </Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <FileList urls={results} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
