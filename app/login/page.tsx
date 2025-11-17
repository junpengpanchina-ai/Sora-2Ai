import AdminLoginForm from '@/app/admin/AdminLoginForm'

export default function LoginPage() {
  return (
    <AdminLoginForm
      redirectPath="/admin"
      title="后台登录"
      description="请输入管理员账号和密码以进入后台管理系统"
    />
  )
}

