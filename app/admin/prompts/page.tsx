import AdminPromptsPage from './AdminPromptsPage'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

// ❌ Prompt 页面永远 noindex（内部资产，不参与 SEO/GEO）
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

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
