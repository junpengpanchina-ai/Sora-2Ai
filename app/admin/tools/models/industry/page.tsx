import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminIndustryModelConfig from '@/app/admin/AdminIndustryModelConfig'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const adminUser = await validateAdminSession()
  if (!adminUser) redirect('/admin/login')
  return <AdminIndustryModelConfig onShowBanner={() => {}} />
}
