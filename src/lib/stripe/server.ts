import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function requireEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export function getStripeServerClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(requireEnv('STRIPE_SECRET_KEY'))
  }

  return stripeClient
}

function getStripeWebhookSecret() {
  return requireEnv('STRIPE_WEBHOOK_SECRET')
}

export function constructStripeWebhookEvent(payload: string | Buffer, signature: string) {
  return getStripeServerClient().webhooks.constructEvent(
    payload,
    signature,
    getStripeWebhookSecret()
  )
}
