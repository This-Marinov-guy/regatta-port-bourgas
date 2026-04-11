export type EventStatus = 1 | 2 | 3

export type AdminEventRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string
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
  name_bg: string
  description_en: string | null
  description_bg: string | null
  body_en: string
  body_bg: string
  attachments: string[]
  created_at: string
  updated_at: string
}

export type AdminDocumentRecord = {
  id: string
  name_en: string
  name_bg: string
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
