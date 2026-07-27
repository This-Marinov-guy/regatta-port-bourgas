import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const requestedNext = searchParams.get('next') ?? '/admin'
  const next =
    requestedNext.startsWith('/') && !requestedNext.startsWith('//')
      ? requestedNext
      : '/admin'

  const errorRedirect = (reason: string) =>
    NextResponse.redirect(
      `${origin}/admin/login?error=${encodeURIComponent(reason)}`
    )

  if (!code && (!token_hash || !type)) {
    return errorRedirect('Confirmation link is invalid or expired.')
  }

  const supabase = await createSupabaseServerClient()
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type!, token_hash: token_hash! })

  if (error) {
    return errorRedirect(error.message)
  }

  return NextResponse.redirect(new URL(next, origin))
}
