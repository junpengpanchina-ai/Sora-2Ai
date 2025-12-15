'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoPageClient from './VideoPageClient'
import { createClient } from '@/lib/supabase/client'

export default function VideoPageWrapper() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setAuthorized(false)
        router.replace('/login')
        return
      }

      setAuthorized(true)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setAuthorized(false)
        router.replace('/login')
      } else {
        setAuthorized(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  if (authorized === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!authorized) {
    return null
  }

  return <VideoPageClient />
}
