import { createSupabaseServerClient } from '@/lib/supabase/server'
import { extractNewsAttachmentUrls } from '@/lib/newsAttachments'

export type DbNews = {
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

export async function getNews(): Promise<DbNews[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch news:', error)
    return []
  }

  return (data ?? []).map((item) => ({
    ...item,
    attachments: extractNewsAttachmentUrls(item.body_en, item.body_bg)
  }))
}

export async function getNewsItem(slug: string): Promise<DbNews | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    return null
  }

  return {
    ...data,
    attachments: extractNewsAttachmentUrls(data.body_en, data.body_bg)
  }
}
