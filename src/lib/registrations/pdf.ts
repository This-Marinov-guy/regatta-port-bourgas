import path from 'node:path'
import { promises as fs } from 'node:fs'
import { Readable } from 'node:stream'
import fontkit from '@pdf-lib/fontkit'
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PDFDocument, PDFPage, rgb } from 'pdf-lib'
import { format } from 'date-fns'
import {
  getAwsRegion,
  getRegistrationOutputBucket,
  getRegistrationOutputPublicBaseUrl,
  getRegistrationPdfFontBucket,
  getRegistrationPdfFontKey,
  getRegistrationPdfFontPath,
  getRegistrationTemplateBucket,
  getRegistrationTemplateKey,
  getRegistrationTemplatePath,
} from './config'
import type { RegistrationWithEvent } from './data'

const s3Client = new S3Client({ region: getAwsRegion() })
const PREVIEW_WIDTH = 1755
const PREVIEW_HEIGHT = 1240

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

async function loadTemplateBytes() {
  const templateBucket = getRegistrationTemplateBucket()
  const templateKey = getRegistrationTemplateKey()

  if (templateBucket && templateKey) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: templateBucket,
        Key: templateKey,
      })
    )

    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('Unable to read template PDF from S3.')
    }

    return streamToBuffer(response.Body)
  }

  return fs.readFile(path.join(process.cwd(), getRegistrationTemplatePath()))
}

async function loadFontBytes() {
  const fontBucket = getRegistrationPdfFontBucket()
  const fontKey = getRegistrationPdfFontKey()

  if (fontBucket && fontKey) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: fontBucket,
        Key: fontKey,
      })
    )

    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('Unable to read PDF font from S3.')
    }

    return streamToBuffer(response.Body)
  }

  return fs.readFile(path.join(process.cwd(), getRegistrationPdfFontPath()))
}

function topToPdfY(pageHeight: number, previewTop: number, fontSize: number) {
  return pageHeight - (previewTop / PREVIEW_HEIGHT) * pageHeight - fontSize
}

function previewToPdfX(pageWidth: number, previewLeft: number) {
  return (previewLeft / PREVIEW_WIDTH) * pageWidth
}

function wrapLines(
  text: string,
  font: {
    widthOfTextAtSize(text: string, size: number): number
  },
  size: number,
  maxWidth: number
) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const next = currentLine ? `${currentLine} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !currentLine) {
      currentLine = next
      continue
    }

    lines.push(currentLine)
    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

function drawPreviewText(args: {
  page: PDFPage
  text: string | null | undefined
  previewLeft: number
  previewTop: number
  font: Awaited<ReturnType<PDFDocument['embedFont']>>
  size?: number
  maxPreviewWidth?: number
  lineHeight?: number
}) {
  const { page, text, previewLeft, previewTop, font } = args

  if (!text) {
    return
  }

  const size = args.size ?? 10
  const maxWidth = args.maxPreviewWidth
    ? (args.maxPreviewWidth / PREVIEW_WIDTH) * page.getWidth()
    : undefined
  const x = previewToPdfX(page.getWidth(), previewLeft)
  const baseY = topToPdfY(page.getHeight(), previewTop, size)
  const lineHeight = args.lineHeight ?? size + 2

  const lines = maxWidth ? wrapLines(text, font, size, maxWidth) : [text]

  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: baseY - index * lineHeight,
      size,
      font,
      color: rgb(0.1, 0.12, 0.14),
    })
  })
}

function formatDateValue(value: string | null | undefined) {
  if (!value) {
    return null
  }

  try {
    return format(new Date(value), 'dd.MM.yyyy')
  } catch {
    return value
  }
}

function buildGeneratedFormUrl(bucket: string, key: string) {
  const publicBaseUrl = getRegistrationOutputPublicBaseUrl()
  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, '')}/${key}`
  }

  return `https://${bucket}.s3.${getAwsRegion()}.amazonaws.com/${key}`
}

