import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

// /admin 重定向到 /admin/dashboard
export default async function AdminPage() {
  redirect('/admin/dashboard')
}
