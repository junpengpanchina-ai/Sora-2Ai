/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState, useCallback, useRef, type RefObject } from 'react'
import Link from 'next/link'
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

const promptTemplates = [
  {
    id: 'dream-city',
    title: 'Futuristic Skyline',
    description: 'Cinematic aerial shot with dynamic camera movement and neon reflections.',
    prompt:
      'A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera.',
  },
  {
    id: 'forest-creatures',
    title: 'Forest Creatures',
    description: 'Magical woodland scene with stylized lighting and soft depth of field.',
    prompt:
      'Close-up of two curious red pandas exploring a glowing forest, soft volumetric light beams, dust particles floating in the air, shallow depth of field, whimsical mood, Pixar style.',
  },
  {
    id: 'sports-energy',
    title: 'Sports Energy',
    description: 'High-energy slow motion shot with detailed motion and textures.',
    prompt:
      'Slow-motion shot of a basketball player leaping for a dunk during a street game, sweat particles, motion trails, dynamic crowd in the background, golden hour lighting, handheld documentary style.',
  },
  {
    id: 'fashion-walk',
    title: 'Fashion Runway',
    description: 'Stylized neon runway with bold colors and reflective surfaces.',
    prompt:
      'Editorial fashion walk on a reflective runway, bold neon purple and teal lighting, model wearing avant-garde metallic outfit, camera dolly backward with subtle parallax, crisp reflections on glossy floor.',
  },
]

interface HomePageClientProps {
  userProfile: UserProfile | null
}

export default function HomePageClient({ userProfile }: HomePageClientProps) {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [hydratedProfile, setHydratedProfile] = useState<UserProfile | null>(userProfile)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [credits, setCredits] = useState<number>(userProfile?.credits || 0)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [videosReady, setVideosReady] = useState(false)
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null)
  const imageSectionRef = useRef<HTMLDivElement | null>(null)
  const videoSectionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setSupabase(createClient())
  }, [])

  useEffect(() => {
    setHydratedProfile(userProfile)
    if (userProfile?.credits !== undefined && userProfile?.credits !== null) {
      setCredits(userProfile.credits)
    }
  }, [userProfile])

  const getAuthHeaders = useCallback(async (): Promise<Record<string, string>> => {
    if (!supabase) {
      return {} as Record<string, string>
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`,
      }
    }
    return {} as Record<string, string>
  }, [supabase])

  useEffect(() => {
    if (!supabase) {
      return
    }
    const client = supabase
    let isMounted = true

    const loadProfile = async () => {
      try {
        const {
          data: { user },
        } = await client.auth.getUser()

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

        const { data: profileData, error } = await client
          .from('users')
          .select('*')
          .eq('google_id', googleId)
          .maybeSingle()

        const profile = (profileData ?? null) as UserProfile | null

        const fallbackAvatar =
          profile?.avatar_url ??
          user.user_metadata?.avatar_url ??
          user.user_metadata?.picture ??
          user.user_metadata?.avatar ??
          null
        const fallbackName =
          profile?.name ??
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.user_metadata?.display_name ??
          user.email ??
          null

        const enhancedProfile = profile
          ? {
              ...profile,
              avatar_url: profile.avatar_url ?? fallbackAvatar ?? null,
              name: profile.name ?? fallbackName ?? undefined,
            }
          : null

        if (isMounted && (!error || error.code !== 'PGRST116')) {
          setHydratedProfile(enhancedProfile)
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
    } = client.auth.onAuthStateChange((_event, session) => {
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
    if (!hydratedProfile || !supabase) {
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
  }, [hydratedProfile, getAuthHeaders, supabase])

  const handleCopyTemplate = useCallback(async (templateId: string, promptText: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(promptText)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = promptText
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopiedTemplateId(templateId)
      setTimeout(() => setCopiedTemplateId(null), 2000)
    } catch (error) {
      console.error('Failed to copy prompt', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (!('IntersectionObserver' in window)) {
      setImagesReady(true)
      setVideosReady(true)
      return
    }

    const cleanupFunctions: Array<() => void> = []

    const createObserver = (ref: RefObject<HTMLDivElement>, setVisible: (value: boolean) => void) => {
      const node = ref.current
      if (!node) {
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true)
              observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '200px' }
      )

      observer.observe(node)
      cleanupFunctions.push(() => observer.disconnect())
    }

    createObserver(imageSectionRef, setImagesReady)
    createObserver(videoSectionRef, setVideosReady)

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [])

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
                {hydratedProfile.avatar_url ? (
                  <img
                    src={hydratedProfile.avatar_url}
                    alt={hydratedProfile.name ?? 'User avatar'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                    {(hydratedProfile.name ?? hydratedProfile.email ?? '?').charAt(0).toUpperCase()}
                  </div>
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

        {/* Image Carousel - Lazy render to protect LCP */}
        <div className="mb-8 space-y-6" ref={imageSectionRef}>
          {imagesReady ? (
            <>
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
            </>
          ) : (
            <div
              className="h-[320px] w-full rounded-3xl bg-white/40 dark:bg-gray-900/40 animate-pulse"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Video Carousel - Below image carousel */}
        <div className="mb-8" ref={videoSectionRef}>
          {videosReady ? (
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
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
                      preload="metadata"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="h-[420px] w-full rounded-3xl bg-white/40 dark:bg-gray-900/40 animate-pulse"
              aria-hidden="true"
            />
          )}
        </div>

        {/* Prompt Templates and User Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 items-start">
            <div className="space-y-6">
              {/* Prompt Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Prompt Templates</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click “Use Template” to open the video generator with the prompt pre-filled, or copy it to tweak your own version.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    {promptTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3 bg-gray-50/40 dark:bg-gray-900/30"
                      >
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                            {template.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {template.description}
                          </p>
                        </div>
                        <pre className="text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md p-3 whitespace-pre-wrap">
                          {template.prompt}
                        </pre>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCopyTemplate(template.id, template.prompt)}
                          >
                            {copiedTemplateId === template.id ? 'Copied!' : 'Copy Prompt'}
                          </Button>
                          <Link href={`/video?prompt=${encodeURIComponent(template.prompt)}`}>
                            <Button type="button" variant="primary" size="sm">
                              Use Template
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

            </div>

            <div className="space-y-6">
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
            </div>

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
                    {userProfile?.created_at ? formatDate(userProfile.created_at) : '-'}
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

