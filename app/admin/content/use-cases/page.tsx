import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminUseCasesManager from './AdminUseCasesManager'

export const dynamic = 'force-dynamic'

export default async function UseCasesPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminUseCasesManager onShowBanner={() => {}} />
  } catch (error) {
    console.error('[admin/content/use-cases/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
