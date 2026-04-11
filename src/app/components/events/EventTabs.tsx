"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { useTranslations } from "next-intl"

type Props = {
  documents: string[]
  noticeBoard: string[]
  results: string[]
  registerForm: string[]
}

function FileList({ urls }: { urls: string[] }) {
  if (urls.length === 0) {
    return <p className="text-dark/50 dark:text-white/50 text-sm italic">—</p>
  }
  return (
    <ul className="space-y-2">
      {urls.map((url, i) => (
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

export default function EventTabs({ documents, noticeBoard, results, registerForm }: Props) {
  const t = useTranslations("events")

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
              <FileList urls={registerForm} />
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
