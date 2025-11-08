import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Get user profile details
  const googleId = user.user_metadata?.provider_id || 
                   user.user_metadata?.sub || 
                   user.app_metadata?.provider_id ||
                   user.id
  
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sora-2Ai
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {userProfile && (
                <div className="flex items-center gap-3">
                  {userProfile.avatar_url && (
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.name || 'User avatar'}
                      className="h-8 w-8 rounded-full"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userProfile.name || user.email}
                  </span>
                </div>
              )}
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
            Welcome Back!
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            You have successfully logged into Sora-2Ai platform
          </p>

          {userProfile && (
            <div className="mt-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                User Information
              </h3>
              <div className="space-y-2 text-left">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Email: </span>
                  {userProfile.email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Username: </span>
                  {userProfile.name || 'Not set'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Account Created: </span>
                  {new Date(userProfile.created_at).toLocaleString('en-US')}
                </p>
                {userProfile.last_login_at && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Last Login: </span>
                    {new Date(userProfile.last_login_at).toLocaleString('en-US')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

