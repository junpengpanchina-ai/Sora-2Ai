import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminComparePagesManager from './AdminComparePagesManager'

export const dynamic = 'force-dynamic'

export default async function ComparePagesPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminComparePagesManager onShowBanner={() => {}} />
  } catch (error) {
    console.error('[admin/content/compare/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
