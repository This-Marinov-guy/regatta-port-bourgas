import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceKey, getSupabaseUrl } from './config'

export function createSupabaseServiceClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
