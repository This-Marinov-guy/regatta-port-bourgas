'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { format } from 'date-fns'
import { bg, enUS } from 'date-fns/locale'
import DatePicker from 'react-datepicker'
import toast, { Toaster } from 'react-hot-toast'
import { useLocale } from 'next-intl'
import { Button } from '@/app/components/ui/button'
import EventSubmissionStatusModal from '@/app/components/events/EventSubmissionStatusModal'

type CrewMemberDraft = {
  name: string
  date_of_birth: string
}

type RegistrationDraft = {
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
  insurance_documents: string[]
  disclaimer_accepted: boolean
  gdpr_accepted: boolean
  crew_list: CrewMemberDraft[]
}

type Props = {
  eventId: string
  onCancel?: () => void
  onSuccess?: () => void
}

type LegalModalKey = 'disclaimer' | 'gdpr'
type SubmissionState = 'idle' | 'loading' | 'success' | 'error'
type RegistrationSubmitResponse = {
  data?: {
    id: string
  }
  error?: string
}

const MAX_INSURANCE_FILE_SIZE = 10 * 1024 * 1024
const MAX_IMAGE_DIMENSION = 2400
const IMAGE_COMPRESSION_QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5, 0.4]

function syncSkipperIntoCrew(
  crewList: CrewMemberDraft[] | undefined,
  skipperName: string
): CrewMemberDraft[] {
  const normalizedCrew =
    crewList && crewList.length > 0
      ? crewList.map((member) => ({
          name: member.name ?? '',
          date_of_birth: member.date_of_birth ?? '',
        }))
      : [{ name: '', date_of_birth: '' }]

  return normalizedCrew.map((member, index) =>
    index === 0 ? { ...member, name: skipperName } : member
  )
}

