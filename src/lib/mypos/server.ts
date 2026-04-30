import { createSign, createVerify } from 'crypto'
import type { AppLocale } from '@/lib/locale'

export type MyposFieldMap = Record<string, string | number>

export type MyposCheckoutDetails = {
  orderId: string
  checkoutUrl: string
  providerUrl: string
}

export type MyposConfigurationStatus = {
  enabled: boolean
  missing: string[]
  invalid: string[]
}

const MYPOS_ENDPOINTS = {
  sandbox: 'https://www.mypos.com/vmp/checkout-test',
  production: 'https://www.mypos.com/vmp/checkout',
} as const

const REQUIRED_MYPOS_ENV_KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'MYPOS_SID',
  'MYPOS_WALLET_NUMBER',
  'MYPOS_PRIVATE_KEY',
] as const

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is not configured.`)
  }

  return value
}

function normalizePem(value: string) {
  return value.replace(/\\n/g, '\n')
}

function getMyposEnvironment() {
  return process.env.MYPOS_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox'
}

export function getMyposCheckoutEndpoint() {
  const configured = process.env.MYPOS_CHECKOUT_URL?.trim()

  if (configured) {
    return configured
  }

  return MYPOS_ENDPOINTS[getMyposEnvironment()]
}

export function getMyposConfigurationStatus(): MyposConfigurationStatus {
  const missing: string[] = REQUIRED_MYPOS_ENV_KEYS.filter(
    (name) => !process.env[name]?.trim()
  )

  if (
    !process.env.MYPOS_PUBLIC_CERTIFICATE?.trim() &&
    !process.env.MYPOS_CERTIFICATE?.trim()
  ) {
    missing.push('MYPOS_PUBLIC_CERTIFICATE')
  }

  const invalid: string[] = []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()

  if (siteUrl) {
    try {
      assertMyposReturnUrl(siteUrl)
    } catch (error) {
      invalid.push(
        error instanceof Error
          ? error.message
          : 'NEXT_PUBLIC_SITE_URL is not valid for myPOS checkout.'
      )
    }
  }

  return {
    enabled: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
  }
}

export function assertMyposConfigured() {
  const status = getMyposConfigurationStatus()

  if (!status.enabled) {
    const details = [
      status.missing.length ? `missing: ${status.missing.join(', ')}` : null,
      ...status.invalid,
    ].filter(Boolean)

    throw new Error(
      details.length
        ? `Payments are disabled because myPOS is not fully configured (${details.join('; ')}).`
        : 'Payments are disabled because myPOS is not fully configured.'
    )
  }
}

export function getMyposConfig() {
  return {
    sid: requireEnv('MYPOS_SID'),
    walletNumber: requireEnv('MYPOS_WALLET_NUMBER'),
    keyIndex: process.env.MYPOS_KEY_INDEX?.trim() || '1',
    publicCertificate: normalizePem(
      process.env.MYPOS_PUBLIC_CERTIFICATE?.trim() ||
        process.env.MYPOS_CERTIFICATE?.trim() ||
        ''
    ),
  }
}

function valuesForSigning(fields: MyposFieldMap) {
  return Object.values(fields).map((value) => String(value))
}

export function signMyposFields(fields: MyposFieldMap) {
  const privateKey = normalizePem(requireEnv('MYPOS_PRIVATE_KEY'))
  const payload = Buffer.from(valuesForSigning(fields).join('-')).toString('base64')

  return createSign('RSA-SHA256').update(payload, 'utf8').sign(privateKey, 'base64')
}

export function verifyMyposFields(fields: MyposFieldMap, signature: string) {
  const { publicCertificate } = getMyposConfig()

  if (!publicCertificate) {
    throw new Error('MYPOS_PUBLIC_CERTIFICATE is not configured.')
  }

  const payload = Buffer.from(valuesForSigning(fields).join('-')).toString('base64')

  return createVerify('RSA-SHA256')
    .update(payload, 'utf8')
    .verify(publicCertificate, Buffer.from(signature, 'base64'))
}

export function createMyposOrderId(registrationId: string) {
  return `reg_${registrationId}_${Date.now()}`
}

export function getRegistrationIdFromMyposOrder(orderId: string) {
  const match = orderId.match(/^reg_([0-9a-f-]{36})_\d+$/i)

  return match?.[1] ?? null
}

export function centsToMyposAmount(cents: number) {
  return (cents / 100).toFixed(2)
}

export function myposAmountToCents(amount: string | null | undefined) {
  if (!amount) {
    return null
  }

  const parsed = Number(amount)

  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null
}

export function assertMyposReturnUrl(url: string) {
  if (
    !url.startsWith('https://') &&
    process.env.MYPOS_ALLOW_INSECURE_URLS !== 'true'
  ) {
    throw new Error(
      'myPOS checkout requires NEXT_PUBLIC_SITE_URL to be an HTTPS URL. Set MYPOS_ALLOW_INSECURE_URLS=true only for local tunnel testing.'
    )
  }

  if (new URL(url).port) {
    throw new Error('myPOS checkout callback URLs must not include a port.')
  }
}

export function buildMyposReturnUrls(args: {
  baseUrl: string
  locale: AppLocale
  eventSlug: string
}) {
  const { baseUrl, locale, eventSlug } = args
  const params = new URLSearchParams({ locale, eventSlug })
  const okUrl = `${baseUrl}/api/mypos/checkout/ok?${params.toString()}`
  const cancelUrl = `${baseUrl}/api/mypos/checkout/cancel?${params.toString()}`
  const notifyUrl = `${baseUrl}/api/mypos/webhook/checkout`

  assertMyposReturnUrl(okUrl)
  assertMyposReturnUrl(cancelUrl)
  assertMyposReturnUrl(notifyUrl)

  return {
    okUrl,
    cancelUrl,
    notifyUrl,
  }
}

export function buildMyposPurchaseFields(args: {
  amountCents: number
  currency: string
  orderId: string
  okUrl: string
  cancelUrl: string
  notifyUrl: string
  customerEmail: string
  customerPhone?: string | null
  customerName: string
  customerCountry?: string | null
  itemName: string
  itemQuantity: number
  itemUnitAmountCents: number
  note?: string
}) {
  const config = getMyposConfig()
  const [firstName, ...familyNameParts] = args.customerName.trim().split(/\s+/)
  const familyName = familyNameParts.join(' ') || firstName || 'Customer'
  const currency = args.currency.toUpperCase()
  const fields: MyposFieldMap = {
    IPCmethod: 'IPCPurchase',
    IPCVersion: '1.4',
    IPCLanguage: 'EN',
    SID: config.sid,
    WalletNumber: config.walletNumber,
    Amount: centsToMyposAmount(args.amountCents),
    Currency: currency,
    OrderID: args.orderId,
    URL_OK: args.okUrl,
    URL_Cancel: args.cancelUrl,
    URL_Notify: args.notifyUrl,
    CardTokenRequest: '0',
    KeyIndex: config.keyIndex,
    PaymentParametersRequired: '2',
    PaymentMethod: '3',
    CustomerEmail: args.customerEmail,
    CustomerFirstNames: firstName || 'Customer',
    CustomerFamilyName: familyName,
    Source: 'Regatta Port Bourgas',
    Note: args.note ?? '',
    CartItems: '1',
    Article_1: args.itemName,
    Quantity_1: String(args.itemQuantity),
    Price_1: centsToMyposAmount(args.itemUnitAmountCents),
    Currency_1: currency,
    Amount_1: centsToMyposAmount(args.amountCents),
  }

  if (args.customerPhone) {
    fields.CustomerPhone = args.customerPhone
  }

  if (args.customerCountry) {
    fields.CustomerCountry = args.customerCountry
  }

  return {
    ...fields,
    Signature: signMyposFields(fields),
  }
}
