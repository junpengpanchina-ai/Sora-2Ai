import AdminGeoManagerPage from './AdminGeoManagerPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function GeoPage() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) redirect('/admin/login')
    return <AdminGeoManagerPage adminUser={adminUser} />
  } catch (error) {
    console.error('[admin/tools/geo/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
