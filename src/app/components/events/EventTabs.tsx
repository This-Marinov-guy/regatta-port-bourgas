"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs"
import { Icon } from "@iconify/react"
import { useTranslations } from "next-intl"
import toast from "react-hot-toast"
import { localizeText } from "@/lib/localizedContent"
import type { EventDocumentRecord } from "@/lib/events"
import { formatDisplayDate } from "@/lib/formatDate"

type EventEntry = {
  id: string
  boatName: string
  nationality: string
  sailNumber: string
  model: string | null
  yachtClub: string | null
  skipperYachtClub: string | null
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

function getDownloadUrl(source: string, fileName: string) {
  const separator = source.includes("?") ? "&" : "?"
  return `${source}${separator}download=${encodeURIComponent(fileName)}`
}

const actionButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 text-dark/70 transition-colors duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary focus-visible:border-primary focus-visible:outline-none dark:border-white/10 dark:text-white/70 dark:hover:text-primary"

const tooltipClass =
  "pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-dark px-2 py-1 text-xs font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover/action:opacity-100 group-focus-within/action:opacity-100 dark:bg-white dark:text-dark"

function DocumentActions({
  source,
  fileName,
  name,
}: {
  source: string
  fileName: string
  name: string
}) {
  const t = useTranslations("events")

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined"
      ? new URL(source, window.location.origin).href
      : source

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: name, url: shareUrl })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success(t("documentCard.linkCopied"))
    } catch {
      toast.error(t("documentCard.share"))
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="group/action relative inline-flex">
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("documentCard.preview")}
          className={actionButtonClass}
        >
          <Icon icon="ph:eye-bold" width={18} height={18} />
        </a>
        <span role="tooltip" className={tooltipClass}>
          {t("documentCard.preview")}
        </span>
      </span>

      <span className="group/action relative inline-flex">
        <a
          href={getDownloadUrl(source, fileName)}
          download={fileName}
          aria-label={t("documentCard.download")}
          className={actionButtonClass}
        >
          <Icon icon="ph:download-simple-bold" width={18} height={18} />
        </a>
        <span role="tooltip" className={tooltipClass}>
          {t("documentCard.download")}
        </span>
      </span>

      <span className="group/action relative inline-flex">
        <button
          type="button"
          onClick={handleShare}
          aria-label={t("documentCard.share")}
          className={actionButtonClass}
        >
          <Icon icon="ph:share-network-bold" width={18} height={18} />
        </button>
        <span role="tooltip" className={tooltipClass}>
          {t("documentCard.share")}
        </span>
      </span>
    </div>
  )
}

function DocumentList({
  locale,
  documents,
  emptyMessageKey,
}: {
  locale: string
  documents: EventDocumentRecord[]
  emptyMessageKey: string
}) {
  const t = useTranslations("events")

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[180px] items-center justify-center text-center">
        <p className="text-dark/60 dark:text-white/60">
          {t(emptyMessageKey)}
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
          <div
            key={document.id}
            className="flex flex-col gap-3 rounded-[1.25rem] border border-black/10 bg-white/90 px-4 py-4 transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-black/20"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
                <Icon icon="ph:file-text-bold" width={20} height={20} />
              </div>
              <p className="font-semibold text-dark dark:text-white">{name}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-dark/55 dark:text-white/55">
                {formatUploadedDate(document.created_at)}
              </p>
              <DocumentActions source={document.source} fileName={fileName} name={name} />
            </div>
          </div>
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
            <th className="px-4 py-3 font-semibold">{t("entryList.model")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.sailNumber")}</th>
            <th className="px-4 py-3 font-semibold">{t("entryList.nationality")}</th>
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
                {entry.model || "—"}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.sailNumber}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.nationality}
              </td>
              <td className="px-4 py-4 text-dark/70 dark:text-white/70">
                {entry.yachtClub ?? entry.skipperYachtClub ?? "—"}
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
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-4"
              >
                <span className="truncate">{t("tabs.noticeBoard")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="entryList"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-4"
              >
                <span className="truncate">{t("tabs.entryList")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="flex-1 sm:flex-none min-w-0 sm:min-w-[120px]  sm: md:text-base px-2 sm:px-4 md:px-4"
              >
                <span className="truncate">{t("tabs.results")}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="noticeBoard" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <DocumentList
                locale={locale}
                documents={noticeBoard}
                emptyMessageKey="tabsContent.noticeBoardEmpty"
              />
            </div>
          </TabsContent>

          <TabsContent value="entryList" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <EntryList entries={entries} />
            </div>
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <div className="rounded-lg sm:rounded-xl border border-dark/10 dark:border-white/10 sm:border-2 bg-white dark:bg-black shadow-md sm:shadow-lg dark:shadow-white/5 p-4 sm:p-6 md:p-8 lg:p-12 min-h-[250px] sm:min-h-[300px] md:min-h-[400px]">
              <DocumentList
                locale={locale}
                documents={results}
                emptyMessageKey="tabsContent.resultsEmpty"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