const defaultDraft = (): RegistrationDraft => ({
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
  insurance_documents: [],
  disclaimer_accepted: false,
  gdpr_accepted: false,
  crew_list: [{ name: '', date_of_birth: '' }]
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
      crew_insurance:
        "The boat crew is insured - min. 1'000 euro per person",
      third_party_insurance:
        "Third party liability insurance is minimum 10'000 euro",
      insurance_documents: 'Insurance documents',
      disclaimer_accepted: 'I accept the event disclaimer',
      gdpr_accepted: 'I accept the GDPR / privacy terms',
      crew_name: 'Crew member name',
      crew_date_of_birth: 'Date of birth',
    },
    placeholders: {
      country: 'Bulgaria',
      loa: '10.50',
      boat_age: '2018',
      gph_irc: 'IRC certificate reference',
    },
    addCrew: 'Add crew member',
    removeCrew: 'Remove',
    removeFile: 'Remove',
    datePlaceholder: 'Select a date',
    cancel: 'Cancel',
    submit: 'Submit registration',
    submitting: 'Submitting...',
    fixForm: 'Please fix the highlighted fields before submitting.',
    insuranceRequired: 'The crew must have minimum insurance',
    insuranceBanner:
      'Please provide the insurance policies at the regatta email',
    insuranceDocumentsHelp:
      'Upload one or more insurance files. Maximum 10 MB per file. Large images are compressed automatically before upload.',
    addInsuranceDocuments: 'Add insurance documents',
    insuranceDocumentsDropzone:
      'Drag and drop insurance files here, or click to browse.',
    insuranceDocumentsRequired: 'Please upload the insurance documents.',
    uploadingInsuranceDocuments: 'Uploading insurance documents...',
    insuranceDocumentTooLarge:
      'This file is too large. Please keep each document under 10 MB.',
    insuranceDocumentCompressionFailed:
      'We could not compress this image enough. Please upload a smaller file under 10 MB.',
    success:
      'Registration submitted successfully. Your local draft has been cleared.',
    error: 'We could not submit your registration. Please try again.',
    submissionStatus: {
      loadingTitle: 'Submitting registration',
      loadingBody: 'Please wait while we send your registration.',
      successTitle: 'Registration sent',
      errorTitle: 'Submission failed',
      close: 'Close',
      paymentAction: 'Make payment',
      paymentLoading: 'Opening checkout...',
      paymentError: 'We could not start the payment. Please try again.',
    },
    crewEmpty:
      'The first row is the skipper and is filled from the skipper information above. Add more rows only for the rest of the crew.',
    legal: {
      disclaimerLink: 'Read disclaimer',
      gdprLink: 'Read GDPR notice',
      disclaimerTitle: 'Event disclaimer',
      gdprTitle: 'GDPR notice',
      close: 'Close',
      disclaimerBody:
        'By electronically agreeing this document, all competitors agree to be bound by The Racing Rules of Sailing and by all other rules that govern this event. Also they declare that they are sailing at own risk and responsibility. The organizing authority and any other person or entity involved in the organization of the event will not accept any liability for any loss, damage, injury or death which may occur to person or property, both ashore and afloat, as a consequence of participation in the event.',
      gdprBody:
        'By electronically agreeing this document, I assume responsibility for the accuracy of the data provided and understand that it will be used to fulfill the obligations imposed by law. Data will be protected in accordance with the provisions of Regulation (EU) No. 679/2016 of the European Parliament and of the Council of the European Union on the protection of individuals with regard to the processing of personal data and on the free movement of such data. As a result, I agree with the processing of this information.',
    },
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
      crew_insurance:
        "Имам застраховка на Екипажа за минимум 2'000 лв.",
      third_party_insurance:
        "Имам застраховка Отговорност към трети лица, минимум 20'000 лв.",
      insurance_documents: 'Застрахователни документи',
      disclaimer_accepted: 'Приемам декларацията на събитието',
      gdpr_accepted: 'Приемам GDPR / условията за поверителност',
      crew_name: 'Име на член от екипажа',
      crew_date_of_birth: 'Дата на раждане',
    },
    placeholders: {
      country: 'България',
      loa: '10.50',
      boat_age: '2018',
      gph_irc: 'Референция на IRC сертификат',
    },
    addCrew: 'Добави член на екипажа',
    removeCrew: 'Премахни',
    removeFile: 'Премахни',
    datePlaceholder: 'Изберете дата',
    cancel: 'Отказ',
    submit: 'Изпрати регистрация',
    submitting: 'Изпращане...',
    fixForm: 'Моля, коригирайте маркираните полета преди изпращане.',
    insuranceRequired: 'The crew must have minimum insurance',
    insuranceBanner:
      'Моля изпратете застраховките и екипажния списък на емейла на регатата',
    insuranceDocumentsHelp:
      'Качете един или повече файла със застраховки. Максимум 10 MB на файл. Големите изображения се компресират автоматично преди качване.',
    addInsuranceDocuments: 'Добави застрахователни документи',
    insuranceDocumentsDropzone:
      'Пуснете застрахователните файлове тук или натиснете, за да изберете.',
    insuranceDocumentsRequired: 'Моля, качете застрахователните документи.',
    uploadingInsuranceDocuments: 'Качване на застрахователни документи...',
    insuranceDocumentTooLarge:
      'Файлът е твърде голям. Моля, всеки документ да бъде под 10 MB.',
    insuranceDocumentCompressionFailed:
      'Не успяхме да компресираме това изображение достатъчно. Моля, качете по-малък файл под 10 MB.',
    success:
      'Регистрацията е изпратена успешно. Локалната чернова беше изчистена.',
    error: 'Неуспешно изпращане на регистрацията. Моля, опитайте отново.',
    submissionStatus: {
      loadingTitle: 'Изпращане на регистрацията',
      loadingBody: 'Моля, изчакайте, докато изпратим регистрацията ви.',
      successTitle: 'Регистрацията е изпратена',
      errorTitle: 'Грешка при изпращане',
      close: 'Затвори',
      paymentAction: 'Плати сега',
      paymentLoading: 'Отваряне на плащането...',
      paymentError: 'Не успяхме да стартираме плащането. Моля, опитайте отново.',
    },
    crewEmpty:
      'Първият ред е за шкипера и се попълва автоматично от секцията за шкипер по-горе. Добавяйте следващи редове само за останалите членове на екипажа.',
    legal: {
      disclaimerLink: 'Прочети декларацията',
      gdprLink: 'Прочети GDPR информацията',
      disclaimerTitle: 'Декларация за участие',
      gdprTitle: 'GDPR информация',
      close: 'Затвори',
      disclaimerBody:
        'С подписването на този електронен документ, всички състезатели приемат и се съгласяват с условията му и ще бъдат обвързани със Състезателните правила по ветроходство и с всички други правила и документи, които управляват това събитие. Освен това същите заявяват, че ще се състезават на собствен риск и отговорност. Организаторът и всяко друго физическо или юридическо лице, участващи в организацията на събитието, няма да поеме никаква отговорност за загуби и/или щети на имущество или при нараняване или смърт на лице, както на сушата, така и във водата, както и в резултат от участието в събитието.',
      gdprBody:
        'С подписването на този електронен документ, аз се съгласявам да поема цялата отговорност за достоверността на предоставените от мен данни и разбирам, че той ще бъде използван за изпълнение на задълженията, наложени от закона. Данните ще бъдат защитени в съответствие с разпоредбите на Регламент (ЕС) 2016/679 на Европейския парламент и на Съвета, относно защитата на лицата по отношение на обработката на лични данни и за свободното движение на такива данни. В резултат на това съм съгласен с обработката на предоставената от мен информация.',
    },
  },
} as const

