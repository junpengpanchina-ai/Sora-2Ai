'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import VideoPageClient from './VideoPageClient'
import { createClient } from '@/lib/supabase/client'
import { setPostLoginRedirect } from '@/lib/auth/post-login-redirect'

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
        const intended =
          typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
        setPostLoginRedirect(intended)
        router.replace(`/login?redirect=${encodeURIComponent(intended)}`)
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
        const intended =
          typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
        setPostLoginRedirect(intended)
        router.replace(`/login?redirect=${encodeURIComponent(intended)}`)
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
