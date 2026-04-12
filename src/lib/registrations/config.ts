function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

function optionalBoolean(value: string | undefined, fallback: boolean) {
  if (value == null) {
    return fallback
  }

  return value === 'true'
}

function optionalNumber(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function getAwsRegion() {
  return process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'eu-central-1'
}

export function getRegistrationEventsTopicArn() {
  return process.env.AWS_REGISTRATION_EVENTS_TOPIC_ARN || null
}

export function getRegistrationOutputBucket() {
  return requireEnv(
    'AWS_REGISTRATION_OUTPUT_BUCKET',
    process.env.AWS_REGISTRATION_OUTPUT_BUCKET
  )
}

export function getRegistrationOutputPublicBaseUrl() {
  return process.env.AWS_REGISTRATION_OUTPUT_PUBLIC_BASE_URL || null
}

export function getRegistrationTemplatePath() {
  return process.env.REGISTRATION_TEMPLATE_PATH || 'public/documents/register-form-empty.pdf'
}

export function getRegistrationTemplateBucket() {
  return process.env.AWS_REGISTRATION_TEMPLATE_BUCKET || null
}

export function getRegistrationTemplateKey() {
  return process.env.AWS_REGISTRATION_TEMPLATE_KEY || null
}

export function getRegistrationPdfFontBucket() {
  return process.env.AWS_REGISTRATION_PDF_FONT_BUCKET || null
}

export function getRegistrationPdfFontKey() {
  return process.env.AWS_REGISTRATION_PDF_FONT_KEY || null
}

export function getRegistrationPdfFontPath() {
  return process.env.REGISTRATION_PDF_FONT_PATH || 'public/fonts/Manrope/Manrope-ExtraBold.ttf'
}

export function getRegistrationNotificationEmails() {
  return (process.env.REGISTRATION_NOTIFICATION_EMAILS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function getRegistrationSmtpConfig() {
  return {
    host: process.env.REGISTRATION_SMTP_HOST || 'smtp.gmail.com',
    port: optionalNumber(process.env.REGISTRATION_SMTP_PORT, 465),
    secure: optionalBoolean(process.env.REGISTRATION_SMTP_SECURE, true),
    user: requireEnv('REGISTRATION_SMTP_USER', process.env.REGISTRATION_SMTP_USER),
    pass: requireEnv(
      'REGISTRATION_SMTP_PASSWORD',
      process.env.REGISTRATION_SMTP_PASSWORD
    ),
    from: requireEnv('REGISTRATION_SMTP_FROM', process.env.REGISTRATION_SMTP_FROM),
  }
}