function getStorageKey(eventId: string) {
  return `event-registration-draft:${eventId}`
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
      <span className="mb-2 block  font-medium text-dark dark:text-white">
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}

function inputClassName(invalid = false) {
  return `w-full rounded-2xl border bg-white px-4 py-3  text-dark outline-none transition focus:border-primary dark:bg-black/30 dark:text-white ${
    invalid
      ? 'border-red-500 focus:border-red-500 dark:border-red-500'
      : 'border-black/10 dark:border-white/10'
  }`
}

function parseDateValue(value: string) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatDateValue(value: Date | null) {
  if (!value) {
    return ''
  }

  return format(value, 'yyyy-MM-dd')
}

function DateInput({
  name,
  locale,
  value,
  onChange,
  placeholder,
  invalid = false,
  required = false,
}: {
  name: string
  locale: 'en' | 'bg'
  value: string
  onChange: (value: string) => void
  placeholder: string
  invalid?: boolean
  required?: boolean
}) {
  return (
    <div className="relative">
      <DatePicker
        name={name}
        required={required}
        selected={parseDateValue(value)}
        onChange={(date) => onChange(formatDateValue(date))}
        shouldCloseOnSelect
        portalId="event-registration-datepicker-portal"
        dateFormat="dd.MM.yyyy"
        placeholderText={placeholder}
        locale={locale === 'bg' ? bg : enUS}
        className={`${inputClassName(invalid)} pr-12`}
        calendarClassName="event-registration-datepicker"
        popperClassName="event-registration-datepicker-popper"
        popperProps={{ strategy: 'fixed' }}
        wrapperClassName="w-full"
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        isClearable
      />
      <span className="pointer-events-none absolute right-4 top-1/2 inline-flex -translate-y-1/2 items-center justify-center text-primary">
        <Icon icon="ph:calendar-blank-bold" width={18} height={18} />
      </span>
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

function LegalInfoModal({
  title,
  body,
  closeLabel,
  onClose,
}: {
  title: string
  body: string
  closeLabel: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-[140] bg-black/55 px-4 py-6 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative mx-auto flex min-h-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-[1.75rem] border border-black/10 bg-[#f8f6ef] p-6 shadow-2xl dark:border-white/10 dark:bg-[#11110f] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-dark dark:text-white">
                {title}
              </h3>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl border-black/10 bg-white text-dark dark:border-white/10 dark:bg-black/20 dark:text-white"
            >
              {closeLabel}
            </Button>
          </div>
          <div className="mt-5 max-h-[70vh] overflow-y-auto rounded-[1.25rem] border border-black/10 bg-white/80 p-5  leading-7 whitespace-pre-line text-dark/80 dark:border-white/10 dark:bg-black/20 dark:text-white/80">
            {body}
          </div>
        </div>
      </div>
    </div>
  )
}

function scrollToElement(element: HTMLElement | null) {
  if (!element) {
    return
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  })

  window.setTimeout(() => {
    element.focus({ preventScroll: true })
  }, 180)
}

function isCompressibleImage(file: File) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
}

function renameWithJpegExtension(name: string) {
  const baseName = name.replace(/\.[^/.]+$/, '')
  return `${baseName || 'insurance-document'}.jpg`
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read the selected image.'))
    }

    image.src = objectUrl
  })
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

