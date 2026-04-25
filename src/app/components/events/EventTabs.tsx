"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Icon } from "@iconify/react"
import { useTranslations } from "next-intl"
import { localizeText } from "@/lib/localizedContent"
import type { EventDocumentRecord } from "@/lib/events"
import { formatDisplayDate } from "@/lib/formatDate"

type EventEntry = {
  id: string
  boatName: string
  nationality: string
  sailNumber: string
  yachtClub: string | null
  skipperName: string
}

type Props = {
  locale: string
  noticeBoard: EventDocumentRecord[]
  results: EventDocumentRecord[]
  entries: EventEntry[]
}

function formatUploadedDate(value: string | null) {
  if (!value) {
    return "—"
  }

  return formatDisplayDate(value) || "—"
}

function getFileExtension(source: string) {
  return source.split(".").pop()?.split("?")[0]?.toUpperCase() || "FILE"
}

function getDownloadUrl(source: string, fileName: string) {
  const separator = source.includes("?") ? "&" : "?"
  return `${source}${separator}download=${encodeURIComponent(fileName)}`
}

function DocumentGrid({
  locale,
  documents,
}: {
  locale: string
  documents: EventDocumentRecord[]
}) {
  const t = useTranslations("events")

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center text-center">
        <p className="text-dark/60 dark:text-white/60">
          {t("tabsContent.noticeBoardEmpty")}
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((document) => {
        const name = localizeText(locale, document.name_en, document.name_bg)
        const fileName = document.source.split("/").pop()?.split("?")[0] || document.source

        return (
          <a
            key={document.id}
            href={getDownloadUrl(document.source, fileName)}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-[1.5rem] border border-black/10 bg-white/90 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-black/20"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon icon="ph:file-text-bold" width={24} height={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-dark/45 dark:text-white/45">
                  {getFileExtension(document.source)}
                </p>
                <h3 className="mt-1 font-semibold text-dark dark:text-white">
                  {name}
                </h3>
                <p className="mt-3 text-sm text-dark/55 dark:text-white/55">
                  {t("documentCard.uploaded")}: {formatUploadedDate(document.created_at)}
                </p>
              </div>
            </div>
          </a>
        )
      })}
    </div>
  )
}

function DocumentList({
  locale,
  documents,
}: {
  locale: string
  documents: EventDocumentRecord[]
}) {
  const t = useTranslations("events")

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center text-center">
        <p className="text-dark/60 dark:text-white/60">
          {t("tabsContent.resultsEmpty")}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const name = localizeText(locale, document.name_en, document.name_bg)
        const fileName = document.source.split("/").pop()?.split("?")[0] || document.source

        return (
          <a
            key={document.id}
            href={getDownloadUrl(document.source, fileName)}
            download={fileName}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-black/10 bg-white/90 px-4 py-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-black/20"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon icon="ph:file-arrow-down-bold" width={20} height={20} />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-dark dark:text-white">{name}</p>
                <p className="mt-1 text-sm text-dark/55 dark:text-white/55">
                  {formatUploadedDate(document.created_at)}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-sm font-semibold text-primary">
              {t("documentCard.download")}
            </span>
          </a>
        )
      })}
    </div>
  )
}

function EntryList({ entries }: { entries: EventEntry[] }) {
  const t = useTranslations("events")

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center text-center">
        <p className="text-dark/60 dark:text-white/60">
          {t("tabsContent.entryListEmpty")}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-black/10 text-left dark:divide-white/10">
        <thead>
          <tr className="text-sm uppercase tracking-[0.08em] text-dark/55 dark:text-white/55">
            <th className="px-4 py-3 font-semibold">{t("entryList.boat")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.nationality")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.sailNumber")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.yachtClub")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.skipper")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5 dark:divide-white/5">
          {entries.map((entry) => (
            <tr key={entry.id} className="align-top">
              <td className="px-4 py-4 font-medium text-dark dark:text-white">
                {entry.boatName}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.nationality}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.sailNumber}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.yachtClub || "—"}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.skipperName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function EventTabs({
  locale,
  noticeBoard,
  results,
  entries
}: Props) {
  const t = useTranslations("events")

  return (
    <div className="mt-8 sm:mt-12 lg:mt-16 w-full px-4 sm:px-0">
      <div className="max-w-5xl mx-auto">
        <Tabs defaultValue="noticeBoard" className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8">
            <TabsList className="w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <TabsTrigger
                value="noticeBoard"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.noticeBoard")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="entryList"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.entryList")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-6"
              >
                <span className="truncate">{t("tabs.results")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="noticeBoard" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <DocumentGrid locale={locale} documents={noticeBoard} />
            </div>
          </TabsContent>

          <TabsContent value="entryList" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <EntryList entries={entries} />
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <DocumentList locale={locale} documents={results} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
