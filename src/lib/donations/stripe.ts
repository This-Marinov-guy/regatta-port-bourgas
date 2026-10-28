import Stripe from 'stripe'

export const DONATION_TITLE = '50 години Яхт Клуб "Порт Бургас"'
export const DONATION_STRIPE_ACCOUNT_ID = 'acct_1SplQNCWBeUhnnF9'

export function getDonationStripe() {
  const key = process.env.STRIPE_DONATIONS_SECRET_KEY?.trim()
  if (!key || !/^sk_(test|live)_/.test(key)) {
    throw new Error('STRIPE_DONATIONS_SECRET_KEY is not configured.')
  }
  return new Stripe(key)
}

export function getDonationWebhookSecret() {
  const secret = process.env.STRIPE_DONATIONS_WEBHOOK_SECRET?.trim()
  if (!secret || !secret.startsWith('whsec_')) {
    throw new Error('STRIPE_DONATIONS_WEBHOOK_SECRET is not configured.')
  }
  return secret
}

export async function assertDonationStripeAccount(stripe: Stripe) {
  const account = await stripe.accounts.retrieve(null)
  if (account.id !== DONATION_STRIPE_ACCOUNT_ID) {
    throw new Error('Stripe donations are configured for the wrong account.')
  }
}
