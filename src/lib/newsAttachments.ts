export type NewsAttachmentLink = {
  url: string
  label: string | null
}

const htmlImagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi
const htmlLinkPattern = /<a\b[^>]*\bhref=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
const markdownImagePattern = /!\[[^\]]*]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/gi
const markdownLinkPattern = /(?<!!)\[([^\]]+)]\((https?:\/\/[^)\s]+)(?:\s+"[^"]*")?\)/gi
const autolinkPattern = /<(https?:\/\/[^>\s]+)>/gi
const rawUrlPattern = /https?:\/\/[^\s<>()]+/gi
const imageExtensionPattern =
  /\.(avif|bmp|gif|ico|jpe?g|png|svg|webp)(?:[?#].*)?$/i

function cleanExtractedUrl(value: string) {
  return value.trim().replace(/[),.;!?]+$/g, '')
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function isImageUrl(url: string) {
  return (
    imageExtensionPattern.test(url) ||
    url.includes('/storage/v1/object/public/images/')
  )
}

function pushAttachment(
  items: NewsAttachmentLink[],
  seen: Set<string>,
  imageUrls: Set<string>,
  rawUrl: string,
  label: string | null
) {
  const url = cleanExtractedUrl(rawUrl)

  if (!url || seen.has(url) || imageUrls.has(url) || isImageUrl(url)) {
    return
  }

  seen.add(url)
  items.push({
    url,
    label: label?.trim() || null
  })
}

export function extractNewsAttachmentLinks(...sources: Array<string | null | undefined>) {
  const attachments: NewsAttachmentLink[] = []
  const seen = new Set<string>()
  const imageUrls = new Set<string>()

  for (const source of sources) {
    if (!source) {
      continue
    }

    for (const match of source.matchAll(htmlImagePattern)) {
      imageUrls.add(cleanExtractedUrl(match[1] ?? ''))
    }

    for (const match of source.matchAll(markdownImagePattern)) {
      imageUrls.add(cleanExtractedUrl(match[1] ?? ''))
    }
  }

  for (const source of sources) {
    if (!source) {
      continue
    }

    for (const match of source.matchAll(htmlLinkPattern)) {
      pushAttachment(
        attachments,
        seen,
        imageUrls,
        match[1] ?? '',
        stripHtml(match[2] ?? '') || null
      )
    }

    for (const match of source.matchAll(markdownLinkPattern)) {
      pushAttachment(
        attachments,
        seen,
        imageUrls,
        match[2] ?? '',
        match[1] ?? null
      )
    }

    for (const match of source.matchAll(autolinkPattern)) {
      pushAttachment(attachments, seen, imageUrls, match[1] ?? '', null)
    }

    for (const match of source.matchAll(rawUrlPattern)) {
      pushAttachment(attachments, seen, imageUrls, match[0] ?? '', null)
    }
  }

  return attachments
}

export function extractNewsAttachmentUrls(...sources: Array<string | null | undefined>) {
  return extractNewsAttachmentLinks(...sources).map((item) => item.url)
}
