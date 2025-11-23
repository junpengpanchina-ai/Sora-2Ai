import { createClient } from '@/lib/supabase/server'
import HomePageClient from './HomePageClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow unauthenticated users to browse the homepage
  // Only fetch user profile if user is authenticated
  let userProfile = null
  
  if (user) {
    // Get user profile details if authenticated
    const googleId = user.user_metadata?.provider_id || 
                     user.user_metadata?.sub || 
                     user.app_metadata?.provider_id ||
                     user.id
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .maybeSingle()

    if (!profileError || profileError.code !== 'PGRST116') {
      userProfile = profile || null
    }
  }

  return <HomePageClient userProfile={userProfile} />
}

