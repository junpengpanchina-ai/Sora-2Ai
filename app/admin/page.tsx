import AdminClient from './AdminClient'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminClient adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
