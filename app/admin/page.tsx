import AdminClient from './AdminClient'
import AdminLoginForm from './AdminLoginForm'
import { validateAdminSession } from '@/lib/admin-auth'

export default async function AdminPage() {
  const adminUser = await validateAdminSession()

  if (!adminUser) {
    return <AdminLoginForm />
  }

  return <AdminClient adminUser={adminUser} />
}
