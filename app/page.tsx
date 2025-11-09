import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HomePageClient from './HomePageClient'

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

  if (!userProfile) {
    redirect('/login')
  }

  return <HomePageClient userProfile={userProfile} />
}

