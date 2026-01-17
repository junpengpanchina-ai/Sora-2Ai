import AdminPromptsPage from './AdminPromptsPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PromptsPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminPromptsPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/prompts/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
