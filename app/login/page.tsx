import LoginButton from '@/components/LoginButton'
import Link from 'next/link'

interface LoginPageProps {
  searchParams?: {
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const errorMessage = searchParams?.error

  return (
    <div className="flex min-h-screen items-center justify-center bg-energy-hero dark:bg-energy-hero-dark">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">欢迎登录 Sora2Ai</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            使用 Google 账号登录后即可创建和管理您的 AI 视频。
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            登录失败：{errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <LoginButton />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            登录即表示您同意我们的{' '}
            <Link href="/terms" className="text-energy-water hover:underline dark:text-energy-soft">
              服务条款
            </Link>{' '}
            与{' '}
            <Link href="/privacy" className="text-energy-water hover:underline dark:text-energy-soft">
              隐私政策
            </Link>
            。
          </p>
        </div>
      </div>
    </div>
  )
}

