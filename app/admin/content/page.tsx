import AdminContentPage from './AdminContentPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminContentPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/content/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
