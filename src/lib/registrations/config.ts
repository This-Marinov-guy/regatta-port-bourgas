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

function optionalString(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function getAwsRegion() {
  // CUSTOM_AWS_REGION is used because Vercel reserves AWS_REGION on its
  // Functions runtime and overwrites any user-set value.
  return (
    process.env.CUSTOM_AWS_REGION ||
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    'eu-central-1'
  )
}

export function getAwsCredentials() {
  // Vercel reserves AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY on its Functions
  // runtime and replaces them with its own Lambda role creds, which can't reach
  // our SNS topic / S3 buckets. Use CUSTOM_AWS_* on Vercel; fall back to the
  // standard names for local dev.
  const accessKeyId =
    process.env.CUSTOM_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey =
    process.env.CUSTOM_AWS_SECRET_ACCESS_KEY ||
    process.env.AWS_SECRET_ACCESS_KEY

  if (!accessKeyId || !secretAccessKey) {
    return undefined
  }

  return { accessKeyId, secretAccessKey }
}

export function getAwsClientConfig() {
  return { region: getAwsRegion(), credentials: getAwsCredentials() }
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
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: optionalNumber(process.env.SMTP_PORT, 465),
    secure: optionalBoolean(process.env.SMTP_SECURE, true),
    user: requireEnv('SMTP_USER', process.env.SMTP_USER),
    pass: requireEnv(
      'SMTP_PASSWORD',
      process.env.SMTP_PASSWORD
    ),
    from: requireEnv('SMTP_FROM', process.env.SMTP_FROM),
    name: optionalString(process.env.SMTP_NAME),
    replyTo: optionalString(process.env.SMTP_REPLY_TO),
  }
}
