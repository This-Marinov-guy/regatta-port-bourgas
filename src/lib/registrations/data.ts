import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { RegistrationRecord } from '@/types/admin'

type RegistrationEventRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  start_date: string
  end_date: string
}

export type RegistrationWithEvent = RegistrationRecord & {
  generated_form_url: string | null
  event: RegistrationEventRecord | null
}

export async function getRegistrationWithEvent(registrationId: string) {
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('registrations')
    .select(
      `
        *,
        event:events(
          id,
          slug,
          name_en,
          name_bg,
          start_date,
          end_date
        )
      `
    )
    .eq('id', registrationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as RegistrationWithEvent
}

export async function setGeneratedRegistrationFormUrl(
  registrationId: string,
  generatedFormUrl: string
) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('registrations')
    .update({ generated_form_url: generatedFormUrl })
    .eq('id', registrationId)

  if (error) {
    throw new Error(error.message)
  }
}

