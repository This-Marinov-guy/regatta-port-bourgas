'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Icon } from '@iconify/react'
import toast from 'react-hot-toast'
import { Button } from '@/app/components/ui/button'
import type { RegistrationInvoiceData } from '@/types/admin'

type Props = {
  registrationId: string
  session: string
  initialData: RegistrationInvoiceData | null
}

const emptyInvoiceData: RegistrationInvoiceData = {
  company_name: '',
  vat_number: '',
  company_registration_number: '',
  address: '',
  city: '',
  country: '',
}

function inputClassName() {
  return 'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/10 dark:bg-black/20 dark:text-white'
}

export default function RegistrationInvoiceForm({
  registrationId,
  session,
  initialData,
}: Props) {
  const t = useTranslations('payment')
  const [isExpanded, setIsExpanded] = useState(Boolean(initialData))
  const [invoiceData, setInvoiceData] = useState<RegistrationInvoiceData>(
    initialData ?? emptyInvoiceData,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateField<K extends keyof RegistrationInvoiceData>(
    field: K,
    value: RegistrationInvoiceData[K],
  ) {
    setError('')
    setInvoiceData((current) => ({ ...current, [field]: value }))
  }

  function updateInvoiceIdentifier(value: string) {
    setError('')
    setInvoiceData((current) => ({
      ...current,
      vat_number: value,
      company_registration_number: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const response = await fetch(
        `/api/registrations/${encodeURIComponent(registrationId)}/invoice?session=${encodeURIComponent(session)}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ invoice_data: invoiceData }),
        },
      )
      const payload = (await response.json().catch(() => null)) as {
        data?: { invoice_data?: RegistrationInvoiceData }
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(payload?.error || t('invoiceError'))
      }

      if (payload?.data?.invoice_data) {
        setInvoiceData(payload.data.invoice_data)
      }
      toast.success(t('invoiceSaved'))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t('invoiceError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-black/10 bg-white/85 p-5 shadow-sm dark:border-white/10 dark:bg-black/20 sm:p-6">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <span>
          <span className="block text-xl font-semibold text-dark dark:text-white sm:text-2xl">
            {t('invoiceSection')}
          </span>
          <span className="mt-2 block leading-7 text-dark/65 dark:text-white/65">
            {t('invoiceDescription')}
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
          {isExpanded ? t('invoiceCollapse') : t('invoiceAdd')}
          <Icon
            icon="ph:caret-down-bold"
            width={16}
            height={16}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isExpanded ? (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block font-medium text-dark dark:text-white">
              {t('invoiceLabels.companyName')} *
            </span>
            <input
              required
              value={invoiceData.company_name}
              onChange={(event) => updateField('company_name', event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium text-dark dark:text-white">
              {t('invoiceLabels.vatNumber')} *
            </span>
            <input
              required
              value={
                invoiceData.vat_number || invoiceData.company_registration_number
              }
              onChange={(event) => updateInvoiceIdentifier(event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-2 block font-medium text-dark dark:text-white">
              {t('invoiceLabels.address')} *
            </span>
            <input
              required
              value={invoiceData.address}
              onChange={(event) => updateField('address', event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium text-dark dark:text-white">
              {t('invoiceLabels.city')} *
            </span>
            <input
              required
              value={invoiceData.city}
              onChange={(event) => updateField('city', event.target.value)}
              className={inputClassName()}
            />
          </label>
          <label className="block">
            <span className="mb-2 block font-medium text-dark dark:text-white">
              {t('invoiceLabels.country')} *
            </span>
            <input
              required
              value={invoiceData.country}
              onChange={(event) => updateField('country', event.target.value)}
              className={inputClassName()}
            />
          </label>

          <div className="sm:col-span-2">
            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
            <div className="mt-4 flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-xl px-5 text-white">
                {saving ? t('invoiceSaving') : t('invoiceSave')}
              </Button>
            </div>
          </div>
        </form>
      ) : null}
    </section>
  )
}
