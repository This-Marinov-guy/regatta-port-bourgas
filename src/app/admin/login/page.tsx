import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/adminAuth'
import AdminLoginForm from '@/app/components/admin/AdminLoginForm'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const user = await getAdminUser()

  if (user) {
    redirect('/admin')
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#eef2ff_0%,#ffffff_50%,#f8fafc_100%)] px-5 py-10 text-dark">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-8 rounded-[2rem] border border-black/10 bg-white/90 p-6 shadow-[0_30px_80px_rgba(23,32,35,0.12)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
          <div className="rounded-[1.5rem] bg-dark px-6 py-8 text-white md:px-8 md:py-10">
            <p className="mb-3  uppercase tracking-[0.32em] text-white/60">
              Regatta Port Bourgas
            </p>
            <h1 className="mb-4 text-4xl font-semibold leading-tight md:text-5xl">
              Admin control room
            </h1>
            {/* <p className="max-w-md  leading-6 text-white/70 md:text-base">
              Sign in with a Supabase email and password account to manage
              events, news, documents, and the public content shown on the
              site.
            </p> */}
            {/* <div className="mt-8 grid gap-3  text-white/75">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Only Supabase-authenticated users can access this area.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                Create admin users from the Supabase dashboard under Auth.
              </div>
            </div> */}
          </div>

          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}
