import AdminSEOChatManagerPage from './AdminSEOChatManagerPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SEOChatPage() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) redirect('/admin/login')
    return <AdminSEOChatManagerPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/tools/seo/chat/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
