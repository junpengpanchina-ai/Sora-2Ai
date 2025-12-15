import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { getOrCreateUser } from '@/lib/user'

export const metadata: Metadata = {
  title: 'My Account - Profile & Credits Management',
  description: 'Access your Sora2Ai account dashboard. Check remaining video generation credits, view purchase history, update profile settings, and manage subscriptions.',
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userProfile = await getOrCreateUser(supabase, user)

  if (!userProfile) {
    redirect('/login')
  }

  // Get full user profile with email from database
  const { data: fullUserProfile } = await supabase
    .from('users')
    .select('id, email, name, credits, avatar_url, google_id, created_at, last_login_at')
    .eq('id', userProfile.id)
    .single()

  if (!fullUserProfile) {
    redirect('/login')
  }

  return <ProfileClient userProfile={fullUserProfile} />
}

