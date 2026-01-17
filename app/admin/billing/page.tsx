import AdminBillingPage from './AdminBillingPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminBillingPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/billing/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
