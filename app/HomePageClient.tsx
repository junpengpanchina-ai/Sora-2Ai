'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui'
import LogoutButton from '@/components/LogoutButton'
import LoginButton from '@/components/LoginButton'
import R2Image from '@/components/R2Image'
import PricingModal from '@/components/PricingModal'
import TasksDropdown from '@/components/TasksDropdown'
import { createClient } from '@/lib/supabase/client'

interface Stats {
  total: number
  succeeded: number
  processing: number
  failed: number
}

interface RecentTask {
  id: string
  prompt: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  created_at: string
  video_url: string | null
}

type UserProfile = {
  id?: string
  name?: string | null
  email: string
  avatar_url?: string | null
  created_at?: string
  last_login_at?: string | null
  credits?: number | null
}

interface HomePageClientProps {
  userProfile: UserProfile | null
}

export default function HomePageClient({ userProfile }: HomePageClientProps) {
  const supabase = useMemo(() => createClient(), [])
  const [hydratedProfile, setHydratedProfile] = useState<UserProfile | null>(userProfile)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [credits, setCredits] = useState<number>(userProfile?.credits || 0)
  const [showPricingModal, setShowPricingModal] = useState(false)

  useEffect(() => {
    setHydratedProfile(userProfile)
    if (userProfile?.credits !== undefined && userProfile?.credits !== null) {
      setCredits(userProfile.credits)
    }
  }, [userProfile])

  const getAuthHeaders = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      }
    }
    return {}
  }, [supabase])

  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          if (isMounted) {
            setHydratedProfile(null)
            setCredits(0)
          }
          return
        }

        const googleId =
          user.user_metadata?.provider_id ||
          user.user_metadata?.sub ||
          user.app_metadata?.provider_id ||
          user.id

        const { data: profile, error } = await supabase
          .from('users')
          .select('*')
          .eq('google_id', googleId)
          .maybeSingle()

        if (isMounted && (!error || error.code !== 'PGRST116')) {
          setHydratedProfile(profile ?? null)
          const creditValue =
            profile && typeof profile === 'object' && 'credits' in profile
              ? (profile as UserProfile).credits ?? null
              : null
          if (creditValue !== null && creditValue !== undefined) {
            setCredits(creditValue)
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      }
    }

    loadProfile()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setHydratedProfile(null)
        setCredits(0)
        return
      }
      loadProfile()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    // Only fetch stats if user is logged in
    if (!hydratedProfile) {
      return
    }

    let isMounted = true

    const fetchStats = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/stats', {
          headers,
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (!isMounted || !data?.success) {
          return
        }
        setStats(data.stats)
        setRecentTasks(data.recentTasks || [])
        if (data.credits !== undefined) {
          setCredits(data.credits)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      }
    }

    fetchStats()
    // Refresh credits every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    
    // Listen for credits update events (from payment success page)
    const handleCreditsUpdate = (event: Event) => {
      const detail = (event as CustomEvent<{ credits?: number }>).detail
      if (detail?.credits !== undefined) {
        setCredits(detail.credits)
        // Also refresh stats to get latest data
        fetchStats()
      }
    }
    
    window.addEventListener('creditsUpdated', handleCreditsUpdate)
    
    return () => {
      isMounted = false
      clearInterval(interval)
      window.removeEventListener('creditsUpdated', handleCreditsUpdate)
    }
  }, [hydratedProfile, getAuthHeaders])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Sora2Ai Videos
              </h1>
              <Link
                href="/prompts"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
              >
                Prompts
              </Link>
              <Link
                href={hydratedProfile ? '/video' : '/login'}
                className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
              >
                Video Generation
              </Link>
              {hydratedProfile && (
                <Link
                  href="/profile"
                  className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
                >
                  Profile
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Stats Cards in Navbar - Only show if logged in */}
              {hydratedProfile && stats && (
                <div className="hidden lg:flex items-center gap-3">
                  <div className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{stats.total}</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Success</p>
                    <p className="text-sm font-bold text-green-600 dark:text-green-400">{stats.succeeded}</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Processing</p>
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{stats.processing}</p>
                  </div>
                  <div className="px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
                  </div>
                </div>
              )}
              
              {hydratedProfile ? (
                <>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-energy-water-surface dark:bg-energy-water-muted">
                  <span className="text-sm font-medium text-energy-water dark:text-energy-soft">
                    Credits: {credits}
                  </span>
                </div>
                {hydratedProfile.avatar_url && (
                  <Image
                    src={hydratedProfile.avatar_url}
                    alt={hydratedProfile.name ?? 'User avatar'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    unoptimized
                  />
                )}
                <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:inline">
                  {hydratedProfile.name ?? hydratedProfile.email}
                </span>
                <Button variant="primary" size="sm" onClick={() => setShowPricingModal(true)}>
                  Buy Plan
                </Button>
                <LogoutButton />
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="primary" size="sm">
                      Buy Plan
                    </Button>
                  </Link>
                  <LoginButton />
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8 text-center animate-fade-in">
          <h2 className="mb-3 text-4xl font-bold text-gray-900 dark:text-white">
            {hydratedProfile ? `Welcome back, ${hydratedProfile.name || 'User'}!` : 'Welcome to Sora2Ai Videos'}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            Transform your creativity into amazing videos with OpenAI Sora 2.0
          </p>
          <div className="flex items-center justify-center gap-[3cm]">
            {hydratedProfile ? (
              <>
            <Link href="/video">
              <Button variant="primary" size="lg">
                Start Generating Video
              </Button>
            </Link>
                <TasksDropdown tasks={recentTasks} stats={stats} />
              </>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Login to Generate Video
            </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Pricing and Recharge Section */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <strong className="text-gray-900 dark:text-white">Video Generation Price:</strong>
                    <span className="font-semibold text-energy-water dark:text-energy-soft"> 10 credits/video</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    【Watermark-free】OpenAI&apos;s latest Sora 2.0 model, official beta testing, pricing is tentative and may change in the future
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Carousel - Always visible */}
        <div className="mb-8 space-y-6">
          {/* Top row: slide from right to left */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-right" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="2b827a33e43a48b2b583ed428977712c.png"
                    alt="Image 1"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="460bef39f6e34f82912a27e357827963.png"
                    alt="Image 2"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="5995d3bfdb674ecebaccc581ed8940b3.png"
                    alt="Image 3"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="7b0be82bb2134fca87519cbecf30aca9.png"
                    alt="Image 4"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom row: slide from left to right */}
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-left" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="80dc75a06d0b49c29bdb78eb45dc70a0.png"
                    alt="Image 5"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="b451ac136a474a9f91398a403af2d2a6.png"
                    alt="Image 6"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="e6e1ebc8cea34e83a106009a485b1cbb.png"
                    alt="Image 7"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <R2Image
                    src="f566981bc27549b7a2389a6887e9c840.png"
                    alt="Image 8"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Carousel - Below image carousel */}
        <div className="mb-8">
          <div className="overflow-hidden">
            <div className="flex gap-6 animate-slide-right" style={{ width: '300%' }}>
              {/* First set */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223443_366.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
              {/* Second set - duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224947_118.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223443_366.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
              {/* Third set - extra duplicate for seamless loop */}
              <div className="flex gap-6 flex-shrink-0" style={{ width: '33.333%' }}>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224947_118.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_223856_981.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                  <video
                    src="https://pub-2868c824f92441499577980a0b61114c.r2.dev/vdieo/%E5%BE%AE%E4%BF%A1%E8%A7%86%E9%A2%912025-11-09_224357_417.mp4"
                    className="w-full aspect-[9/16] rounded-lg cursor-pointer object-cover"
                    controls
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Features and User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Features */}
            <Card>
              <CardHeader>
                <CardTitle>Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    🎬 AI Video Generation
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Use advanced Sora 2.0 model to generate high-quality videos from text descriptions
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    🖼️ Reference Images
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Upload reference images to help AI better understand your creativity
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    ⚙️ Flexible Configuration
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Customize video aspect ratio, duration, and quality to meet different needs
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    📊 Real-time Tracking
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Monitor task progress in real-time with automatic notifications on completion
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* User Info - Only show if logged in */}
            {userProfile && (
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Username
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {userProfile.name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Created At
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {formatDate(userProfile.created_at)}
                  </p>
                </div>
                {userProfile.last_login_at && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Last Login
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDate(userProfile.last_login_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </div>

        {/* Pricing Plans Section */}
        <div className="mb-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Choose Your Plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Each video generation consumes 10 credits
            </p>
        </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Basic Plan - $39 */}
            <Card className="relative">
            <CardHeader>
                <CardTitle className="text-xl text-center">Basic Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-energy-water dark:text-energy-soft">
                    $39
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    USD
                  </div>
                </div>
                
                <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    50 Videos
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    500 Credits
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Perfect for individual users and small projects
                </p>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  ~ $0.78 / video
              </div>

                <div className="flex justify-center">
                  <stripe-buy-button
                    buy-button-id="buy_btn_1SSKRyDqGbi6No9vhYgi4niS"
                    publishable-key="pk_live_51SKht2DqGbi6No9v57glxTk8MK8r0Ro9lcsHigkf3RNMzI3MLbQry0xPY4wAi5UjUkHGrQpKCBe98cwt0G7Fj1B700YGD58zbP"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Professional Plan - $299 */}
            <Card className="relative border-2 border-energy-gold-mid dark:border-energy-gold-soft shadow-lg">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-energy-water text-white shadow-custom-md">
                Recommended
              </Badge>
              <CardHeader>
                <CardTitle className="text-xl text-center">Professional Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-energy-water dark:text-energy-soft">
                    $299
              </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    USD
                  </div>
                </div>
                
                <div className="text-center py-4 border-t border-b border-gray-200 dark:border-gray-700">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    200 Videos
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    2000 Credits
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Perfect for professional users and large projects
                </p>

                <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                  ~ $1.50 / video
                </div>

                <div className="flex justify-center">
                  <stripe-buy-button
                    buy-button-id="buy_btn_1SSKYdDqGbi6No9vbFWdJAOt"
                    publishable-key="pk_live_51SKht2DqGbi6No9v57glxTk8MK8r0Ro9lcsHigkf3RNMzI3MLbQry0xPY4wAi5UjUkHGrQpKCBe98cwt0G7Fj1B700YGD58zbP"
                  />
                </div>
            </CardContent>
          </Card>
        </div>

          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg max-w-4xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Purchase Information
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Credits will be automatically added to your account after payment is completed</li>
              <li>• Each video generation consumes 10 credits</li>
              <li>• Credits are permanent with no expiration date</li>
              <li>• Supports credit cards, debit cards, and other payment methods</li>
            </ul>
          </div>
        </div>
      </main>

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
      />

      <Link
        href="/support"
        className="fixed right-6 bottom-6 z-50 inline-flex items-center gap-2 rounded-full bg-energy-water px-5 py-3 text-sm font-semibold text-white shadow-xl transition-transform hover:translate-y-[-2px] hover:bg-energy-water-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-energy-water"
      >
        Feedback
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}

