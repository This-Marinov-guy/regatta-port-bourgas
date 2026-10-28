import nodemailer from 'nodemailer'
import { createSupabaseServiceClient } from '@/lib/supabase/service'
import {
  getRegistrationNotificationEmails,
  getRegistrationSmtpConfig,
} from '@/lib/registrations/config'

type PaidDonation = {
  id: string
  amount_cents: number
  currency: string
  name: string | null
  transaction_ref: string | null
  paid_at: string | null
}

function getDonationNotificationEmails() {
  const configured = process.env.DONATION_NOTIFICATION_EMAILS
  return configured === undefined
    ? getRegistrationNotificationEmails()
    : configured.split(',').map((email) => email.trim()).filter(Boolean)
}

export function buildPaidDonationNotification(donation: PaidDonation) {
  const amount = `${(donation.amount_cents / 100).toFixed(2)} ${donation.currency}`
  return {
    subject: `Ново платено дарение: ${amount}`,
    text: [
      'Получено е ново платено дарение.',
      '',
      `Сума: ${amount}`,
      `Име: ${donation.name || 'Не е посочено'}`,
      `Референция на плащането: ${donation.transaction_ref || 'Няма'}`,
      `Платено на: ${donation.paid_at || 'Няма'}`,
      `ID на дарението: ${donation.id}`,
    ].join('\n'),
  }
}

export async function sendPaidDonationNotificationToAdmins(donationId: string) {
  const recipients = getDonationNotificationEmails()
  if (recipients.length === 0) {
    throw new Error('No donation notification recipients are configured.')
  }

  const { data, error } = await createSupabaseServiceClient()
    .from('donations')
    .select('id, amount_cents, currency, name, transaction_ref, paid_at')
    .eq('id', donationId)
    .eq('status', 'paid')
    .single()
  if (error) throw error

  const smtp = getRegistrationSmtpConfig()
  const message = buildPaidDonationNotification(data)
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  })

  await transport.sendMail({
    from: { address: smtp.from, name: smtp.name || undefined },
    replyTo: smtp.replyTo || undefined,
    to: recipients,
    subject: message.subject,
    text: message.text,
  })
}
