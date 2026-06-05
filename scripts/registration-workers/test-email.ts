import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { buildRegistrationConfirmationTemplate } from '@/lib/registrations/emailTemplates'
import type { RegistrationWithEvent } from '@/lib/registrations/data'

const TEST_RECIPIENT = 'vladislavmarinov3142@gmail.com'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value
}

async function main() {
  const supabase = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
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
          end_date,
          fee_amount_cents,
          fee_type
        )
      `
    )
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (error) {
    throw new Error(`Failed to load first registration: ${error.message}`)
  }

  const registration = {
    ...data,
    generated_form_url: data.blank_link ?? null,
  } as RegistrationWithEvent

  const locale = registration.preferred_language === 'bg' ? 'bg' : 'en'
  const template = buildRegistrationConfirmationTemplate({ registration, locale })

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 465),
    secure: (process.env.SMTP_SECURE || 'true') !== 'false',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASSWORD'),
    },
  })

  const info = await transport.sendMail({
    from: { address: requireEnv('SMTP_FROM'), name: process.env.SMTP_NAME || undefined },
    replyTo: process.env.SMTP_REPLY_TO || undefined,
    to: TEST_RECIPIENT,
    subject: `[TEST] ${template.subject}`,
    text: template.text,
    html: template.html,
  })

  console.log(`Sent test email for "${registration.boat_name}" to ${TEST_RECIPIENT}`)
  console.log(`Message ID: ${info.messageId}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
