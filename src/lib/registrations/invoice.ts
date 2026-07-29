import type { RegistrationInvoiceData } from '@/types/admin'

type InvoiceDataPayload = {
  company_name?: unknown
  vat_number?: unknown
  company_registration_number?: unknown
  address?: unknown
  city?: unknown
  country?: unknown
}

function requireInvoiceText(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label} is required.`)
  }

  return value.trim()
}

export function normalizeRegistrationInvoiceData(
  value: unknown,
): RegistrationInvoiceData | null {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invoice details must be a valid object.')
  }

  const invoice = value as InvoiceDataPayload
  const invoiceIdentifier = invoice.vat_number || invoice.company_registration_number

  return {
    company_name: requireInvoiceText(
      invoice.company_name,
      'Invoice company / recipient name',
    ),
    vat_number: requireInvoiceText(invoiceIdentifier, 'Invoice VAT number / EIK'),
    company_registration_number: requireInvoiceText(
      invoiceIdentifier,
      'Invoice VAT number / EIK',
    ),
    address: requireInvoiceText(invoice.address, 'Invoice address'),
    city: requireInvoiceText(invoice.city, 'Invoice city'),
    country: requireInvoiceText(invoice.country, 'Invoice country'),
  }
}
