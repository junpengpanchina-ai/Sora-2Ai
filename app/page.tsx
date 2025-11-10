import { createClient } from '@/lib/supabase/server'
import HomePageClient from './HomePageClient'

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
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    userProfile = profile || null
  }

  return <HomePageClient userProfile={userProfile} />
}

