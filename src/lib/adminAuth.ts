import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function getAdminUser() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

export async function requireAdminUser() {
  const user = await getAdminUser()

  if (!user) {
    redirect('/admin/login')
  }

  return user
}
