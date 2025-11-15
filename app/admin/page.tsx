import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminClient from './AdminClient'
import { cookies } from 'next/headers'

// 管理员密码
const ADMIN_PASSWORD = 'peng000000'
const ADMIN_USERNAME = '251144748'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { username?: string; password?: string; logout?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 检查是否已登录（Supabase 认证）
  if (!user) {
    redirect('/login')
  }

  // 检查是否有管理员会话
  const cookieStore = await cookies()
  const adminSession = cookieStore.get('admin_session')

  // 如果提供了用户名和密码，验证并设置会话
  if (searchParams.username && searchParams.password) {
    if (searchParams.username === ADMIN_USERNAME && searchParams.password === ADMIN_PASSWORD) {
      // 设置管理员会话 cookie（24小时有效）
      cookieStore.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24小时
      })
      // 重定向到清除 URL 参数
      redirect('/admin')
    } else {
      // 密码错误，显示错误信息
      return (
        <div className="min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark">
          <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理员登录</h1>
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">用户名或密码错误</p>
            </div>
            <form method="get" action="/admin" className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  用户名
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  密码
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="请输入密码"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-energy-water px-4 py-2 text-white font-semibold hover:bg-energy-water-deep transition-colors"
              >
                登录
              </button>
            </form>
          </div>
        </div>
      )
    }
  }

  // 如果点击了登出
  if (searchParams.logout === 'true') {
    cookieStore.delete('admin_session')
    redirect('/admin?username=&password=')
  }

  // 如果没有管理员会话，显示登录表单
  if (!adminSession || adminSession.value !== 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">管理员登录</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">请输入管理员凭据</p>
          </div>
          <form method="get" action="/admin" className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                用户名
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="请输入用户名"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="请输入密码"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-energy-water px-4 py-2 text-white font-semibold hover:bg-energy-water-deep transition-colors"
            >
              登录
            </button>
          </form>
        </div>
      </div>
    )
  }

  // 已通过验证，显示管理员后台
  return <AdminClient />
}
