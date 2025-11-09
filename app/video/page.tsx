import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
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

  // Render client component with Suspense for useSearchParams
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VideoPageClient />
    </Suspense>
  )
}
