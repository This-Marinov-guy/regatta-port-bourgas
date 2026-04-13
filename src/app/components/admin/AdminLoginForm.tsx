'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import { validateEmail, validatePassword } from '@/lib/validation'

export default function AdminLoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    const message = emailError || passwordError

    if (message) {
      setErrorMessage(message)
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="rounded-[1.5rem] border border-black/10 bg-white p-6 md:p-8">
      <p className="mb-2  uppercase tracking-[0.28em] text-primary/70">
        Secure login
      </p>
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
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-white/20"
            placeholder="Your password"
          />
        </label>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3  text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center rounded-2xl border border-primary bg-primary px-5 py-3 text-base text-white transition hover:bg-transparent hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in to admin'}
        </button>
      </form>
    </div>
  )
}
