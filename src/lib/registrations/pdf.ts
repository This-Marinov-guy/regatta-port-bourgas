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
import {
  REGISTRATION_PDF_PAGE_1_POSITIONS as PAGE_1_POSITIONS,
  REGISTRATION_PDF_PAGE_2_POSITIONS as PAGE_2_POSITIONS,
  REGISTRATION_PDF_PREVIEW_HEIGHT as PREVIEW_HEIGHT,
  REGISTRATION_PDF_PREVIEW_WIDTH as PREVIEW_WIDTH,
} from '../../utils/defines/REGISTRATION_PDF_POSITIONS'

const s3Client = new S3Client({ region: getAwsRegion() })

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

  const size = args.size ?? 10.5
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
  const insuredCrewCount = String(registration.crew_list.length)

  // ── Page 1 header ─────────────────────────────────────────────────────
  drawPreviewText({
    page: page1,
    text: eventName,
    font,
    size: 10,
    maxPreviewWidth: 760,
    ...PAGE_1_POSITIONS.eventName,
  })
  drawPreviewText({
    page: page1,
    text: eventDates,
    font,
    size: 10,
    maxPreviewWidth: 320,
    ...PAGE_1_POSITIONS.eventDates,
  })

  // ── Page 1 form fields ──────────────────────────────────────────────
  drawPreviewText({
    page: page1,
    text: registration.boat_name,
    font,
    maxPreviewWidth: 520,
    ...PAGE_1_POSITIONS.boatName,
  })
  drawPreviewText({
    page: page1,
    text: registration.yacht_club,
    font,
    maxPreviewWidth: 760,
    ...PAGE_1_POSITIONS.yachtClub,
  })
  drawPreviewText({
    page: page1,
    text: registration.contact_email,
    font,
    maxPreviewWidth: 480,
    ...PAGE_1_POSITIONS.contactEmail,
  })
  drawPreviewText({
    page: page1,
    text: `${registration.contact_name}${registration.country ? `, ${registration.country}` : ''}`,
    font,
    maxPreviewWidth: 520,
    ...PAGE_1_POSITIONS.contactNameCountry,
  })
  drawPreviewText({
    page: page1,
    text: registration.skipper_name,
    font,
    maxPreviewWidth: 640,
    ...PAGE_1_POSITIONS.skipperName,
  })
  drawPreviewText({
    page: page1,
    text: registration.contact_phone,
    font,
    maxPreviewWidth: 360,
    ...PAGE_1_POSITIONS.contactPhone,
  })
  drawPreviewText({
    page: page1,
    text: registration.certificate_of_competency,
    font,
    maxPreviewWidth: 340,
    ...PAGE_1_POSITIONS.certificateOfCompetency,
  })
  drawPreviewText({
    page: page1,
    text: formatDateValue(registration.certificate_of_competency_expiry),
    font,
    maxPreviewWidth: 180,
    ...PAGE_1_POSITIONS.certificateOfCompetencyExpiry,
  })
  drawPreviewText({
    page: page1,
    text: registration.sail_number,
    font,
    maxPreviewWidth: 360,
    ...PAGE_1_POSITIONS.sailNumber,
  })
  drawPreviewText({
    page: page1,
    text: registration.model_design,
    font,
    maxPreviewWidth: 420,
    ...PAGE_1_POSITIONS.modelDesign,
  })
  drawPreviewText({
    page: page1,
    text: String(registration.boat_age),
    font,
    maxPreviewWidth: 120,
    ...PAGE_1_POSITIONS.boatAge,
  })
  drawPreviewText({
    page: page1,
    text: registration.border_number != null ? String(registration.border_number) : null,
    font,
    maxPreviewWidth: 260,
    ...PAGE_1_POSITIONS.borderNumber,
  })
  drawPreviewText({
    page: page1,
    text: registration.boat_color,
    font,
    maxPreviewWidth: 320,
    ...PAGE_1_POSITIONS.boatColor,
  })
  drawPreviewText({
    page: page1,
    text: `${registration.loa} m`,
    font,
    maxPreviewWidth: 140,
    ...PAGE_1_POSITIONS.loa,
  })
  drawPreviewText({
    page: page1,
    text:
      registration.certificate_of_navigation != null
        ? String(registration.certificate_of_navigation)
        : null,
    font,
    maxPreviewWidth: 300,
    ...PAGE_1_POSITIONS.certificateOfNavigation,
  })
  drawPreviewText({
    page: page1,
    text: formatDateValue(registration.certificate_of_navigation_expiry),
    font,
    maxPreviewWidth: 220,
    ...PAGE_1_POSITIONS.certificateOfNavigationExpiry,
  })
  drawPreviewText({
    page: page1,
    text: countryAndHarbour,
    font,
    maxPreviewWidth: 300,
    ...PAGE_1_POSITIONS.countryAndHarbour,
  })
  drawPreviewText({
    page: page1,
    text: registration.gph_irc,
    font,
    maxPreviewWidth: 320,
    ...PAGE_1_POSITIONS.gphIrcLeft,
  })
  drawPreviewText({
    page: page1,
    text: registration.gph_irc,
    font,
    maxPreviewWidth: 320,
    ...PAGE_1_POSITIONS.gphIrcRight,
  })

  // ── Page 1 insurance sections ───────────────────────────────────────
  drawPreviewText({
    page: page1,
    text: registration.crew_insurance ? insuredCrewCount : null,
    font,
    size: 10,
    maxPreviewWidth: 120,
    ...PAGE_1_POSITIONS.crewInsurance,
  })
  drawPreviewText({
    page: page1,
    text: registration.third_party_insurance ? 'Yes' : 'No',
    font,
    size: 10,
    maxPreviewWidth: 120,
    ...PAGE_1_POSITIONS.thirdPartyInsurance,
  })

  // ── Page 1 signature row ────────────────────────────────────────────
  drawPreviewText({
    page: page1,
    text: entryDate,
    font,
    size: 10,
    maxPreviewWidth: 180,
    ...PAGE_1_POSITIONS.entryDate,
  })
  drawPreviewText({
    page: page1,
    text: registration.skipper_name,
    font,
    size: 10,
    maxPreviewWidth: 420,
    ...PAGE_1_POSITIONS.skipperSignature,
  })

  // ── Page 2 header ─────────────────────────────────────────────────────
  drawPreviewText({
    page: page2,
    text: eventName,
    font,
    size: 10,
    maxPreviewWidth: 700,
    ...PAGE_2_POSITIONS.eventName,
  })
  drawPreviewText({
    page: page2,
    text: eventDates,
    font,
    size: 10,
    maxPreviewWidth: 320,
    ...PAGE_2_POSITIONS.eventDates,
  })

  // ── Page 2 boat info row ────────────────────────────────────────────
  drawPreviewText({
    page: page2,
    text: registration.boat_name,
    font,
    maxPreviewWidth: 620,
    ...PAGE_2_POSITIONS.boatName,
  })
  drawPreviewText({
    page: page2,
    text: registration.country,
    font,
    maxPreviewWidth: 300,
    ...PAGE_2_POSITIONS.country,
  })
  drawPreviewText({
    page: page2,
    text: registration.port_of_registry,
    font,
    maxPreviewWidth: 260,
    ...PAGE_2_POSITIONS.portOfRegistry,
  })

  // ── Page 2 crew list table ──────────────────────────────────────────
  registration.crew_list.slice(0, PAGE_2_POSITIONS.crewRows.length).forEach((crewMember, index) => {
    const row = PAGE_2_POSITIONS.crewRows[index]

    drawPreviewText({
      page: page2,
      text: crewMember.name,
      font,
      size: 9.5,
      maxPreviewWidth: 720,
      previewLeft: row.previewLeft,
      previewTop: row.previewTop,
    })
    drawPreviewText({
      page: page2,
      text: formatDateValue(crewMember.date_of_birth),
      font,
      size: 9.5,
      maxPreviewWidth: 180,
      previewLeft: row.dobPreviewLeft,
      previewTop: row.dobPreviewTop,
    })
  })

  // ── Page 2 signature row ────────────────────────────────────────────
  drawPreviewText({
    page: page2,
    text: entryDate,
    font,
    size: 10,
    maxPreviewWidth: 180,
    ...PAGE_2_POSITIONS.entryDate,
  })
  drawPreviewText({
    page: page2,
    text: registration.skipper_name,
    font,
    size: 10,
    maxPreviewWidth: 420,
    ...PAGE_2_POSITIONS.skipperSignature,
  })

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
