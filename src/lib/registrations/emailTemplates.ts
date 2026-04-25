import { format } from 'date-fns'
import type { AppLocale } from '@/lib/locale'
import { localizeText } from '@/lib/localizedContent'
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

type TemplateLocale = AppLocale

const EVENT_EMAIL_LOGO_URL =
  'https://rrzdfnbaqpotytofgrsi.supabase.co/storage/v1/object/public/internal/logo.jpg'

const registrationEmailCopy = {
  en: {
    eventFallback: 'International Regatta Bulstrad Port Bourgas ',
    dateUnavailable: 'Date unavailable',
    labels: {
      event: 'Event',
      dates: 'Dates',
      boat: 'Boat',
      skipper: 'Skipper',
      amount: 'Amount',
    },
    registrationConfirmation: {
      subject: 'Registration received for {boatName}',
      previewWithPayment: 'Registration received for {boatName}. Payment is still pending.',
      previewWithoutPayment: 'Registration received for {boatName}.',
      eyebrow: 'Registration Received',
      intro: 'Your event entry is in our system.',
      greeting: 'Hello {contactName},',
      statusTitle: 'Registration status',
      statusBody: 'Your registration for <strong>{boatName}</strong> has been received and is now in our system.',
      generatedReady:
        'Your generated registration form is ready. Download it here: <a href="{generatedUrl}" style="color:#0057b8;font-weight:700;">{generatedUrl}</a>.',
      generatedPending:
        'Your generated registration form will be sent to you as soon as it is ready.',
      paymentTitle: 'Payment required',
      paymentBody:
        'Your payment is still pending{payableAmount}. Complete the payment below to finalize the registration.',
      paymentAmountFragment: ' for <strong>{amount}</strong>',
      paymentNote:
        'Your registration will be treated as complete once the Stripe payment has been successfully finished.',
      nextStepTitle: 'Next step',
      nextStepBody:
        'Your registration has been received and is currently being processed by the organizing team.',
      buttonLabel: 'Complete payment',
      footerNote: 'The generated registration PDF is attached when available.',
      textGreeting: 'Hello {contactName},',
      textReceived: 'Your registration for {boatName} has been received.',
      textRegistrationForm: 'Registration form: {generatedUrl}',
      textGeneratedPending:
        'Your generated registration form will be sent once it is ready.',
      textPaymentPending:
        'Payment is still pending{payableAmount}. Complete it here: {checkoutUrl}',
      textPaymentAmountFragment: ' ({amount})',
      textProcessing: 'Your registration is currently being processed.',
    },
    paymentConfirmation: {
      subject: 'Payment confirmed for {boatName}',
      preview: 'Payment confirmed for {boatName}.',
      eyebrow: 'Payment Confirmed',
      intro: 'Your payment has been received and your registration is now complete.',
      greeting: 'Hello {contactName},',
      completeTitle: 'Everything is complete',
      completeBody:
        'We have received your payment for <strong>{boatName}</strong>{amount}.',
      amountFragment: ' in the amount of <strong>{amount}</strong>',
      registrationComplete:
        'Your registration for <strong>{eventName}</strong> is now fully complete.',
      welcomeNote:
        'We look forward to welcoming you on <strong>{eventDates}</strong>.',
      textGreeting: 'Hello {contactName},',
      textReceived: 'We have received your payment for {boatName}{amount}.',
      textAmountFragment: ' ({amount})',
      textComplete: 'Your registration for {eventName} is now complete.',
      paidFallback: 'Paid',
      eventDatesLabel: 'Event dates: {eventDates}',
    },
  },
  bg: {
    eventFallback: 'Международна Регата Булстрад Порт Бургас',
    dateUnavailable: 'Няма налична дата',
    labels: {
      event: 'Събитие',
      dates: 'Дати',
      boat: 'Лодка',
      skipper: 'Шкипер',
      amount: 'Сума',
    },
    registrationConfirmation: {
      subject: 'Получена регистрация за {boatName}',
      previewWithPayment: 'Получена регистрация за {boatName}. Плащането все още е очаквано.',
      previewWithoutPayment: 'Получена регистрация за {boatName}.',
      eyebrow: 'Получена Регистрация',
      intro: 'Вашата заявка за участие е записана в нашата система.',
      greeting: 'Здравейте, {contactName},',
      statusTitle: 'Статус на регистрацията',
      statusBody: 'Вашата регистрация за <strong>{boatName}</strong> беше получена и вече е в нашата система.',
      generatedReady:
        'Генерираната регистрационна форма е готова. Изтеглете я оттук: <a href="{generatedUrl}" style="color:#0057b8;font-weight:700;">{generatedUrl}</a>.',
      generatedPending:
        'Генерираната регистрационна форма ще ви бъде изпратена веднага щом е готова.',
      paymentTitle: 'Необходимо плащане',
      paymentBody:
        'Вашето плащане все още е очаквано{payableAmount}. Завършете плащането по-долу, за да финализирате регистрацията.',
      paymentAmountFragment: ' за <strong>{amount}</strong>',
      paymentNote:
        'Регистрацията ще се счита за завършена след успешно приключено плащане чрез Stripe.',
      nextStepTitle: 'Следваща стъпка',
      nextStepBody:
        'Вашата регистрация е получена и в момента се обработва от организаторския екип.',
      buttonLabel: 'Завърши плащането',
      footerNote: 'Генерираният регистрационен PDF е прикачен, когато е наличен.',
      textGreeting: 'Здравейте, {contactName},',
      textReceived: 'Вашата регистрация за {boatName} беше получена.',
      textRegistrationForm: 'Регистрационна форма: {generatedUrl}',
      textGeneratedPending:
        'Генерираната регистрационна форма ще бъде изпратена, когато е готова.',
      textPaymentPending:
        'Плащането все още е очаквано{payableAmount}. Завършете го тук: {checkoutUrl}',
      textPaymentAmountFragment: ' ({amount})',
      textProcessing: 'Вашата регистрация в момента се обработва.',
    },
    paymentConfirmation: {
      subject: 'Плащането е потвърдено за {boatName}',
      preview: 'Плащането е потвърдено за {boatName}.',
      eyebrow: 'Потвърдено Плащане',
      intro: 'Вашето плащане е получено и регистрацията ви вече е завършена.',
      greeting: 'Здравейте, {contactName},',
      completeTitle: 'Всичко е завършено',
      completeBody:
        'Получихме плащането за <strong>{boatName}</strong>{amount}.',
      amountFragment: ' на стойност <strong>{amount}</strong>',
      registrationComplete:
        'Вашата регистрация за <strong>{eventName}</strong> вече е напълно завършена.',
      welcomeNote:
        'Очакваме с нетърпение да ви посрещнем на <strong>{eventDates}</strong>.',
      textGreeting: 'Здравейте, {contactName},',
      textReceived: 'Получихме плащането за {boatName}{amount}.',
      textAmountFragment: ' ({amount})',
      textComplete: 'Вашата регистрация за {eventName} вече е завършена.',
      paidFallback: 'Платено',
      eventDatesLabel: 'Дати на събитието: {eventDates}',
    },
  },
} as const

