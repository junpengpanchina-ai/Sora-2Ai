import AdminIndustryModelConfigPage from './AdminIndustryModelConfigPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function IndustryModelConfigPage() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) redirect('/admin/login')
    return <AdminIndustryModelConfigPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/tools/models/industry/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
