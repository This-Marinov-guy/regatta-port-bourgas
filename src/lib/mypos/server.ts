import {
  createPrivateKey,
  createSign,
  createVerify,
  X509Certificate,
} from 'crypto'
import type { AppLocale } from '@/lib/locale'
import { COUNTRY_ALPHA3_BY_ALIAS } from '@/utils/defines/COUNTRIES'

export type MyposFieldMap = Record<string, string | number>

export type MyposCheckoutDetails = {
  orderId: string
  checkoutUrl: string
  providerUrl: string
}

export type MyposConfigurationStatus = {
  enabled: boolean
  disabled: boolean
  missing: string[]
  invalid: string[]
}

type MyposConfig = {
  sid: string
  walletNumber: string
  keyIndex: string
  privateKey: string
  publicCertificate: string
}

const MYPOS_ENDPOINTS = {
  sandbox: 'https://www.mypos.com/vmp/checkout-test',
  production: 'https://www.mypos.com/vmp/checkout',
} as const

export function toMyposCountryCode(
  value: string | null | undefined
): string | undefined {
  const normalized = value?.trim().toLowerCase()

  if (!normalized) {
    return undefined
  }

  const mapped = COUNTRY_ALPHA3_BY_ALIAS[normalized]

  if (mapped) {
    return mapped
  }

  // Already a plausible alpha-3 code (e.g. "USA") we don't have an alias for.
  if (/^[a-z]{3}$/.test(normalized)) {
    return normalized.toUpperCase()
  }

  return undefined
}

