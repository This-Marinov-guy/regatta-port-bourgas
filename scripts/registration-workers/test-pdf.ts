import path from 'node:path'
import { promises as fs } from 'node:fs'
import { Readable } from 'node:stream'
import { createClient } from '@supabase/supabase-js'
import fontkit from '@pdf-lib/fontkit'
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { PDFDocument, type PDFPage, rgb } from 'pdf-lib'
import { format } from 'date-fns'

type CrewMember = {
  name: string
  date_of_birth?: string
}

type RegistrationWithEvent = {
  id: string
  event_id: string
  boat_name: string
  border_number: number | null
  country: string
  certificate_of_navigation: number | null
  certificate_of_navigation_expiry: string | null
  model_design: string
  sail_number: string
  boat_age: number
  port_of_registry: string | null
  gph_irc: string
  loa: number
  boat_color: string | null
  yacht_club: string | null
  skipper_name: string
  skipper_yacht_club: string
  charterer_name: string | null
  certificate_of_competency: string
  certificate_of_competency_expiry: string | null
  contact_name: string
  contact_phone: string
  contact_email: string
  receive_documents_by_email: boolean
  crew_insurance: boolean
  third_party_insurance: boolean
  disclaimer_accepted: boolean
  gdpr_accepted: boolean
  crew_list: CrewMember[]
  generated_form_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  event: {
    id: string
    slug: string
    name_en: string
    name_bg: string | null
    start_date: string
    end_date: string
  } | null
}

const PREVIEW_WIDTH = 1755
const PREVIEW_HEIGHT = 1240
const PAGE_1_POSITIONS = {
  eventName: { previewLeft: 364.1, previewTop: 62.2 },
  eventDates: { previewLeft: 1215.6, previewTop: 130.8 },
  boatName: { previewLeft: 234.3, previewTop: 302.6 },
  yachtClub: { previewLeft: 846.3, previewTop: 304.3 },
  contactNameCountry: { previewLeft: 890.7, previewTop: 363.7 },
  contactEmail: { previewLeft: 167.7, previewTop: 367.6 },
  skipperName: { previewLeft: 167.9, previewTop: 431.4 },
  contactPhone: { previewLeft: 1193.1, previewTop: 428.5 },
  certificateOfCompetency: { previewLeft: 333.8, previewTop: 474.2 },
  certificateOfCompetencyExpiry: { previewLeft: 1260.4, previewTop: 475.7 },
  sailNumber: { previewLeft: 154.5, previewTop: 534.9 },
  modelDesign: { previewLeft: 712.7, previewTop: 550.7 },
  boatAge: { previewLeft: 1305.8, previewTop: 541.2 },
  borderNumber: { previewLeft: 231.3, previewTop: 615.7 },
  boatColor: { previewLeft: 738.8, previewTop: 603.4 },
  loa: { previewLeft: 1191.5, previewTop: 602.8 },
  certificateOfNavigation: { previewLeft: 379.1, previewTop: 676.5 },
  certificateOfNavigationExpiry: { previewLeft: 837.7, previewTop: 680.4 },
  countryAndHarbour: { previewLeft: 1340.6, previewTop: 678.3 },
  gphIrcLeft: { previewLeft: 252.7, previewTop: 738.6 },
  gphIrcRight: { previewLeft: 753.1, previewTop: 737.1 },
  crewInsurance: { previewLeft: 1115.5, previewTop: 819.2 },
  thirdPartyInsurance: { previewLeft: 1108.5, previewTop: 983.1 },
  entryDate: { previewLeft: 155.8, previewTop: 1096.7 },
  skipperSignature: { previewLeft: 536.7, previewTop: 1099.2 },
} as const
const PAGE_2_POSITIONS = {
  eventName: { previewLeft: 521.5, previewTop: 50.2 },
  eventDates: { previewLeft: 1195.2, previewTop: 99.9 },
  boatName: { previewLeft: 223.8, previewTop: 306.5 },
  country: { previewLeft: 941.5, previewTop: 311.1 },
  portOfRegistry: { previewLeft: 1366.3, previewTop: 306.7 },
  crewRows: [
    { previewLeft: 159.7, previewTop: 626.7, dobPreviewLeft: 1191.6, dobPreviewTop: 623.8 },
    { previewLeft: 158.9, previewTop: 660.2, dobPreviewLeft: 1193.2, dobPreviewTop: 662.0 },
    { previewLeft: 158.8, previewTop: 693.4, dobPreviewLeft: 1191.8, dobPreviewTop: 694.5 },
    { previewLeft: 158.5, previewTop: 727.8, dobPreviewLeft: 1191.4, dobPreviewTop: 730.7 },
    { previewLeft: 158.7, previewTop: 761.3, dobPreviewLeft: 1192.0, dobPreviewTop: 761.1 },
    { previewLeft: 158.2, previewTop: 798.0, dobPreviewLeft: 1191.7, dobPreviewTop: 793.7 },
    { previewLeft: 157.7, previewTop: 828.7, dobPreviewLeft: 1190.0, dobPreviewTop: 830.4 },
    { previewLeft: 158.0, previewTop: 862.9, dobPreviewLeft: 1189.9, dobPreviewTop: 864.2 },
    { previewLeft: 156.8, previewTop: 895.9, dobPreviewLeft: 1190.5, dobPreviewTop: 894.8 },
    { previewLeft: 155.5, previewTop: 931.9, dobPreviewLeft: 1190.5, dobPreviewTop: 928.9 },
    { previewLeft: 155.5, previewTop: 964.9, dobPreviewLeft: 1190.0, dobPreviewTop: 961.0 },
    { previewLeft: 154.8, previewTop: 997.3, dobPreviewLeft: 1189.8, dobPreviewTop: 995.0 },
    { previewLeft: 156.3, previewTop: 1027.6, dobPreviewLeft: 1189.8, dobPreviewTop: 1026.3 },
    { previewLeft: 154.9, previewTop: 1061.1, dobPreviewLeft: 1187.7, dobPreviewTop: 1065.6 },
  ],
  entryDate: { previewLeft: 176.2, previewTop: 1122.7 },
  skipperSignature: { previewLeft: 489.8, previewTop: 1130.5 },
} as const
const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1',
})

