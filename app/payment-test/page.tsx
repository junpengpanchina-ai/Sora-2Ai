import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PaymentTestClient from './PaymentTestClient'

export default async function PaymentTestPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow unauthenticated users to view (but they can't see their data)
  let userProfile = null
  
  if (user) {
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

  return <PaymentTestClient userProfile={userProfile} />
}