const REQUIRED_MYPOS_ENV_KEYS = [
  'NEXT_PUBLIC_SITE_URL',
  'MYPOS_CONFIGURATION_PACK',
] as const

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} is not configured.`)
  }

  return value
}

function normalizeEnvValue(value: string) {
  const trimmed = value.trim()

  return (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ? trimmed.slice(1, -1)
      : trimmed
  )
}

function normalizePem(value: string) {
  return normalizeEnvValue(value)
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
}

function validatePrivateKey(value: string) {
  try {
    const key = createPrivateKey(normalizePem(value))

    if (key.asymmetricKeyType !== 'rsa') {
      throw new Error('The key is not RSA.')
    }
  } catch {
    throw new Error(
      'MYPOS_CONFIGURATION_PACK contains an invalid PEM RSA private key.'
    )
  }
}

function validatePublicCertificate(value: string) {
  try {
    new X509Certificate(normalizePem(value))
  } catch {
    throw new Error(
      'MYPOS_CONFIGURATION_PACK contains an invalid PEM public certificate.'
    )
  }
}

function readPackField(
  value: unknown,
  field: 'sid' | 'cn' | 'idx' | 'pk' | 'pc'
) {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    !String(value).trim()
  ) {
    throw new Error(
      `MYPOS_CONFIGURATION_PACK is missing the required "${field}" field.`
    )
  }

  return String(value).trim()
}

function parseMyposConfigurationPack(value: string): MyposConfig {
  let pack: unknown

  try {
    const decoded = Buffer.from(normalizeEnvValue(value), 'base64').toString('utf8')
    pack = JSON.parse(decoded)
  } catch {
    throw new Error(
      'MYPOS_CONFIGURATION_PACK is not a valid Base64-encoded JSON configuration pack.'
    )
  }

  if (!pack || typeof pack !== 'object' || Array.isArray(pack)) {
    throw new Error('MYPOS_CONFIGURATION_PACK must decode to a JSON object.')
  }

  const fields = pack as Record<string, unknown>
  const privateKey = normalizePem(readPackField(fields.pk, 'pk'))
  const publicCertificate = normalizePem(readPackField(fields.pc, 'pc'))

  validatePrivateKey(privateKey)
  validatePublicCertificate(publicCertificate)

  return {
    sid: readPackField(fields.sid, 'sid'),
    walletNumber: readPackField(fields.cn, 'cn'),
    keyIndex: readPackField(fields.idx, 'idx'),
    privateKey,
    publicCertificate,
  }
}

function getMyposEnvironment() {
  return process.env.MYPOS_ENVIRONMENT === 'production'
    ? 'production'
    : 'sandbox'
}

export function isMyposDisabled() {
  return process.env.NEXT_PUBLIC_MYPOS_DISABLED === 'true'
}

export function getMyposCheckoutEndpoint() {
  const configured = process.env.MYPOS_CHECKOUT_URL?.trim()

  if (configured) {
    return configured
  }

  return MYPOS_ENDPOINTS[getMyposEnvironment()]
}

export function getMyposConfigurationStatus(): MyposConfigurationStatus {
  if (isMyposDisabled()) {
    return { enabled: false, disabled: true, missing: [], invalid: [] }
  }

  const missing: string[] = REQUIRED_MYPOS_ENV_KEYS.filter(
    (name) => !process.env[name]?.trim()
  )

  const invalid: string[] = []
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const configurationPack = process.env.MYPOS_CONFIGURATION_PACK?.trim()

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

  if (configurationPack) {
    try {
      parseMyposConfigurationPack(configurationPack)
    } catch (error) {
      invalid.push(
        error instanceof Error ? error.message : 'Invalid myPOS configuration pack.'
      )
    }
  }

  return {
    enabled: missing.length === 0 && invalid.length === 0,
    disabled: false,
    missing,
    invalid,
  }
}

export function assertMyposConfigured() {
  const status = getMyposConfigurationStatus()

  if (!status.enabled) {
    if (status.disabled) {
      throw new Error('Payments are disabled (NEXT_PUBLIC_MYPOS_DISABLED=true).')
    }

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
  return parseMyposConfigurationPack(requireEnv('MYPOS_CONFIGURATION_PACK'))
}

function valuesForSigning(fields: MyposFieldMap) {
  return Object.values(fields).map((value) => String(value))
}

export function signMyposFields(fields: MyposFieldMap) {
  const { privateKey } = getMyposConfig()
  const payload = Buffer.from(valuesForSigning(fields).join('-')).toString('base64')

  return createSign('RSA-SHA256').update(payload, 'utf8').sign(privateKey, 'base64')
}

export function verifyMyposFields(fields: MyposFieldMap, signature: string) {
  const { publicCertificate } = getMyposConfig()
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
  registrationId?: string
}) {
  const { baseUrl, locale, eventSlug, registrationId } = args
  const params = new URLSearchParams({ locale, eventSlug })

  if (registrationId) {
    params.set('registrationId', registrationId)
  }
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

  // Fields MUST be built in myPOS' canonical IPCPurchase order: the signature is
  // computed over the values in this exact sequence, and myPOS reconstructs it
  // the same way. Any reordering (or putting optional fields out of place) yields
  // E_SIGNATURE_FAILED. Optional fields are included only when present, in slot.
  const fields: MyposFieldMap = {}
  const setField = (
    key: string,
    value: string | number | null | undefined
  ) => {
    if (value === null || value === undefined || value === '') {
      return
    }
    fields[key] = value
  }

  setField('IPCmethod', 'IPCPurchase')
  setField('IPCVersion', '1.4')
  setField('IPCLanguage', 'EN')
  setField('SID', config.sid)
  setField('WalletNumber', config.walletNumber)
  setField('Amount', centsToMyposAmount(args.amountCents))
  setField('Currency', currency)
  setField('OrderID', args.orderId)
  setField('URL_OK', args.okUrl)
  setField('URL_Cancel', args.cancelUrl)
  setField('URL_Notify', args.notifyUrl)
  setField('CardTokenRequest', '0')
  setField('KeyIndex', 4)
  setField('PaymentParametersRequired', '2')
  setField('PaymentMethod', '3')
  setField('CustomerEmail', args.customerEmail)
  setField('CustomerFirstNames', firstName || 'Customer')
  setField('CustomerFamilyName', familyName)
  setField('CustomerPhone', args.customerPhone)
  setField('CustomerCountry', toMyposCountryCode(args.customerCountry))
  setField('Note', args.note ?? '')
  setField('Source', 'Regatta Port Bourgas')
  setField('CartItems', '1')
  setField('Article_1', args.itemName)
  setField('Quantity_1', String(args.itemQuantity))
  setField('Price_1', centsToMyposAmount(args.itemUnitAmountCents))
  setField('Currency_1', currency)
  setField('Amount_1', centsToMyposAmount(args.amountCents))

  return {
    ...fields,
    Signature: signMyposFields(fields),
  }
}
