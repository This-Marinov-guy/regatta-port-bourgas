import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import { getRegistrationNotificationEmails, getRegistrationSmtpConfig } from './config'
import type { RegistrationWithEvent } from './data'
import {
  buildNewEventAnnouncementTemplate,
  buildRegistrationConfirmationTemplate,
  buildRegistrationPaymentConfirmationTemplate,
} from './emailTemplates'

let transport: nodemailer.Transporter | null = null

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
  return getRegistrationSmtpConfig().from
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
}) {
  const { registration, pdfBuffer, fileName, generatedFormUrl } = args
  const template = buildRegistrationConfirmationTemplate({
    registration,
    generatedFormUrl,
  })

  await getTransport().sendMail({
    from: getFromAddress(),
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
  registration: RegistrationWithEvent
) {
  const template = buildRegistrationPaymentConfirmationTemplate(registration)

  await getTransport().sendMail({
    from: getFromAddress(),
    to: registration.contact_email,
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

  await getTransport().sendMail({
    from: getFromAddress(),
    to: args.to,
    subject: template.subject,
    text: template.text,
    html: template.html,
  })
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

  await getTransport().sendMail({
    from: getFromAddress(),
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
