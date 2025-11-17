import AdminLoginForm from '../AdminLoginForm'
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export default async function AdminLoginPage() {
  const adminUser = await validateAdminSession()

  if (adminUser) {
    redirect('/admin')
  }

  return <AdminLoginForm redirectPath="/admin" title="管理员登录" description="请输入管理员账号和密码以进入后台管理系统" />
}

