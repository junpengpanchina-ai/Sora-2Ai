import AdminChatManagerPage from './AdminChatManagerPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ChatManagerPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminChatManagerPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/tools/chat/manager/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