async function compressInsuranceImage(file: File) {
  const image = await loadImage(file)
  const scale = Math.min(
    1,
    MAX_IMAGE_DIMENSION / Math.max(image.width, image.height)
  )
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Unable to prepare the image for upload.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  for (const quality of IMAGE_COMPRESSION_QUALITY_STEPS) {
    const blob = await canvasToBlob(canvas, quality)

    if (!blob) {
      continue
    }

    if (blob.size <= MAX_INSURANCE_FILE_SIZE) {
      return new File([blob], renameWithJpegExtension(file.name), {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
    }
  }

  return null
}

async function prepareInsuranceDocument(file: File, t: (typeof content)['en']) {
  if (file.size <= MAX_INSURANCE_FILE_SIZE) {
    return file
  }

  if (!isCompressibleImage(file)) {
    throw new Error(t.insuranceDocumentTooLarge)
  }

  const compressed = await compressInsuranceImage(file)

  if (!compressed) {
    throw new Error(t.insuranceDocumentCompressionFailed)
  }

  return compressed
}

async function uploadInsuranceDocument(file: File, eventId: string) {
  const formData = new FormData()
  formData.set('event_id', eventId)
  formData.set('file', file)

  const response = await fetch('/api/registrations/upload-insurance', {
    method: 'POST',
    body: formData,
  })

  const payload = (await response.json().catch(() => null)) as
    | { data?: { url?: string }; error?: string }
    | null

  if (!response.ok || !payload?.data?.url) {
    throw new Error(payload?.error || 'Unable to upload the insurance document.')
  }

  return payload.data.url
}

export default function EventRegistrationForm({
  eventId,
  onCancel,
  onSuccess,
}: Props) {
  const locale = useLocale() === 'bg' ? 'bg' : 'en'
  const t = content[locale]
  const storageKey = useMemo(() => getStorageKey(eventId), [eventId])
  const [form, setForm] = useState<RegistrationDraft>(() => defaultDraft())
  const [submitting, setSubmitting] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [insuranceUploading, setInsuranceUploading] = useState(false)
  const [insuranceDragging, setInsuranceDragging] = useState(false)
  const [invalidFields, setInvalidFields] = useState<string[]>([])
  const [submissionState, setSubmissionState] = useState<SubmissionState>('idle')
  const [submissionMessage, setSubmissionMessage] = useState<string>('')
  const [createdRegistrationId, setCreatedRegistrationId] = useState<string | null>(null)
  const [activeLegalModal, setActiveLegalModal] = useState<LegalModalKey | null>(null)
  const insuranceInputRef = useRef<HTMLInputElement>(null)
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
    setInvalidFields((current) => {
      if (field === 'crew_insurance' || field === 'third_party_insurance') {
        const nextCrewInsurance =
          field === 'crew_insurance' ? Boolean(value) : form.crew_insurance
        const nextThirdPartyInsurance =
          field === 'third_party_insurance'
            ? Boolean(value)
            : form.third_party_insurance

        if (nextCrewInsurance || nextThirdPartyInsurance) {
          return current.filter(
            (item) =>
              item !== 'crew_insurance' && item !== 'third_party_insurance'
          )
        }
      }

      return current.filter((item) => item !== field)
    })
    setForm((current) => {
      if (field === 'skipper_name') {
        const crewList =
          current.crew_list.length > 0
            ? current.crew_list.map((member, index) =>
                index === 0
                  ? { ...member, name: String(value) }
                  : member
              )
            : [{ name: String(value), date_of_birth: '' }]

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
    const fieldKey = `crew_list.${index}.${field}`
    setInvalidFields((current) => current.filter((item) => item !== fieldKey))
    setForm((current) => ({
      ...current,
      crew_list: current.crew_list.map((member, memberIndex) =>
        memberIndex === index ? { ...member, [field]: value } : member
      ),
    }))
  }

  function addCrewMember() {
    setInvalidFields((current) =>
      current.filter((item) => !item.startsWith('crew_list.'))
    )
    setForm((current) => ({
      ...current,
      crew_list: [...current.crew_list, { name: '', date_of_birth: '' }],
    }))
  }

  function removeCrewMember(index: number) {
    if (index === 0) {
      return
    }

    setInvalidFields((current) =>
      current.filter((item) => !item.startsWith(`crew_list.${index}.`))
    )
    setForm((current) => ({
      ...current,
      crew_list:
        current.crew_list.length === 1
          ? [{ name: '', date_of_birth: '' }]
          : current.crew_list.filter((_, memberIndex) => memberIndex !== index),
    }))
  }

  function clearDraft() {
    const next = defaultDraft()
    setForm(next)
    setInvalidFields([])
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }

  async function handleInsuranceFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    setInsuranceUploading(true)

    try {
      const uploadedUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          const preparedFile = await prepareInsuranceDocument(file, t)
          return uploadInsuranceDocument(preparedFile, eventId)
        })
      )

      setInvalidFields((current) =>
        current.filter((item) => item !== 'insurance_documents')
      )
      setForm((current) => ({
        ...current,
        insurance_documents: [
          ...current.insurance_documents,
          ...uploadedUrls.filter((url) => !current.insurance_documents.includes(url)),
        ],
      }))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.error)
    } finally {
      setInsuranceUploading(false)
    }
  }

  function removeInsuranceDocument(index: number) {
    setForm((current) => ({
      ...current,
      insurance_documents: current.insurance_documents.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function closeSubmissionModal() {
    const shouldCloseRegistration = submissionState === 'success'
    setSubmissionState('idle')
    setSubmissionMessage('')
    setCreatedRegistrationId(null)
    setPaymentLoading(false)

    if (shouldCloseRegistration) {
      onSuccess?.()
    }
  }

  async function handlePaymentCheckout() {
    if (!createdRegistrationId) {
      return
    }

    setPaymentLoading(true)

    try {
      const response = await fetch(
        `/api/registrations/${createdRegistrationId}/checkout`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({ locale }),
        }
      )

      const payload = (await response.json().catch(() => null)) as
        | { data?: { checkoutUrl?: string }; error?: string }
        | null

      if (!response.ok || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error || t.submissionStatus.paymentError)
      }

      window.location.assign(payload.data.checkoutUrl)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.submissionStatus.paymentError
      )
      setPaymentLoading(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmissionState('idle')
    setSubmissionMessage('')
    setCreatedRegistrationId(null)
    setPaymentLoading(false)
    const formElement = event.currentTarget
    const hasMinimumInsurance =
      form.crew_insurance || form.third_party_insurance
    const nativeInvalidFields = Array.from(
      formElement.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        ':invalid'
      )
    )
    const nextInvalidFields = nativeInvalidFields
      .map((field) => field.name || field.id)
      .filter(Boolean)

    if (!hasMinimumInsurance) {
      nextInvalidFields.push('crew_insurance', 'third_party_insurance')
    }

    if (form.insurance_documents.length === 0) {
      nextInvalidFields.push('insurance_documents')
    }

    if (nextInvalidFields.length > 0 || !formElement.checkValidity() || !hasMinimumInsurance) {
      setInvalidFields(Array.from(new Set(nextInvalidFields)))
      toast.error(
        !hasMinimumInsurance
          ? t.insuranceRequired
          : form.insurance_documents.length === 0
            ? t.insuranceDocumentsRequired
            : t.fixForm
      )
      scrollToElement(
        !hasMinimumInsurance
          ? document.getElementById('crew_insurance')
          : form.insurance_documents.length === 0
            ? document.getElementById('insurance_documents')
            : (nativeInvalidFields[0] ?? null)
      )
      return
    }

    setSubmitting(true)
    setInvalidFields([])
    setSubmissionState('loading')
    setSubmissionMessage(t.submissionStatus.loadingBody)

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
        | RegistrationSubmitResponse
        | null

      if (!response.ok) {
        throw new Error(payload?.error || t.error)
      }

      clearDraft()
      setCreatedRegistrationId(payload?.data?.id ?? null)
      setSubmissionState('success')
      setSubmissionMessage(t.success)
    } catch (error) {
      const message = error instanceof Error ? error.message : t.error
      setSubmissionState('error')
      setSubmissionMessage(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">

      {activeLegalModal ? (
        <LegalInfoModal
          title={
            activeLegalModal === 'disclaimer'
              ? t.legal.disclaimerTitle
              : t.legal.gdprTitle
          }
          body={
            activeLegalModal === 'disclaimer'
              ? t.legal.disclaimerBody
              : t.legal.gdprBody
          }
          closeLabel={t.legal.close}
          onClose={() => setActiveLegalModal(null)}
        />
      ) : null}

      {submissionState !== 'idle' ? (
        <EventSubmissionStatusModal
          status={submissionState}
          title={
            submissionState === 'loading'
              ? t.submissionStatus.loadingTitle
              : submissionState === 'success'
                ? t.submissionStatus.successTitle
                : t.submissionStatus.errorTitle
          }
          message={submissionMessage}
          closeLabel={t.submissionStatus.close}
          onClose={closeSubmissionModal}
          actionLabel={
            submissionState === 'success'
              ? paymentLoading
                ? t.submissionStatus.paymentLoading
                : t.submissionStatus.paymentAction
              : undefined
          }
          onAction={
            submissionState === 'success' && createdRegistrationId
              ? handlePaymentCheckout
              : undefined
          }
          actionDisabled={paymentLoading}
        />
      ) : null}

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        <SectionCard title={t.boatSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.boat_name} required>
              <input
                name="boat_name"
                value={form.boat_name}
                onChange={(event) => updateField('boat_name', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('boat_name'))}
              />
            </DraftField>
            <DraftField label={t.labels.border_number}>
              <input
                name="border_number"
                type="number"
                inputMode="numeric"
                step="1"
                value={form.border_number}
                onChange={(event) => updateField('border_number', event.target.value)}
                className={inputClassName(invalidFields.includes('border_number'))}
              />
            </DraftField>
            <DraftField label={t.labels.country} required>
              <input
                name="country"
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
                placeholder={t.placeholders.country}
                required
                className={inputClassName(invalidFields.includes('country'))}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_navigation}>
              <input
                name="certificate_of_navigation"
                type="number"
                inputMode="numeric"
                step="1"
                value={form.certificate_of_navigation}
                onChange={(event) =>
                  updateField('certificate_of_navigation', event.target.value)
                }
                className={inputClassName(
                  invalidFields.includes('certificate_of_navigation')
                )}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_navigation_expiry}>
              <DateInput
                name="certificate_of_navigation_expiry"
                locale={locale}
                value={form.certificate_of_navigation_expiry}
                onChange={(value) =>
                  updateField('certificate_of_navigation_expiry', value)
                }
                placeholder={t.datePlaceholder}
                invalid={invalidFields.includes(
                  'certificate_of_navigation_expiry'
                )}
              />
            </DraftField>
            <DraftField label={t.labels.model_design} required>
              <input
                name="model_design"
                value={form.model_design}
                onChange={(event) => updateField('model_design', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('model_design'))}
              />
            </DraftField>
            <DraftField label={t.labels.sail_number} required>
              <input
                name="sail_number"
                value={form.sail_number}
                onChange={(event) => updateField('sail_number', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('sail_number'))}
              />
            </DraftField>
            <DraftField label={t.labels.boat_age} required>
              <input
                name="boat_age"
                type="number"
                inputMode="numeric"
                value={form.boat_age}
                onChange={(event) => updateField('boat_age', event.target.value)}
                placeholder={t.placeholders.boat_age}
                required
                className={inputClassName(invalidFields.includes('boat_age'))}
              />
            </DraftField>
            <DraftField label={t.labels.port_of_registry}>
              <input
                name="port_of_registry"
                value={form.port_of_registry}
                onChange={(event) =>
                  updateField('port_of_registry', event.target.value)
                }
                className={inputClassName(
                  invalidFields.includes('port_of_registry')
                )}
              />
            </DraftField>
            <DraftField label={t.labels.gph_irc} required>
              <input
                name="gph_irc"
                value={form.gph_irc}
                onChange={(event) => updateField('gph_irc', event.target.value)}
                placeholder={t.placeholders.gph_irc}
                required
                className={inputClassName(invalidFields.includes('gph_irc'))}
              />
            </DraftField>
            <DraftField label={t.labels.loa} required>
              <input
                name="loa"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={form.loa}
                onChange={(event) => updateField('loa', event.target.value)}
                placeholder={t.placeholders.loa}
                required
                className={inputClassName(invalidFields.includes('loa'))}
              />
            </DraftField>
            <DraftField label={t.labels.boat_color}>
              <input
                name="boat_color"
                value={form.boat_color}
                onChange={(event) => updateField('boat_color', event.target.value)}
                className={inputClassName(invalidFields.includes('boat_color'))}
              />
            </DraftField>
            <DraftField label={t.labels.yacht_club}>
              <input
                name="yacht_club"
                value={form.yacht_club}
                onChange={(event) => updateField('yacht_club', event.target.value)}
                className={inputClassName(invalidFields.includes('yacht_club'))}
              />
            </DraftField>
          </div>
        </SectionCard>

        <SectionCard title={t.skipperSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.skipper_name} required>
              <input
                name="skipper_name"
                value={form.skipper_name}
                onChange={(event) => updateField('skipper_name', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('skipper_name'))}
              />
            </DraftField>
            <DraftField label={t.labels.skipper_yacht_club} required>
              <input
                name="skipper_yacht_club"
                value={form.skipper_yacht_club}
                onChange={(event) =>
                  updateField('skipper_yacht_club', event.target.value)
                }
                required
                className={inputClassName(
                  invalidFields.includes('skipper_yacht_club')
                )}
              />
            </DraftField>
            <DraftField label={t.labels.charterer_name}>
              <input
                name="charterer_name"
                value={form.charterer_name}
                onChange={(event) => updateField('charterer_name', event.target.value)}
                className={inputClassName(invalidFields.includes('charterer_name'))}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_competency} required>
              <input
                name="certificate_of_competency"
                value={form.certificate_of_competency}
                onChange={(event) =>
                  updateField('certificate_of_competency', event.target.value)
                }
                required
                className={inputClassName(
                  invalidFields.includes('certificate_of_competency')
                )}
              />
            </DraftField>
            <DraftField label={t.labels.certificate_of_competency_expiry}>
              <DateInput
                name="certificate_of_competency_expiry"
                locale={locale}
                value={form.certificate_of_competency_expiry}
                onChange={(value) =>
                  updateField('certificate_of_competency_expiry', value)
                }
                placeholder={t.datePlaceholder}
                invalid={invalidFields.includes(
                  'certificate_of_competency_expiry'
                )}
              />
            </DraftField>
          </div>
        </SectionCard>

        <SectionCard title={t.contactSection}>
          <div className="grid gap-4 md:grid-cols-2">
            <DraftField label={t.labels.contact_name} required>
              <input
                name="contact_name"
                value={form.contact_name}
                onChange={(event) => updateField('contact_name', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('contact_name'))}
              />
            </DraftField>
            <DraftField label={t.labels.contact_phone} required>
              <input
                name="contact_phone"
                type="tel"
                value={form.contact_phone}
                onChange={(event) => updateField('contact_phone', event.target.value)}
                required
                className={inputClassName(invalidFields.includes('contact_phone'))}
              />
            </DraftField>
            <div className="md:col-span-2">
              <DraftField label={t.labels.contact_email} required>
                <input
                  name="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(event) =>
                    updateField('contact_email', event.target.value)
                  }
                  required
                  className={inputClassName(
                    invalidFields.includes('contact_email')
                  )}
                />
              </DraftField>
            </div>
          </div>
        </SectionCard>

        <SectionCard title={t.crewSection}>
          <p className="mb-4  leading-7 text-dark/65 dark:text-white/65">
            {t.crewEmpty}
          </p>

          <div className="space-y-4">
            {form.crew_list.map((member, index) => (
              <div
                key={`crew-${index}`}
                className="rounded-[1.5rem] border border-black/10 bg-white/70 p-4 dark:border-white/10 dark:bg-black/20"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className=" font-semibold uppercase tracking-[0.18em] text-dark/50 dark:text-white/50">
                    {index === 0
                      ? t.skipperCrewTitle
                      : `${t.crewMemberTitle} #${index}`}
                  </p>
                  {index > 0 ? (
                    <button
                      type="button"
                      onClick={() => removeCrewMember(index)}
                      className=" font-semibold text-red-500 hover:underline"
                    >
                      {t.removeCrew}
                    </button>
                  ) : null}
                </div>

                <div
                  className={`grid gap-4 ${
                    index === 0 ? 'md:grid-cols-2' : 'md:grid-cols-2'
                  }`}
                >
                  <DraftField label={t.labels.crew_name} required>
                    <input
                      name={`crew_list.${index}.name`}
                      value={member.name}
                      onChange={(event) =>
                        updateCrewMember(index, 'name', event.target.value)
                      }
                      required
                      readOnly={index === 0}
                      className={`${inputClassName(
                        invalidFields.includes(`crew_list.${index}.name`)
                      )} ${
                        index === 0
                          ? 'cursor-not-allowed bg-black/[0.03] dark:bg-white/[0.03]'
                          : ''
                      }`}
                    />
                  </DraftField>
                  <DraftField label={t.labels.crew_date_of_birth} required>
                    <DateInput
                      name={`crew_list.${index}.date_of_birth`}
                      locale={locale}
                      value={member.date_of_birth}
                      onChange={(value) =>
                        updateCrewMember(index, 'date_of_birth', value)
                      }
                      placeholder={t.datePlaceholder}
                      required
                      invalid={invalidFields.includes(
                        `crew_list.${index}.date_of_birth`
                      )}
                    />
                  </DraftField>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              onClick={addCrewMember}
              className="rounded-xl bg-primary px-6 text-white hover:bg-primary/90"
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
              ] as const
            ).map((field) => (
              <div
                key={field}
                className={`flex items-start gap-3 rounded-2xl border bg-white/70 px-4 py-4  text-dark dark:bg-black/20 dark:text-white ${
                  invalidFields.includes(field)
                    ? 'border-red-500 dark:border-red-500'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                <input
                  type="checkbox"
                  id={field}
                  checked={form[field]}
                  onChange={(event) => updateField(field, event.target.checked)}
                  required={field === 'disclaimer_accepted' || field === 'gdpr_accepted'}
                  className="mt-1 h-4 w-4 rounded border-black/20 text-primary focus:ring-primary"
                />
                <div>
                  <label htmlFor={field} className="cursor-pointer">
                    {t.labels[field]}
                  </label>
                  {field === 'disclaimer_accepted' ? (
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('disclaimer')}
                      className="mt-2 block  font-semibold text-primary hover:underline"
                    >
                      {t.legal.disclaimerLink}
                    </button>
                  ) : null}
                  {field === 'gdpr_accepted' ? (
                    <button
                      type="button"
                      onClick={() => setActiveLegalModal('gdpr')}
                      className="mt-2 block  font-semibold text-primary hover:underline"
                    >
                      {t.legal.gdprLink}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>


          <div
            id="insurance_documents"
            className={`mt-4 rounded-2xl border bg-white/70 p-4 dark:bg-black/20 ${
              invalidFields.includes('insurance_documents')
                ? 'border-red-500 dark:border-red-500'
                : 'border-black/10 dark:border-white/10'
            }`}
          >
            <DraftField label={t.labels.insurance_documents} required>
              <div className="space-y-4">
                <p className=" leading-7 text-dark/65 dark:text-white/65">
                  {t.insuranceDocumentsHelp}
                </p>

                <input
                  ref={insuranceInputRef}
                  id="insurance_documents_input"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    void handleInsuranceFiles(event.target.files)
                    event.currentTarget.value = ''
                  }}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (!insuranceUploading) {
                      insuranceInputRef.current?.click()
                    }
                  }}
                  onDragOver={(event) => {
                    event.preventDefault()
                    if (!insuranceUploading) {
                      setInsuranceDragging(true)
                    }
                  }}
                  onDragLeave={() => setInsuranceDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setInsuranceDragging(false)
                    if (!insuranceUploading) {
                      void handleInsuranceFiles(event.dataTransfer.files)
                    }
                  }}
                  disabled={insuranceUploading}
                  className={`w-full rounded-[1.5rem] border-2 border-dashed px-6 py-8 text-left transition-all ${
                    insuranceDragging
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-black/10 bg-white/90 dark:border-white/10 dark:bg-black/20'
                  } ${insuranceUploading ? 'cursor-progress' : 'cursor-pointer hover:border-primary/50'}`}
                >
                  <div className="flex w-full items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon icon="ph:upload-simple-bold" width={22} height={22} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-dark dark:text-white">
                        {insuranceUploading
                          ? t.uploadingInsuranceDocuments
                          : t.addInsuranceDocuments}
                      </p>
                      <p className="mt-1 leading-7 text-dark/60 dark:text-white/65">
                        {t.insuranceDocumentsDropzone}
                      </p>
                    </div>
                  </div>
                </button>

                {form.insurance_documents.length > 0 ? (
                  <div className="space-y-3">
                    {form.insurance_documents.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-white px-4 py-3  dark:border-white/10 dark:bg-black/20"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 truncate font-medium text-primary hover:underline"
                        >
                          {url.split('/').pop() || url}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeInsuranceDocument(index)}
                          className="shrink-0  font-semibold text-red-500 hover:underline"
                        >
                          {t.removeFile}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </DraftField>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button type="submit" disabled={submitting} className="rounded-xl px-6 text-white">
            {submitting ? t.submitting : t.submit}
          </Button>
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="rounded-xl border-black/10 bg-white text-dark"
            >
              {t.cancel}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
