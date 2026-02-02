import AdminConversionGateClient from './AdminConversionGateClient'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ConversionGatePage() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) redirect('/admin/login')
    return <AdminConversionGateClient />
  } catch (e) {
    console.error('[admin/conversion-gate]', e)
    redirect('/admin/login')
  }
}
