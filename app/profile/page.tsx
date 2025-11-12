import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfileClient from './ProfileClient'
import { getOrCreateUser } from '@/lib/user'

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

  return <ProfileClient userProfile={userProfile} />
}

