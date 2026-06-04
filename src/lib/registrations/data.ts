import { createSupabaseServiceClient } from '@/lib/supabase/service'
import type { EventFeeType, RegistrationRecord } from '@/types/admin'

type RegistrationEventRecord = {
  id: string
  slug: string
  name_en: string
  name_bg: string | null
  start_date: string
  end_date: string
  fee_amount_cents: number | null
  fee_type: EventFeeType | null
}

export type RegistrationWithEvent = RegistrationRecord & {
  generated_form_url: string | null
  blank_link: string | null
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
          end_date,
          fee_amount_cents,
          fee_type
        )
      `
    )
    .eq('id', registrationId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    ...data,
    generated_form_url: data.blank_link ?? null,
  } as RegistrationWithEvent
}

export async function setGeneratedRegistrationFormUrl(
  registrationId: string,
  generatedFormUrl: string
) {
  const supabase = createSupabaseServiceClient()
  const { error } = await supabase
    .from('registrations')
    .update({
      blank_link: generatedFormUrl,
    })
    .eq('id', registrationId)

  if (error) {
    throw new Error(error.message)
  }
}
