'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { useLocale } from 'next-intl'
import { Button } from '@/app/components/ui/button'

type CrewMemberDraft = {
  name: string
  role: string
  email: string
}

type RegistrationDraft = {
  email: string
  boat_name: string
  border_number: string
  country: string
  certificate_of_navigation: string
  certificate_of_navigation_expiry: string
  model_design: string
  sail_number: string
  boat_age: string
  port_of_registry: string
  gph_irc: string
  loa: string
  boat_color: string
  yacht_club: string
  skipper_name: string
  skipper_yacht_club: string
  charterer_name: string
  certificate_of_competency: string
  certificate_of_competency_expiry: string
  contact_name: string
  contact_phone: string
  contact_email: string
  receive_documents_by_email: boolean
  crew_insurance: boolean
  third_party_insurance: boolean
  disclaimer_accepted: boolean
  gdpr_accepted: boolean
  crew_list: CrewMemberDraft[]
}

type Props = {
  eventId: string
  supportFiles: string[]
}

function normalizeSupportFiles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0
    )
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value]
  }

  return []
}

function syncSkipperIntoCrew(
  crewList: CrewMemberDraft[] | undefined,
  skipperName: string
): CrewMemberDraft[] {
  const normalizedCrew =
    crewList && crewList.length > 0
      ? crewList.map((member) => ({
          name: member.name ?? '',
          role: member.role ?? '',
          email: member.email ?? '',
        }))
      : [{ name: '', role: '', email: '' }]

  return normalizedCrew.map((member, index) =>
    index === 0 ? { ...member, name: skipperName } : member
  )
}

const defaultDraft = (): RegistrationDraft => ({
  email: '',
  boat_name: '',
  border_number: '',
  country: '',
  certificate_of_navigation: '',
  certificate_of_navigation_expiry: '',
  model_design: '',
  sail_number: '',
  boat_age: '',
  port_of_registry: '',
  gph_irc: '',
  loa: '',
  boat_color: '',
  yacht_club: '',
  skipper_name: '',
  skipper_yacht_club: '',
  charterer_name: '',
  certificate_of_competency: '',
  certificate_of_competency_expiry: '',
  contact_name: '',
  contact_phone: '',
  contact_email: '',
  receive_documents_by_email: true,
  crew_insurance: false,
  third_party_insurance: false,
  disclaimer_accepted: false,
  gdpr_accepted: false,
  crew_list: [{ name: '', role: '', email: '' }]
})

