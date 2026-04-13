import { format } from 'date-fns'
import type { RegistrationWithEvent } from './data'

export type EmailTemplate = {
  subject: string
  text: string
  html: string
}

type NewEventTemplateArgs = {
  recipientName?: string | null
  eventName: string
  eventDates: string
  eventUrl: string
  prefillReferenceId?: string | null
}

type SummaryItem = {
  label: string
  value: string
}

type HtmlSection = {
  title?: string
  body: string
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function eventName(registration: RegistrationWithEvent) {
  return registration.event?.name_en ?? 'International Regatta Port Bourgas'
}

function eventDates(registration: RegistrationWithEvent) {
  if (!registration.event) {
    return 'Date unavailable'
  }

  return `${format(new Date(registration.event.start_date), 'dd.MM.yyyy')} - ${format(
    new Date(registration.event.end_date),
    'dd.MM.yyyy'
  )}`
}

function paymentSummary(registration: RegistrationWithEvent) {
  const stripe = registration.payment_data?.stripe

  if (!stripe?.total_amount || !stripe.currency) {
    return null
  }

  return `${(stripe.total_amount / 100).toFixed(2)} ${stripe.currency.toUpperCase()}`
}

function paymentUrl(registration: RegistrationWithEvent) {
  const stripe = registration.payment_data?.stripe

  if (!stripe?.checkout_url || stripe.payment_status === 'paid') {
    return null
  }

  return stripe.checkout_url
}

function prefillUrl(eventUrl: string, referenceId: string) {
  const joiner = eventUrl.includes('?') ? '&' : '?'
  return `${eventUrl}${joiner}reference_id=${encodeURIComponent(referenceId)}`
}

function paragraph(text: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.72;color:#334155;">${text}</p>`
}

function button(label: string, url: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0 0;">
      <tr>
        <td bgcolor="#0057b8" style="border-radius:14px;">
          <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 22px;font-size:16px;line-height:1.1;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `
}

function summaryCard(items: SummaryItem[]) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:0 0 10px;font-size:13px;line-height:1.4;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;width:34%;">
            ${escapeHtml(item.label)}
          </td>
          <td style="padding:0 0 10px;font-size:15px;line-height:1.55;color:#0f172a;font-weight:600;">
            ${escapeHtml(item.value)}
          </td>
        </tr>
      `
    )
    .join('')

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #e2e8f0;border-radius:18px;background:#f8fafc;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${rows}
          </table>
        </td>
      </tr>
    </table>
  `
}

function noteBox(text: string, tone: 'neutral' | 'warning' | 'success' = 'neutral') {
  const tones = {
    neutral: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#334155',
    },
    warning: {
      background: '#fff7ed',
      border: '#fdba74',
      color: '#9a3412',
    },
    success: {
      background: '#ecfdf5',
      border: '#86efac',
      color: '#166534',
    },
  }[tone]

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;border:1px solid ${tones.border};border-radius:16px;background:${tones.background};">
      <tr>
        <td style="padding:16px 18px;font-size:15px;line-height:1.68;color:${tones.color};">
          ${text}
        </td>
      </tr>
    </table>
  `
}

function sectionBlock(section: HtmlSection) {
  return `
    <div style="margin:0 0 24px;">
      ${
        section.title
          ? `<h2 style="margin:0 0 12px;font-size:19px;line-height:1.3;color:#0f172a;font-weight:700;">${escapeHtml(section.title)}</h2>`
          : ''
      }
      ${section.body}
    </div>
  `
}

