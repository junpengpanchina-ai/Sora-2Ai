import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VideoPageClient from './VideoPageClient'

export default async function VideoPage() {
  // Server-side authentication check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Render client component
  return <VideoPageClient />
}