const content = {
  en: {
    introTitle: 'Event Registration',
    introText:
      'Complete the sections below to submit your entry. Your draft is saved automatically in this browser while you type.',
    supportTitle: 'Participation files',
    supportEmpty: 'No additional participation files have been uploaded for this event.',
    supportDescription:
      'Download any supporting files below before submitting your registration.',
    boatSection: 'Boat information',
    skipperSection: 'Skipper information',
    contactSection: 'Contact person',
    preferencesSection: 'Preferences and declarations',
    crewSection: 'Crew list',
    skipperCrewTitle: 'Skipper',
    crewMemberTitle: 'Crew member',
    labels: {
      email: 'Boat email',
      boat_name: 'Boat name',
      border_number: 'Border number',
      country: 'Country',
      certificate_of_navigation: 'Certificate of navigation',
      certificate_of_navigation_expiry: 'Navigation certificate expiry',
      model_design: 'Model / design',
      sail_number: 'Sail number',
      boat_age: 'Boat age / year',
      port_of_registry: 'Port of registry',
      gph_irc: 'GPH / IRC',
      loa: 'LOA (m)',
      boat_color: 'Boat color',
      yacht_club: 'Yacht club',
      skipper_name: 'Skipper name',
      skipper_yacht_club: 'Skipper yacht club',
      charterer_name: 'Charterer name',
      certificate_of_competency: 'Certificate of competency',
      certificate_of_competency_expiry: 'Competency certificate expiry',
      contact_name: 'Contact name',
      contact_phone: 'Contact phone',
      contact_email: 'Contact email',
      receive_documents_by_email: 'Send event documents to my email',
      crew_insurance:
        "The boat crew is insured - min. 1'000 euro per person",
      third_party_insurance:
        "Third party liability insurance is minimum 10'000 euro",
      disclaimer_accepted: 'I accept the event disclaimer',
      gdpr_accepted: 'I accept the GDPR / privacy terms',
      crew_name: 'Crew member name',
      crew_role: 'Role',
      crew_email: 'Crew member email',
    },
    placeholders: {
      country: 'Bulgaria',
      loa: '10.50',
      boat_age: '2018',
      gph_irc: 'IRC certificate reference',
    },
    addCrew: 'Add crew member',
    removeCrew: 'Remove',
    openCalendar: 'Open calendar',
    clearDraft: 'Clear saved draft',
    submit: 'Submit registration',
    submitting: 'Submitting...',
    savedNote: 'Draft saved locally on this device.',
    success:
      'Registration submitted successfully. Your local draft has been cleared.',
    error: 'We could not submit your registration. Please try again.',
    crewEmpty:
      'The first row is the skipper and is filled from the skipper information above. Add more rows only for the rest of the crew.',
  },
  bg: {
    introTitle: 'Регистрационна форма',
    introText:
      'Попълнете секциите по-долу, за да изпратите заявката си. Черновата се запазва автоматично в този браузър, докато пишете.',
    supportTitle: 'Файлове за участие',
    supportEmpty: 'Няма качени допълнителни файлове за участие за това събитие.',
    supportDescription:
      'Изтеглете нужните файлове по-долу преди да изпратите регистрацията.',
    boatSection: 'Информация за лодката',
    skipperSection: 'Информация за шкипера',
    contactSection: 'Лице за контакт',
    preferencesSection: 'Предпочитания и декларации',
    crewSection: 'Екипаж',
    skipperCrewTitle: 'Шкипер',
    crewMemberTitle: 'Член на екипажа',
    labels: {
      email: 'Имейл на лодката',
      boat_name: 'Име на лодката',
      border_number: 'Борден номер',
      country: 'Държава',
      certificate_of_navigation: 'Свидетелство за плаване',
      certificate_of_navigation_expiry: 'Валидност на свидетелството',
      model_design: 'Модел / дизайн',
      sail_number: 'Номер на платното',
      boat_age: 'Година / възраст на лодката',
      port_of_registry: 'Пристанище на регистрация',
      gph_irc: 'GPH / IRC',
      loa: 'LOA (м)',
      boat_color: 'Цвят на лодката',
      yacht_club: 'Яхт клуб',
      skipper_name: 'Име на шкипера',
      skipper_yacht_club: 'Яхт клуб на шкипера',
      charterer_name: 'Име на чартьора',
      certificate_of_competency: 'Свидетелство за правоспособност',
      certificate_of_competency_expiry: 'Валидност на правоспособността',
      contact_name: 'Име за контакт',
      contact_phone: 'Телефон за контакт',
      contact_email: 'Имейл за контакт',
      receive_documents_by_email: 'Да получавам документите по имейл',
      crew_insurance:
        "Имам застраховка на Екипажа за минимум 2'000 лв.",
      third_party_insurance:
        "Имам застраховка Отговорност към трети лица, минимум 20'000 лв.",
      disclaimer_accepted: 'Приемам декларацията на събитието',
      gdpr_accepted: 'Приемам GDPR / условията за поверителност',
      crew_name: 'Име на член от екипажа',
      crew_role: 'Роля',
      crew_email: 'Имейл на член от екипажа',
    },
    placeholders: {
      country: 'България',
      loa: '10.50',
      boat_age: '2018',
      gph_irc: 'Референция на IRC сертификат',
    },
    addCrew: 'Добави член на екипажа',
    removeCrew: 'Премахни',
    openCalendar: 'Отвори календар',
    clearDraft: 'Изчисти запазената чернова',
    submit: 'Изпрати регистрация',
    submitting: 'Изпращане...',
    savedNote: 'Черновата е запазена локално на това устройство.',
    success:
      'Регистрацията е изпратена успешно. Локалната чернова беше изчистена.',
    error: 'Неуспешно изпращане на регистрацията. Моля, опитайте отново.',
    crewEmpty:
      'Първият ред е за шкипера и се попълва автоматично от секцията за шкипер по-горе. Добавяйте следващи редове само за останалите членове на екипажа.',
  },
} as const

function getStorageKey(eventId: string) {
  return `event-registration-draft:${eventId}`
}

function fileLabel(url: string) {
  return decodeURIComponent(url.split('/').pop()?.split('?')[0] || url)
}

