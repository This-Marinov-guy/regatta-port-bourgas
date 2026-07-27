import { redirect } from 'next/navigation'
import Image from 'next/image'
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
          <div className="relative min-h-[16rem] overflow-hidden rounded-[1.5rem] bg-dark md:min-h-0">
            <Image
              src="/images/splashscreen/admin.jpg"
              alt=""
              fill
              className="object-cover"
              priority
            />
            <p className="absolute inset-x-0 top-6 text-center text-lg font-semibold uppercase tracking-[0.32em] text-white drop-shadow-md">
              Admin Login
            </p>
          </div>

          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}
