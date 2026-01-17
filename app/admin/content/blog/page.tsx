import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminBlogManager from './AdminBlogManager'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  try {
    const adminUser = await validateAdminSession()

    if (!adminUser) {
      redirect('/admin/login')
    }

    return <AdminBlogManager onShowBanner={() => {}} />
  } catch (error) {
    console.error('[admin/content/blog/page] 验证管理员会话失败:', error)
    redirect('/admin/login')
  }
}
