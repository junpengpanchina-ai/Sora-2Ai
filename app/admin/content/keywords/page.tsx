import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminKeywordsManager from './AdminKeywordsManager'

export const dynamic = 'force-dynamic'

export default async function KeywordsPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminKeywordsManager onShowBanner={() => {}} />
  } catch (error) {
    console.error('[admin/content/keywords/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