async function loadEnvFile(relativePath: string) {
  const filePath = path.join(process.cwd(), relativePath)

  try {
    const raw = await fs.readFile(filePath, 'utf8')
    const lines = raw.split(/\r?\n/)

    for (const line of lines) {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()

      if (!key || process.env[key] != null) {
        continue
      }

      process.env[key] = value.replace(/^['"]|['"]$/g, '')
    }
  } catch {
    // Ignore missing local env files and rely on the current environment.
  }
}

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function getTemplatePath() {
  return process.env.REGISTRATION_TEMPLATE_PATH || 'public/documents/register-form-empty.pdf'
}

function getTemplateBucket() {
  return process.env.AWS_REGISTRATION_TEMPLATE_BUCKET || null
}

function getTemplateKey() {
  return process.env.AWS_REGISTRATION_TEMPLATE_KEY || null
}

function getFontPath() {
  return process.env.REGISTRATION_PDF_FONT_PATH || 'public/fonts/Manrope/Manrope-ExtraBold.ttf'
}

function getFontBucket() {
  return process.env.AWS_REGISTRATION_PDF_FONT_BUCKET || null
}

function getFontKey() {
  return process.env.AWS_REGISTRATION_PDF_FONT_KEY || null
}

async function streamToBuffer(stream: Readable) {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

async function loadTemplateBytes() {
  const bucket = getTemplateBucket()
  const key = getTemplateKey()

  if (bucket && key) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('Unable to read template PDF from S3.')
    }

    return streamToBuffer(response.Body)
  }

  return fs.readFile(path.join(process.cwd(), getTemplatePath()))
}

async function loadFontBytes() {
  const bucket = getFontBucket()
  const key = getFontKey()

  if (bucket && key) {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )

    if (!response.Body || !(response.Body instanceof Readable)) {
      throw new Error('Unable to read PDF font from S3.')
    }

    return streamToBuffer(response.Body)
  }

  return fs.readFile(path.join(process.cwd(), getFontPath()))
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

async function generateRegistrationPdf(registration: RegistrationWithEvent) {
  const [templateBytes, fontBytes] = await Promise.all([
    loadTemplateBytes(),
    loadFontBytes(),
  ])

  const pdf = await PDFDocument.load(templateBytes)
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const [page1, page2] = pdf.getPages()

  const eventName =
    registration.event?.name_en ||
    registration.event?.name_bg ||
    'International Regatta Port Bourgas'
  const eventDates = registration.event
    ? `${format(new Date(registration.event.start_date), 'dd.MM.yyyy')} - ${format(
        new Date(registration.event.end_date),
        'dd.MM.yyyy'
      )}`
    : ''
  const countryAndHarbour = [registration.country, registration.port_of_registry]
    .filter(Boolean)
    .join(' / ')
  const entryDate = format(new Date(), 'dd.MM.yyyy')

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
    text: registration.crew_insurance ? 'Yes' : 'No',
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

async function main() {
  await loadEnvFile('.env.local')
  await loadEnvFile('.env')

  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  const { data, error } = await supabase
    .from('registrations')
    .select(
      `
        *,
        event:events(
          id,
          slug,
          name_en,
          name_bg,
          start_date,
          end_date
        )
      `
    )
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    throw new Error('No registrations found in the database.')
  }

  const registration = data as RegistrationWithEvent
  const generated = await generateRegistrationPdf(registration)
  const outputDir = path.join(process.cwd(), 'tmp', 'registration-pdf-preview')
  const outputPath = path.join(outputDir, generated.fileName)

  await fs.mkdir(outputDir, { recursive: true })
  await fs.writeFile(outputPath, generated.pdfBuffer)

  console.log(`Generated PDF for registration ${registration.id}`)
  console.log(`Boat: ${registration.boat_name}`)
  console.log(`Output: ${outputPath}`)
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Failed to generate registration PDF.'
  )
  process.exit(1)
})
