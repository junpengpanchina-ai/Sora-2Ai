import AdminLandingPage from './AdminLandingPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminLandingPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/landing/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