function DraftField({
  label,
  required = false,
  children
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-dark dark:text-white">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-white/10 dark:bg-black/30 dark:text-white'
}

function DateInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: string
  onChange: (value: string) => void
  ariaLabel: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  function openPicker() {
    const input = inputRef.current
    if (!input) {
      return
    }

    input.focus()
    if ('showPicker' in input && typeof input.showPicker === 'function') {
      input.showPicker()
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClassName()} pr-12 [color-scheme:light] dark:[color-scheme:dark]`}
      />
      <button
        type="button"
        onClick={openPicker}
        aria-label={ariaLabel}
        className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl border border-black/10 bg-white text-primary transition hover:bg-primary/5 dark:border-white/10 dark:bg-black/20"
      >
        <Icon icon="ph:calendar-blank-bold" width={18} height={18} />
      </button>
    </div>
  )
}

function SectionCard({
  title,
  children
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-black/20 sm:p-6">
      <h3 className="mb-5 text-2xl font-semibold text-dark dark:text-white">
        {title}
      </h3>
      {children}
    </section>
  )
}

export default function EventRegistrationForm({ eventId, supportFiles }: Props) {
  const locale = useLocale() === 'bg' ? 'bg' : 'en'
  const t = content[locale]
  const safeSupportFiles = useMemo(
    () => normalizeSupportFiles(supportFiles),
    [supportFiles]
  )
  const storageKey = useMemo(() => getStorageKey(eventId), [eventId])
  const [form, setForm] = useState<RegistrationDraft>(() => defaultDraft())
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const hydratedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const stored = window.localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Partial<RegistrationDraft>
        const skipperName = parsed.skipper_name ?? ''
        setForm({
          ...defaultDraft(),
          ...parsed,
          crew_list: syncSkipperIntoCrew(parsed.crew_list, skipperName),
        })
      } catch {
        window.localStorage.removeItem(storageKey)
      }
    }

    hydratedRef.current = true
  }, [storageKey])

  useEffect(() => {
    if (!hydratedRef.current || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, JSON.stringify(form))
  }, [form, storageKey])

  function updateField<K extends keyof RegistrationDraft>(
    field: K,
    value: RegistrationDraft[K]
  ) {
    setForm((current) => {
      if (field === 'skipper_name') {
        const crewList =
          current.crew_list.length > 0
            ? current.crew_list.map((member, index) =>
                index === 0
                  ? { ...member, name: String(value) }
                  : member
              )
            : [{ name: String(value), role: '', email: '' }]

        return {
          ...current,
          [field]: value,
          crew_list: crewList,
        }
      }

      return {
        ...current,
        [field]: value,
      }
    })
  }

  function updateCrewMember(
    index: number,
    field: keyof CrewMemberDraft,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      crew_list: current.crew_list.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      ),
    }))
  }

  function addCrewMember() {
    setForm((current) => ({
      ...current,
      crew_list: [...current.crew_list, { name: '', role: '', email: '' }],
    }))
  }

  function removeCrewMember(index: number) {
    if (index === 0) {
      return
    }

    setForm((current) => ({
      ...current,
      crew_list:
        current.crew_list.length === 1
          ? [{ name: '', role: '', email: '' }]
          : current.crew_list.filter((_, memberIndex) => memberIndex !== index),
    }))
  }

  function clearDraft() {
    const next = defaultDraft()
    setForm(next)
    setSubmitMessage(null)
    setSubmitError(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setSubmitMessage(null)
    setSubmitError(null)

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          event_id: eventId,
          ...form,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || t.error)
      }

      clearDraft()
      setSubmitMessage(t.success)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t.error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title={t.boatSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.email} required>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.boat_name} required>
              <input
                value={form.boat_name}
                onChange={(event) => updateField('boat_name', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.border_number}>
              <input
                value={form.border_number}
                onChange={(event) => updateField('border_number', event.target.value)}
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.country} required>
              <input
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder={t.placeholders.country}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_navigation}>
              <input
                value={form.certificate_of_navigation}
                onChange={(event) =>
                  updateField('certificate_of_navigation', event.target.value)
                }
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_navigation_expiry}>
              <DateInput
                value={form.certificate_of_navigation_expiry}
                onChange={(value) =>
                  updateField('certificate_of_navigation_expiry', value)
                }
                ariaLabel={t.openCalendar}
              />
            </DraftField>
            <DraftField label={t.labels.model_design} required>
              <input
                value={form.model_design}
                onChange={(event) => updateField('model_design', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.sail_number} required>
              <input
                value={form.sail_number}
                onChange={(event) => updateField('sail_number', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.boat_age} required>
              <input
                type="number"
                inputMode="numeric"
                value={form.boat_age}
                onChange={(event) => updateField('boat_age', event.target.value)}
                placeholder={t.placeholders.boat_age}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.port_of_registry}>
              <input
                value={form.port_of_registry}
                onChange={(event) =>
                  updateField('port_of_registry', event.target.value)
                }
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.gph_irc} required>
              <input
                value={form.gph_irc}
                onChange={(event) => updateField('gph_irc', event.target.value)}
                placeholder={t.placeholders.gph_irc}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.loa} required>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.loa}
                onChange={(event) => updateField('loa', event.target.value)}
                placeholder={t.placeholders.loa}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.boat_color}>
              <input
                value={form.boat_color}
                onChange={(event) => updateField('boat_color', event.target.value)}
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.yacht_club}>
              <input
                value={form.yacht_club}
                onChange={(event) => updateField('yacht_club', event.target.value)}
                className={inputClassName()}
              />
            </DraftField>
          </div>
        </SectionCard>

        <SectionCard title={t.skipperSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.skipper_name} required>
              <input
                value={form.skipper_name}
                onChange={(event) => updateField('skipper_name', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.skipper_yacht_club} required>
              <input
                value={form.skipper_yacht_club}
                onChange={(event) =>
                  updateField('skipper_yacht_club', event.target.value)
                }
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.charterer_name}>
              <input
                value={form.charterer_name}
                onChange={(event) => updateField('charterer_name', event.target.value)}
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_competency} required>
              <input
                value={form.certificate_of_competency}
                onChange={(event) =>
                  updateField('certificate_of_competency', event.target.value)
                }
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_competency_expiry}>
              <DateInput
                value={form.certificate_of_competency_expiry}
                onChange={(value) =>
                  updateField('certificate_of_competency_expiry', value)
                }
                ariaLabel={t.openCalendar}
              />
            </DraftField>
          </div>
        </SectionCard>

        <SectionCard title={t.contactSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.contact_name} required>
              <input
                value={form.contact_name}
                onChange={(event) => updateField('contact_name', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <DraftField label={t.labels.contact_phone} required>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(event) => updateField('contact_phone', event.target.value)}
                required
                className={inputClassName()}
              />
            </DraftField>
            <div className="md:col-span-2">
              <DraftField label={t.labels.contact_email} required>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(event) =>
                    updateField('contact_email', event.target.value)
                  }
                  required
                  className={inputClassName()}
                />
              </DraftField>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t.crewSection}>
          <p className="mb-4 text-sm leading-7 text-dark/65 dark:text-white/65">
            {t.crewEmpty}
          </p>

          <div className="space-y-4">
            {form.crew_list.map((member, index) => (
              <div
                key={`crew-${index}`}
                className="rounded-[1.5rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-dark/50 dark:text-white/50">
                    {index === 0
                      ? t.skipperCrewTitle
                      : `${t.crewMemberTitle} #${index}`}
                  </p>
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => removeCrewMember(index)}
                      className="text-sm font-semibold text-red-500 hover:underline"
                    >
                      {t.removeCrew}
                    </button>
                  ) : null}
                </div>

                <div
                  className={`grid gap-4 ${
                    index === 0 ? 'md:grid-cols-2' : 'md:grid-cols-3'
                  }`}
                >
                  <DraftField label={t.labels.crew_name}>
                    <input
                      value={member.name}
                      onChange={(event) =>
                        updateCrewMember(index, 'name', event.target.value)
                      }
                      readOnly={index === 0}
                      className={`${inputClassName()} ${
                        index === 0
                          ? 'cursor-not-allowed bg-black/[0.03] dark:bg-white/[0.03]'
                          : ''
                      }`}
                    />
                  </DraftField>
                  {index > 0 ? (
                    <DraftField label={t.labels.crew_role}>
                      <input
                        value={member.role}
                        onChange={(event) =>
                          updateCrewMember(index, 'role', event.target.value)
                        }
                        className={inputClassName()}
                      />
                    </DraftField>
                  ) : null}
                  <DraftField label={t.labels.crew_email}>
                    <input
                      type="email"
                      value={member.email}
                      onChange={(event) =>
                        updateCrewMember(index, 'email', event.target.value)
                      }
                      className={inputClassName()}
                    />
                  </DraftField>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Button
              type="button"
              variant="outline"
              onClick={addCrewMember}
              className="rounded-xl border-black/10 bg-white text-dark"
            >
              {t.addCrew}
            </Button>
          </div>
        </SectionCard>

        <SectionCard title={t.preferencesSection}>
          <div className="grid gap-4 md:grid-cols-2">
            {(
              [
                'gdpr_accepted',
                'disclaimer_accepted',
                'crew_insurance',
                'third_party_insurance',
                'receive_documents_by_email',
              ] as const
            ).map((field) => (
              <label
                key={field}
                className="flex items-start gap-3 rounded-2xl border border-black/10 bg-white/70 px-4 py-4 text-sm text-dark dark:border-white/10 dark:bg-black/20 dark:text-white"
              >
                <input
                  type="checkbox"
                  checked={form[field]}
                  onChange={(event) => updateField(field, event.target.checked)}
                  required={field === 'disclaimer_accepted' || field === 'gdpr_accepted'}
                  className="mt-1 h-4 w-4 rounded border-black/20 text-primary focus:ring-primary"
                />
                <span>{t.labels[field]}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={submitting} className="rounded-xl px-6 text-white">
            {submitting ? t.submitting : t.submit}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={clearDraft}
            className="rounded-xl border-black/10 bg-white text-dark"
          >
            {t.clearDraft}
          </Button>
        </div>

        {submitMessage ? (
          <p className="text-sm font-medium text-emerald-700">{submitMessage}</p>
        ) : null}

        {submitError ? (
          <p className="text-sm font-medium text-red-600">{submitError}</p>
        ) : null}
      </form>
    </div>
  )
}