function renderEmailShell(args: {
  previewText: string
  eyebrow: string
  title: string
  intro: string
  summary?: SummaryItem[]
  sections: HtmlSection[]
  buttonLabel?: string
  buttonUrl?: string | null
  footerNote?: string
}) {
  const summaryHtml = args.summary?.length ? summaryCard(args.summary) : ''
  const sectionsHtml = args.sections.map(sectionBlock).join('')
  const buttonHtml =
    args.buttonLabel && args.buttonUrl ? button(args.buttonLabel, args.buttonUrl) : ''
  const footerNoteHtml = args.footerNote
    ? `<p style="margin:28px 0 0;font-size:13px;line-height:1.7;color:#64748b;">${args.footerNote}</p>`
    : ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(args.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#eef3f8;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
      ${escapeHtml(args.previewText)}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3f8;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:720px;background:#ffffff;border:1px solid #dbe4ee;border-radius:28px;overflow:hidden;">
            <tr>
              <td style="padding:26px 30px;background:linear-gradient(135deg,#0057b8 0%,#2b86de 100%);">
                <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.78);">
                  ${escapeHtml(args.eyebrow)}
                </p>
                <h1 style="margin:0;font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;">
                  ${escapeHtml(args.title)}
                </h1>
              </td>
            </tr>
            <tr>
              <td style="padding:30px;">
                <p style="margin:0 0 24px;font-size:17px;line-height:1.72;color:#0f172a;font-weight:600;">
                  ${args.intro}
                </p>
                ${summaryHtml}
                ${sectionsHtml}
                ${buttonHtml}
                ${footerNoteHtml}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function buildRegistrationConfirmationTemplate(args: {
  registration: RegistrationWithEvent
  generatedFormUrl?: string | null
}) {
  const { registration } = args
  const boatName = registration.boat_name
  const generatedUrl =
    args.generatedFormUrl ??
    registration.blank_link ??
    registration.generated_form_url ??
    null
  const checkoutUrl = paymentUrl(registration)
  const payableAmount = paymentSummary(registration)
  const subject = `Registration received for ${boatName}`
  const summary = [
    { label: 'Event', value: eventName(registration) },
    { label: 'Dates', value: eventDates(registration) },
    { label: 'Boat', value: boatName },
    { label: 'Skipper', value: registration.skipper_name },
  ]

  const sections: HtmlSection[] = [
    {
      body: paragraph(`Hello ${escapeHtml(registration.contact_name)},`),
    },
    {
      title: 'Registration status',
      body:
        paragraph(
          `Your registration for <strong>${escapeHtml(boatName)}</strong> has been received and is now in our system.`
        ) +
        (generatedUrl
          ? noteBox(
              `Your generated registration form is ready. Download it here: <a href="${escapeHtml(generatedUrl)}" style="color:#0057b8;font-weight:700;">${escapeHtml(generatedUrl)}</a>.`,
              'success'
            )
          : noteBox('Your generated registration form will be sent to you as soon as it is ready.', 'neutral')),
    },
  ]

  if (checkoutUrl) {
    sections.push({
      title: 'Payment required',
      body:
        paragraph(
          `Your payment is still pending${payableAmount ? ` for <strong>${escapeHtml(payableAmount)}</strong>` : ''}. Complete the payment below to finalize the registration.`
        ) +
        noteBox(
          'Your registration will be treated as complete once the Stripe payment has been successfully finished.',
          'warning'
        ),
    })
  } else {
    sections.push({
      title: 'Next step',
      body: paragraph('Your registration has been received and is currently being processed by the organizing team.'),
    })
  }

  return {
    subject,
    html: renderEmailShell({
      previewText: checkoutUrl
        ? `Registration received for ${boatName}. Payment is still pending.`
        : `Registration received for ${boatName}.`,
      eyebrow: 'Registration Received',
      title: boatName,
      intro: 'Your event entry is in our system.',
      summary,
      sections,
      buttonLabel: checkoutUrl ? 'Complete payment' : undefined,
      buttonUrl: checkoutUrl,
      footerNote: 'The generated registration PDF is attached when available.',
    }),
    text: [
      `Hello ${registration.contact_name},`,
      '',
      `Your registration for ${boatName} has been received.`,
      `Event: ${eventName(registration)}`,
      `Dates: ${eventDates(registration)}`,
      generatedUrl
        ? `Registration form: ${generatedUrl}`
        : 'Your generated registration form will be sent once it is ready.',
      checkoutUrl
        ? `Payment is still pending${payableAmount ? ` (${payableAmount})` : ''}. Complete it here: ${checkoutUrl}`
        : 'Your registration is currently being processed.',
    ].join('\n'),
  } satisfies EmailTemplate
}

export function buildRegistrationPaymentConfirmationTemplate(
  registration: RegistrationWithEvent
) {
  const amount = paymentSummary(registration)
  const subject = `Payment confirmed for ${registration.boat_name}`

  return {
    subject,
    html: renderEmailShell({
      previewText: `Payment confirmed for ${registration.boat_name}.`,
      eyebrow: 'Payment Confirmed',
      title: registration.boat_name,
      intro: 'Your payment has been received and your registration is now complete.',
      summary: [
        { label: 'Event', value: eventName(registration) },
        { label: 'Dates', value: eventDates(registration) },
        { label: 'Boat', value: registration.boat_name },
        { label: 'Amount', value: amount ?? 'Paid' },
      ],
      sections: [
        {
          body: paragraph(`Hello ${escapeHtml(registration.contact_name)},`),
        },
        {
          title: 'Everything is complete',
          body:
            paragraph(
              `We have received your payment for <strong>${escapeHtml(registration.boat_name)}</strong>${amount ? ` in the amount of <strong>${escapeHtml(amount)}</strong>` : ''}.`
            ) +
            paragraph(
              `Your registration for <strong>${escapeHtml(eventName(registration))}</strong> is now fully complete.`
            ) +
            noteBox(
              `We look forward to welcoming you on <strong>${escapeHtml(eventDates(registration))}</strong>.`,
              'success'
            ),
        },
      ],
    }),
    text: [
      `Hello ${registration.contact_name},`,
      '',
      `We have received your payment for ${registration.boat_name}${amount ? ` (${amount})` : ''}.`,
      `Your registration for ${eventName(registration)} is now complete.`,
      `Event dates: ${eventDates(registration)}`,
    ].join('\n'),
  } satisfies EmailTemplate
}

export function buildNewEventAnnouncementTemplate(args: NewEventTemplateArgs) {
  const recipientName = args.recipientName?.trim() || 'Sailor'
  const prefillLink = args.prefillReferenceId
    ? prefillUrl(args.eventUrl, args.prefillReferenceId)
    : null
  const subject = `New event open for registration: ${args.eventName}`

  return {
    subject,
    html: renderEmailShell({
      previewText: `Registration is now open for ${args.eventName}.`,
      eyebrow: 'New Event',
      title: args.eventName,
      intro: 'Registration is now open.',
      summary: [
        { label: 'Event', value: args.eventName },
        { label: 'Dates', value: args.eventDates },
      ],
      sections: [
        {
          body: paragraph(`Hello ${escapeHtml(recipientName)},`),
        },
        {
          title: 'Event registration is live',
          body:
            paragraph(
              `A new event is now open for registration: <strong>${escapeHtml(args.eventName)}</strong>.`
            ) +
            paragraph(
              `The event dates are <strong>${escapeHtml(args.eventDates)}</strong>.`
            ) +
            (prefillLink
              ? noteBox(
                  'We found a previous registration under this email address. You can open a prefilled registration and start from your previous year data.',
                  'success'
                )
              : noteBox(
                  'Open the event page to review the details and start your registration.',
                  'neutral'
                )),
        },
      ],
      buttonLabel: prefillLink ? 'Open prefilled registration' : 'Open event page',
      buttonUrl: prefillLink ?? args.eventUrl,
      footerNote: prefillLink
        ? `If the prefilled button does not open correctly, use this direct URL: ${prefillLink}`
        : undefined,
    }),
    text: [
      `Hello ${recipientName},`,
      '',
      `A new event is now open for registration: ${args.eventName}`,
      `Dates: ${args.eventDates}`,
      prefillLink
        ? `We found a previous registration for this email. Start with prefilled data here: ${prefillLink}`
        : `Open the event page here: ${args.eventUrl}`,
    ].join('\n'),
  } satisfies EmailTemplate
}
