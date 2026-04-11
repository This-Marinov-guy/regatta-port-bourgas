import AdminDashboard from '@/app/components/admin/AdminDashboard'
import { requireAdminUser } from '@/lib/adminAuth'
import { listDocuments, listEvents, listNews } from '@/lib/adminContent'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await requireAdminUser()
  const [events, news, documents] = await Promise.all([
    listEvents(),
    listNews(),
    listDocuments()
  ])

  return (
    <AdminDashboard
      userEmail={user.email ?? 'admin'}
      initialEvents={events}
      initialNews={news}
      initialDocuments={documents}
    />
  )
}
