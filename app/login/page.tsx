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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Sora2Ai</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in with your Google account to create and manage your AI videos.
          </p>
        </div>

        {errorMessage && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            Sign in failed: {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <LoginButton />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By signing in you agree to our{' '}
            <Link href="/terms" className="text-energy-water hover:underline dark:text-energy-soft">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-energy-water hover:underline dark:text-energy-soft">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