export async function generateRegistrationPdf(registration: RegistrationWithEvent) {
  const [templateBytes, fontBytes] = await Promise.all([
    loadTemplateBytes(),
    loadFontBytes(),
  ])

  const pdf = await PDFDocument.load(templateBytes)
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const [page1, page2] = pdf.getPages()

  const eventName = registration.event?.name_en || registration.event?.name_bg || 'International Regatta Port Bourgas'
  const eventDates =
    registration.event
      ? `${format(new Date(registration.event.start_date), 'dd.MM.yyyy')} - ${format(
          new Date(registration.event.end_date),
          'dd.MM.yyyy'
        )}`
      : ''
  const countryAndHarbour = [registration.country, registration.port_of_registry]
    .filter(Boolean)
    .join(' / ')
  const entryDate = format(new Date(), 'dd.MM.yyyy')

  drawPreviewText({ page: page1, text: eventName, previewLeft: 200, previewTop: 22, font, size: 9, maxPreviewWidth: 1020 })
  drawPreviewText({ page: page1, text: 'BOURGAS', previewLeft: 440, previewTop: 70, font, size: 10 })
  drawPreviewText({ page: page1, text: eventDates, previewLeft: 1310, previewTop: 70, font, size: 10 })
  drawPreviewText({ page: page1, text: registration.boat_name, previewLeft: 70, previewTop: 190, font, maxPreviewWidth: 650 })
  drawPreviewText({ page: page1, text: registration.yacht_club, previewLeft: 780, previewTop: 190, font, maxPreviewWidth: 520 })
  drawPreviewText({ page: page1, text: registration.contact_email, previewLeft: 70, previewTop: 255, font, maxPreviewWidth: 650 })
  drawPreviewText({ page: page1, text: `${registration.contact_name}${registration.country ? `, ${registration.country}` : ''}`, previewLeft: 780, previewTop: 255, font, maxPreviewWidth: 520 })
  drawPreviewText({ page: page1, text: registration.skipper_name, previewLeft: 70, previewTop: 320, font, maxPreviewWidth: 1090 })
  drawPreviewText({ page: page1, text: registration.contact_phone, previewLeft: 1430, previewTop: 320, font, maxPreviewWidth: 220 })
  drawPreviewText({ page: page1, text: registration.certificate_of_competency, previewLeft: 70, previewTop: 388, font, maxPreviewWidth: 500 })
  drawPreviewText({ page: page1, text: formatDateValue(registration.certificate_of_competency_expiry), previewLeft: 1430, previewTop: 388, font, maxPreviewWidth: 220 })
  drawPreviewText({ page: page1, text: registration.sail_number, previewLeft: 70, previewTop: 454, font, maxPreviewWidth: 460 })
  drawPreviewText({ page: page1, text: registration.model_design, previewLeft: 630, previewTop: 454, font, maxPreviewWidth: 390 })
  drawPreviewText({ page: page1, text: String(registration.boat_age), previewLeft: 1430, previewTop: 454, font, maxPreviewWidth: 220 })
  drawPreviewText({ page: page1, text: registration.border_number, previewLeft: 70, previewTop: 520, font, maxPreviewWidth: 460 })
  drawPreviewText({ page: page1, text: registration.boat_color, previewLeft: 630, previewTop: 520, font, maxPreviewWidth: 390 })
  drawPreviewText({ page: page1, text: `${registration.loa} m`, previewLeft: 1430, previewTop: 520, font, maxPreviewWidth: 220 })
  drawPreviewText({ page: page1, text: registration.certificate_of_navigation, previewLeft: 70, previewTop: 586, font, maxPreviewWidth: 460 })
  drawPreviewText({ page: page1, text: formatDateValue(registration.certificate_of_navigation_expiry), previewLeft: 630, previewTop: 586, font, maxPreviewWidth: 390 })
  drawPreviewText({ page: page1, text: countryAndHarbour, previewLeft: 1110, previewTop: 586, font, maxPreviewWidth: 540 })
  drawPreviewText({ page: page1, text: registration.gph_irc, previewLeft: 70, previewTop: 650, font, maxPreviewWidth: 460 })
  drawPreviewText({ page: page1, text: registration.gph_irc, previewLeft: 630, previewTop: 650, font, maxPreviewWidth: 390 })
  drawPreviewText({
    page: page1,
    text: registration.crew_insurance
      ? `${registration.crew_list.length} insured persons confirmed`
      : 'Not confirmed',
    previewLeft: 80,
    previewTop: 807,
    font,
    size: 9,
    maxPreviewWidth: 620,
  })
  drawPreviewText({
    page: page1,
    text: registration.crew_insurance ? 'Confirmed by entrant' : '',
    previewLeft: 750,
    previewTop: 807,
    font,
    size: 9,
    maxPreviewWidth: 520,
  })
  drawPreviewText({
    page: page1,
    text: registration.third_party_insurance ? 'Liability insurance confirmed' : 'Not confirmed',
    previewLeft: 80,
    previewTop: 956,
    font,
    size: 9,
    maxPreviewWidth: 620,
  })
  drawPreviewText({
    page: page1,
    text: registration.third_party_insurance ? 'Confirmed by entrant' : '',
    previewLeft: 1070,
    previewTop: 956,
    font,
    size: 9,
    maxPreviewWidth: 520,
  })
  drawPreviewText({ page: page1, text: entryDate, previewLeft: 90, previewTop: 1126, font, size: 10 })
  drawPreviewText({ page: page1, text: registration.skipper_name, previewLeft: 460, previewTop: 1126, font, size: 10, maxPreviewWidth: 300 })
  drawPreviewText({ page: page1, text: 'Electronically agreed', previewLeft: 1360, previewTop: 1126, font, size: 10, maxPreviewWidth: 260 })

  drawPreviewText({ page: page2, text: eventName, previewLeft: 620, previewTop: 20, font, size: 9, maxPreviewWidth: 830 })
  drawPreviewText({ page: page2, text: 'BOURGAS', previewLeft: 550, previewTop: 72, font, size: 10 })
  drawPreviewText({ page: page2, text: eventDates, previewLeft: 1260, previewTop: 72, font, size: 10 })
  drawPreviewText({ page: page2, text: registration.boat_name, previewLeft: 70, previewTop: 250, font, maxPreviewWidth: 760 })
  drawPreviewText({ page: page2, text: registration.country, previewLeft: 860, previewTop: 250, font, maxPreviewWidth: 350 })
  drawPreviewText({ page: page2, text: registration.port_of_registry, previewLeft: 1230, previewTop: 250, font, maxPreviewWidth: 420 })

  registration.crew_list.slice(0, 14).forEach((crewMember, index) => {
    const rowTop = 610 + index * 43
    drawPreviewText({ page: page2, text: crewMember.name, previewLeft: 120, previewTop: rowTop, font, size: 9, maxPreviewWidth: 680 })
    drawPreviewText({
      page: page2,
      text: index === 0 ? 'Skipper / Шкипер' : 'Crew / Екипаж',
      previewLeft: 860,
      previewTop: rowTop,
      font,
      size: 9,
      maxPreviewWidth: 260,
    })
    drawPreviewText({
      page: page2,
      text: formatDateValue(crewMember.date_of_birth),
      previewLeft: 1240,
      previewTop: rowTop,
      font,
      size: 9,
      maxPreviewWidth: 200,
    })
  })

  drawPreviewText({ page: page2, text: entryDate, previewLeft: 90, previewTop: 1145, font, size: 10 })
  drawPreviewText({ page: page2, text: registration.skipper_name, previewLeft: 380, previewTop: 1145, font, size: 10, maxPreviewWidth: 450 })
  drawPreviewText({ page: page2, text: 'Electronically agreed', previewLeft: 1130, previewTop: 1145, font, size: 10, maxPreviewWidth: 300 })

  const bytes = await pdf.save()
  const fileName = `${registration.boat_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'registration'}-${registration.id}.pdf`

  return {
    fileName,
    pdfBuffer: Buffer.from(bytes),
  }
}

export async function uploadRegistrationPdf(args: {
  registration: RegistrationWithEvent
  fileName: string
  pdfBuffer: Buffer
}) {
  const bucket = getRegistrationOutputBucket()
  const key = `registrations/${args.registration.event_id}/${args.registration.id}/${args.fileName}`

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: args.pdfBuffer,
      ContentType: 'application/pdf',
    })
  )

  return {
    bucket,
    key,
    url: buildGeneratedFormUrl(bucket, key),
  }
}
