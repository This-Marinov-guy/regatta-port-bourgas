import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Regatta Port Bourgas'
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode
}) {
  return children
}
