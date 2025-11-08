import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginButton from '@/components/LoginButton'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to home if already logged in
  if (user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Sora-2Ai
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            AI Video Generation Platform
          </p>
        </div>

        {searchParams.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
            <p className="font-semibold">Login Failed</p>
            <p className="mt-1">
              {searchParams.error === 'auth_failed'
                ? 'Authentication failed, please check your configuration'
                : searchParams.error === 'no_code'
                ? 'Authorization code not received, please try again'
                : searchParams.error === 'no_session'
                ? 'Session creation failed'
                : searchParams.error === 'oauth_error'
                ? 'OAuth configuration error, please check Google Provider settings in Supabase'
                : decodeURIComponent(searchParams.error)}
            </p>
            <p className="mt-2 text-xs opacity-75">
              If the problem persists, please check:
              <br />1. Whether Google Provider is enabled in Supabase
              <br />2. Whether redirect URIs are correct in Google Cloud Console
            </p>
          </div>
        )}

        {searchParams.message && (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
            {searchParams.message}
          </div>
        )}

        <LoginButton />

        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

