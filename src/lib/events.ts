import { createSupabaseServerClient } from '@/lib/supabase/server'

export type DbEvent = {
  id: string
  slug: string
  name_en: string
  name_bg: string
  description_en: string | null
  description_bg: string | null
  thumbnail_img: string | null
  status: 1 | 2 | 3
  start_date: string
  end_date: string
  documents: string[]
  notice_board: string[]
  results: string[]
  register_form: string[]
  created_at: string
  updated_at: string
}

export async function getEvents(): Promise<DbEvent[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('start_date', { ascending: false })

  if (error) {
    console.error('Failed to fetch events:', error)
    return []
  }

  return data ?? []
}

export async function getEvent(slug: string): Promise<DbEvent | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return data
}
