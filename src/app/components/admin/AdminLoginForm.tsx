'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { validateEmail, validatePassword } from '@/lib/validation'

type LoginAction = 'password' | 'magic-link' | 'passkey'

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submittingAction, setSubmittingAction] = useState<LoginAction | null>(
    null
  )
  const isSubmitting = submittingAction !== null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const message = emailError || passwordError

    if (message) {
      toast.error(message)
      return
    }

    setSubmittingAction('password')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      toast.error(error.message)
      setSubmittingAction(null)
      return
    }

    toast.success('Signed in successfully')
    router.replace('/admin')
    router.refresh()
  }

  async function handleMagicLink() {
    const emailError = validateEmail(email)

    if (emailError) {
      toast.error(emailError)
      return
    }

    setSubmittingAction('magic-link')

    const supabase = createSupabaseBrowserClient()
    const origin = window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent('/admin')}`
      }
    })

    if (error) {
      toast.error(error.message)
      setSubmittingAction(null)
      return
    }

    toast.success('Magic link sent. Check your inbox.')
    setSubmittingAction(null)
  }

  async function handlePasskeyLogin() {
    setSubmittingAction('passkey')

    const supabase = createSupabaseBrowserClient()
    const { data, error } = await supabase.auth.signInWithPasskey()

    if (error || !data?.session) {
      const message = error?.message.toLowerCase().includes('passkey') &&
        error.message.toLowerCase().includes('disabled')
        ? 'Passkeys are not enabled for this Supabase project yet.'
        : error?.message || 'Could not sign in with passkey.'
      toast.error(message)
      setSubmittingAction(null)
      return
    }

    toast.success('Signed in successfully')
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 md:p-8">
      {/* <p className="mb-8  leading-6 text-dark/60">
        Use a Supabase email/password user. Social login and the public site
        sign-in page are not used here.
      </p> */}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block  font-medium text-dark">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-white/20"
            placeholder="admin@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-2 block  font-medium text-dark">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 pr-12 text-base text-dark outline-none transition focus:border-primary dark:border-white/20"
              placeholder="Your password"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-dark/50 transition hover:text-primary"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-2xl border border-primary bg-primary px-5 py-3 text-base text-white transition hover:bg-transparent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingAction === 'password' ? 'Signing in...' : 'Sign in to admin'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-dark/35">
        <span className="h-px flex-1 bg-black/10" />
        <span>or</span>
        <span className="h-px flex-1 bg-black/10" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void handleMagicLink()}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Mail className="h-4 w-4" aria-hidden="true" />
          {submittingAction === 'magic-link' ? 'Sending...' : 'Magic link'}
        </button>
        <button
          type="button"
          onClick={() => void handlePasskeyLogin()}
          disabled={isSubmitting}
          className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-medium text-dark transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          {submittingAction === 'passkey'
            ? 'Connecting...'
            : 'Passkey'}
        </button>
      </div>
    </div>
  )
}
