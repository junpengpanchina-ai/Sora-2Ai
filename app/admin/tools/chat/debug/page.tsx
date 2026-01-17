import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { AdminChatDebug } from '@/app/admin/_components'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const adminUser = await validateAdminSession()
  if (!adminUser) redirect('/admin/login')
  return <AdminChatDebug onShowBanner={() => {}} />
}