function interpolate(
  template: string,
  values: Record<string, string | null | undefined>
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function eventName(registration: RegistrationWithEvent, locale: TemplateLocale) {
  return localizeText(
    locale,
    registration.event?.name_en,
    registration.event?.name_bg,
    registrationEmailCopy[locale].eventFallback
  )
}

function eventDates(registration: RegistrationWithEvent, locale: TemplateLocale) {
  if (!registration.event) {
    return registrationEmailCopy[locale].dateUnavailable
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
              <td style="padding:26px 30px;background:#3435aa;color:#ffffff;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="width:104px;vertical-align:middle;">
                      <img
                        src="${EVENT_EMAIL_LOGO_URL}"
                        alt="Event logo"
                        width="69"
                        style="display:block;width:88px;height:88px;max-width:100%;border-radius:50%;object-fit:cover;"
                      />
                    </td>
                    <td style="vertical-align:middle;">
                      <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;">
                        ${escapeHtml(args.eyebrow)}
                      </p>
                      <h1 style="margin:0;font-size:32px;line-height:1.2;font-weight:800;color:#ffffff;">
                        ${escapeHtml(args.title)}
                      </h1>
                    </td>
                  </tr>
                </table>
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
  locale?: TemplateLocale
}) {
  const { registration } = args
  const locale = args.locale === 'bg' ? 'bg' : 'en'
  const copy = registrationEmailCopy[locale].registrationConfirmation
  const labels = registrationEmailCopy[locale].labels
  const boatName = registration.boat_name
  const generatedUrl =
    args.generatedFormUrl ??
    registration.blank_link ??
    registration.generated_form_url ??
    null
  const checkoutUrl = paymentUrl(registration)
  const payableAmount = paymentSummary(registration)
  const subject = interpolate(copy.subject, { boatName })
  const summary = [
    { label: labels.event, value: eventName(registration, locale) },
    { label: labels.dates, value: eventDates(registration, locale) },
    { label: labels.boat, value: boatName },
    { label: labels.skipper, value: registration.skipper_name },
  ]

  const sections: HtmlSection[] = [
    {
      body: paragraph(
        interpolate(copy.greeting, { contactName: escapeHtml(registration.contact_name) })
      ),
    },
    {
      title: copy.statusTitle,
      body:
        paragraph(
          interpolate(copy.statusBody, { boatName: escapeHtml(boatName) })
        ) +
        (generatedUrl
          ? noteBox(
              interpolate(copy.generatedReady, {
                generatedUrl: escapeHtml(generatedUrl),
              }),
              'success'
            )
          : noteBox(copy.generatedPending, 'neutral')),
    },
  ]

  if (checkoutUrl) {
    sections.push({
      title: copy.paymentTitle,
      body:
        paragraph(
          interpolate(copy.paymentBody, {
            payableAmount: payableAmount
              ? interpolate(copy.paymentAmountFragment, {
                  amount: escapeHtml(payableAmount),
                })
              : '',
          })
        ) +
        noteBox(copy.paymentNote, 'warning'),
    })
  } else {
    sections.push({
      title: copy.nextStepTitle,
      body: paragraph(copy.nextStepBody),
    })
  }

  return {
    subject,
    html: renderEmailShell({
      previewText: checkoutUrl
        ? interpolate(copy.previewWithPayment, { boatName })
        : interpolate(copy.previewWithoutPayment, { boatName }),
      eyebrow: copy.eyebrow,
      title: boatName,
      intro: copy.intro,
      summary,
      sections,
      buttonLabel: checkoutUrl ? copy.buttonLabel : undefined,
      buttonUrl: checkoutUrl,
      footerNote: copy.footerNote,
    }),
    text: [
      interpolate(copy.textGreeting, { contactName: registration.contact_name }),
      '',
      interpolate(copy.textReceived, { boatName }),
      `${labels.event}: ${eventName(registration, locale)}`,
      `${labels.dates}: ${eventDates(registration, locale)}`,
      generatedUrl
        ? interpolate(copy.textRegistrationForm, { generatedUrl })
        : copy.textGeneratedPending,
      checkoutUrl
        ? interpolate(copy.textPaymentPending, {
            payableAmount: payableAmount
              ? interpolate(copy.textPaymentAmountFragment, {
                  amount: payableAmount,
                })
              : '',
            checkoutUrl,
          })
        : copy.textProcessing,
    ].join('\n'),
  } satisfies EmailTemplate
}

export function buildRegistrationPaymentConfirmationTemplate(
  registration: RegistrationWithEvent,
  locale: TemplateLocale = 'en'
) {
  const copy = registrationEmailCopy[locale].paymentConfirmation
  const labels = registrationEmailCopy[locale].labels
  const amount = paymentSummary(registration)
  const subject = interpolate(copy.subject, { boatName: registration.boat_name })

  return {
    subject,
    html: renderEmailShell({
      previewText: interpolate(copy.preview, { boatName: registration.boat_name }),
      eyebrow: copy.eyebrow,
      title: registration.boat_name,
      intro: copy.intro,
      summary: [
        { label: labels.event, value: eventName(registration, locale) },
        { label: labels.dates, value: eventDates(registration, locale) },
        { label: labels.boat, value: registration.boat_name },
        { label: labels.amount, value: amount ?? copy.paidFallback },
      ],
      sections: [
        {
          body: paragraph(
            interpolate(copy.greeting, {
              contactName: escapeHtml(registration.contact_name),
            })
          ),
        },
        {
          title: copy.completeTitle,
          body:
            paragraph(
              interpolate(copy.completeBody, {
                boatName: escapeHtml(registration.boat_name),
                amount: amount
                  ? interpolate(copy.amountFragment, { amount: escapeHtml(amount) })
                  : '',
              })
            ) +
            paragraph(
              interpolate(copy.registrationComplete, {
                eventName: escapeHtml(eventName(registration, locale)),
              })
            ) +
            noteBox(interpolate(copy.welcomeNote, {
              eventDates: escapeHtml(eventDates(registration, locale)),
            }), 'success'),
        },
      ],
    }),
    text: [
      interpolate(copy.textGreeting, { contactName: registration.contact_name }),
      '',
      interpolate(copy.textReceived, {
        boatName: registration.boat_name,
        amount: amount
          ? interpolate(copy.textAmountFragment, { amount })
          : '',
      }),
      interpolate(copy.textComplete, {
        eventName: eventName(registration, locale),
      }),
      interpolate(copy.eventDatesLabel, {
        eventDates: eventDates(registration, locale),
      }),
    ].join('\n'),
  } satisfies EmailTemplate
}

const statusChangeCopy = {
  en: {
    approved: {
      subject: 'Your registration for {boatName} has been approved',
      preview: 'Congratulations — your entry for {eventName} has been approved.',
      eyebrow: 'Registration Approved',
      title: 'You are in!',
      intro: 'Your entry has been officially approved.',
      greeting: 'Hello {contactName},',
      bodyTitle: 'Registration approved',
      body: 'Great news — your registration for <strong>{boatName}</strong> at <strong>{eventName}</strong> has been approved. We look forward to seeing you on the water!',
      welcomeNote: 'The event takes place on <strong>{eventDates}</strong>. Please keep an eye on your email for further updates from the organising team.',
      textGreeting: 'Hello {contactName},',
      textBody: 'Your registration for {boatName} at {eventName} has been approved.',
      textDates: 'Event dates: {eventDates}',
    },
    rejected: {
      subject: 'Update on your registration for {boatName}',
      preview: 'An update regarding your entry for {eventName}.',
      eyebrow: 'Registration Update',
      title: 'Registration not accepted',
      intro: 'We have reviewed your registration.',
      greeting: 'Hello {contactName},',
      bodyTitle: 'Registration status',
      body: 'Unfortunately, your registration for <strong>{boatName}</strong> at <strong>{eventName}</strong> has not been accepted at this time.',
      feedbackTitle: 'Feedback from the organising team',
      noFeedback: 'No additional feedback was provided. Please contact the organising team if you have any questions.',
      textGreeting: 'Hello {contactName},',
      textBody: 'Unfortunately, your registration for {boatName} at {eventName} has not been accepted.',
      textFeedback: 'Feedback: {feedback}',
    },
  },
  bg: {
    approved: {
      subject: 'Вашата регистрация за {boatName} е одобрена',
      preview: 'Поздравления — участието ви в {eventName} е одобрено.',
      eyebrow: 'Одобрена Регистрация',
      title: 'Добре дошли!',
      intro: 'Участието ви е официално одобрено.',
      greeting: 'Здравейте, {contactName},',
      bodyTitle: 'Регистрацията е одобрена',
      body: 'Страхотни новини — вашата регистрация за <strong>{boatName}</strong> в <strong>{eventName}</strong> е одобрена. Очакваме ви с нетърпение!',
      welcomeNote: 'Събитието се провежда на <strong>{eventDates}</strong>. Следете имейла си за допълнителна информация от организаторите.',
      textGreeting: 'Здравейте, {contactName},',
      textBody: 'Вашата регистрация за {boatName} в {eventName} е одобрена.',
      textDates: 'Дати на събитието: {eventDates}',
    },
    rejected: {
      subject: 'Информация относно вашата регистрация за {boatName}',
      preview: 'Информация относно участието ви в {eventName}.',
      eyebrow: 'Информация за Регистрацията',
      title: 'Регистрацията не е приета',
      intro: 'Разгледахме вашата регистрация.',
      greeting: 'Здравейте, {contactName},',
      bodyTitle: 'Статус на регистрацията',
      body: 'За съжаление, вашата регистрация за <strong>{boatName}</strong> в <strong>{eventName}</strong> не е приета към момента.',
      feedbackTitle: 'Коментар от организаторите',
      noFeedback: 'Не е предоставен допълнителен коментар. Свържете се с организаторите, ако имате въпроси.',
      textGreeting: 'Здравейте, {contactName},',
      textBody: 'За съжаление, вашата регистрация за {boatName} в {eventName} не е приета.',
      textFeedback: 'Коментар: {feedback}',
    },
  },
} as const

export function buildRegistrationStatusChangeTemplate(args: {
  registration: RegistrationWithEvent
  status: 'approved' | 'rejected'
  locale?: TemplateLocale
  feedback?: string | null
}) {
  const { registration, status, feedback } = args
  const locale = args.locale === 'bg' ? 'bg' : 'en'
  const copy = statusChangeCopy[locale][status]
  const labels = registrationEmailCopy[locale].labels
  const boatName = registration.boat_name
  const evtName = eventName(registration, locale)
  const evtDates = eventDates(registration, locale)
  const subject = interpolate(copy.subject, { boatName })

  const summary = [
    { label: labels.event, value: evtName },
    { label: labels.dates, value: evtDates },
    { label: labels.boat, value: boatName },
    { label: labels.skipper, value: registration.skipper_name },
  ]

  const sections: HtmlSection[] = [
    {
      body: paragraph(interpolate(copy.greeting, { contactName: escapeHtml(registration.contact_name) })),
    },
    {
      title: copy.bodyTitle,
      body:
        paragraph(
          interpolate(copy.body, {
            boatName: escapeHtml(boatName),
            eventName: escapeHtml(evtName),
          })
        ) +
        (status === 'approved'
          ? noteBox(interpolate((copy as typeof statusChangeCopy.en.approved).welcomeNote, { eventDates: escapeHtml(evtDates) }), 'success')
          : feedback
          ? noteBox(`<strong>${escapeHtml((copy as typeof statusChangeCopy.en.rejected).feedbackTitle)}:</strong><br>${escapeHtml(feedback)}`, 'warning')
          : noteBox((copy as typeof statusChangeCopy.en.rejected).noFeedback, 'neutral')),
    },
  ]

  const textLines = [
    interpolate(copy.textGreeting, { contactName: registration.contact_name }),
    '',
    interpolate(copy.textBody, { boatName, eventName: evtName }),
  ]

  if (status === 'approved') {
    textLines.push(interpolate((copy as typeof statusChangeCopy.en.approved).textDates, { eventDates: evtDates }))
  } else if (feedback) {
    textLines.push(interpolate((copy as typeof statusChangeCopy.en.rejected).textFeedback, { feedback }))
  }

  return {
    subject,
    html: renderEmailShell({
      previewText: interpolate(copy.preview, { boatName, eventName: evtName }),
      eyebrow: copy.eyebrow,
      title: copy.title,
      intro: copy.intro,
      summary,
      sections,
    }),
    text: textLines.join('\n'),
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
