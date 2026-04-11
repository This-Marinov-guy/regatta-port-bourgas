import { requireAdminUser } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export default async function ProtectedAdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  await requireAdminUser()
  return children
}
