export type EventStatus = 1 | 2 | 3

export type AdminEventRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  description_en: string | null
  description_bg: string | null
  thumbnail_img: string | null
  status: EventStatus
  start_date: string
  end_date: string
  documents: string[]
  notice_board: string[]
  results: string[]
  register_form: string[]
  created_at: string
  updated_at: string
}

export type AdminNewsRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  description_en: string | null
  description_bg: string | null
  body_en: string
  body_bg: string | null
  attachments: string[]
  created_at: string
  updated_at: string
}

export type AdminDocumentRecord = {
  id: string
  name_en: string
  name_bg: string | null
  source: string
  created_at: string
  updated_at: string
}

export type AdminEventPayload = Omit<
  AdminEventRecord,
  'id' | 'created_at' | 'updated_at'
>

export type AdminNewsPayload = Omit<
  AdminNewsRecord,
  'id' | 'created_at' | 'updated_at'
>

export type AdminDocumentPayload = Omit<
  AdminDocumentRecord,
  'id' | 'created_at' | 'updated_at'
>

export type RegistrationStatus = 'pending' | 'approved' | 'rejected'

export type CrewMember = {
  name: string
  date_of_birth?: string
}

export type RegistrationRecord = {
  id: string
  event_id: string

  // Boat
  boat_name: string
  border_number: string | null
  country: string
  certificate_of_navigation: string | null
  certificate_of_navigation_expiry: string | null
  model_design: string
  sail_number: string
  boat_age: number
  port_of_registry: string | null
  gph_irc: string
  loa: number
  boat_color: string | null
  yacht_club: string | null

  // Skipper
  skipper_name: string
  skipper_yacht_club: string
  charterer_name: string | null
  certificate_of_competency: string
  certificate_of_competency_expiry: string | null

  // Contact
  contact_name: string
  contact_phone: string
  contact_email: string

  // Preferences & declarations
  receive_documents_by_email: boolean
  crew_insurance: boolean
  third_party_insurance: boolean
  disclaimer_accepted: boolean
  gdpr_accepted: boolean

  crew_list: CrewMember[]
  generated_form_url: string | null
  status: RegistrationStatus
  created_at: string
  updated_at: string
}
