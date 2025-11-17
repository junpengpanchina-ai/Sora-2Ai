import AdminClient from './AdminClient'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  const adminUser = await validateAdminSession()

  if (!adminUser) {
    redirect('/admin/login')
  }

  return <AdminClient adminUser={adminUser} />
}
