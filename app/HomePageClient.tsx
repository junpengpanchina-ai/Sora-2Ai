/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState, useCallback, useRef, type RefObject } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import HeroV2 from './HeroV2'
import LogoutButton from '@/components/LogoutButton'
import LoginButton from '@/components/LoginButton'
import R2Image from '@/components/R2Image'
import PricingModal from '@/components/PricingModal'
import { PlanCard } from '@/components/pricing/PlanCard'
import { CreditUsageTable } from '@/components/pricing/CreditUsageTable'
import { FAQAccordion, type FAQItem } from '@/components/pricing/FAQAccordion'
import { createClient } from '@/lib/supabase/client'
import { setPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { PRICING_CONFIG } from '@/lib/billing/config'
import type { PlanId } from '@/lib/billing/config'
import { Events } from '@/lib/analytics/events'

interface Stats {
  total: number
  succeeded: number
  processing: number
  failed: number
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

const USE_CASE_SHOWCASE = [
  {
    title: 'Marketing Campaigns',
    description: 'Product launches, promotions, and brand storytelling with short-form video.',
    tag: 'marketing',
  },
  {
    title: 'Social Media Shorts',
    description: 'Fast, scroll-stopping clips for TikTok / Reels / Shorts—optimized for 10–15s.',
    tag: 'social-media',
  },
  {
    title: 'Advertising Creatives',
    description: 'A/B test ad angles quickly with consistent visual style and messaging.',
    tag: 'ads',
  },
  {
    title: 'Product Demos',
    description: 'Show features and workflows clearly—ideal for SaaS and e-commerce.',
    tag: 'product-demo',
  },
  {
    title: 'Education Explainers',
    description: 'Visualize concepts with simple, safe scenes and clear structure.',
    tag: 'education',
  },
  {
    title: 'YouTube Visual B-Roll',
    description: 'Supplement narration with cinematic, topic-matching visuals.',
    tag: 'youtube',
  },
  {
    title: 'Local Business Promos',
    description: 'Restaurants, cafes, gyms—flash deals and announcements made easy.',
    tag: 'local',
  },
  {
    title: 'Real Estate Highlights',
    description: 'Property features, neighborhood vibe, and lifestyle storytelling.',
    tag: 'real-estate',
  },
] as const

// Use Cases for non-logged-in users (simplified, conversion-focused)
const USE_CASES_FOR_VISITORS = [
  {
    title: 'For Marketing Teams',
    description: 'Create ad creatives, landing page videos, and campaign visuals in minutes.',
    link: '/use-cases?type=advertising-promotion',
  },
  {
    title: 'For E-commerce Sellers',
    description: 'Generate product demo videos and UGC-style content at scale.',
    link: '/use-cases?type=product-demo-showcase',
  },
  {
    title: 'For Educators & Trainers',
    description: 'Turn lessons and scripts into engaging educational videos.',
    link: '/use-cases?type=education-explainer',
  },
  {
    title: 'For Social Media Creators',
    description: 'Produce TikTok, YouTube Shorts, and Instagram videos daily with AI.',
    link: '/use-cases?type=social-media-content',
  },
] as const

// How It Works steps
const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Enter Your Text or Prompt',
    description: 'Describe your video idea or upload a script.',
  },
  {
    step: 2,
    title: 'Choose Video Style',
    description: 'Select format, style, and resolution.',
  },
  {
    step: 3,
    title: 'Generate with AI',
    description: 'Sora2 automatically creates the video.',
  },
  {
    step: 4,
    title: 'Download or Share',
    description: 'Export and publish anywhere.',
  },
] as const

// FAQ items for pricing section
const PRICING_FAQ_ITEMS: FAQItem[] = [
  {
    q: 'Do credits expire?',
    a: 'Purchased credits never expire. Bonus credits (from Starter or promotions) may have an expiry, and we always show the expiry date.',
  },
  {
    q: 'What are bonus credits?',
    a: 'Bonus credits are temporary credits that help you test the workflow. They\'re limited-time by design to keep pricing fair.',
  },
  {
    q: 'Can I use Veo Pro on Starter?',
    a: 'Starter is for testing the workflow with fair-use limits. Veo Pro is available on paid packs.',
  },
  {
    q: 'Can I use bonus credits for Veo Pro?',
    a: 'No. Veo Pro uses permanent credits only. Bonus credits are for Sora Preview and Veo Fast. This helps us maintain service quality and cashflow.',
  },
  {
    q: 'What happens if a render fails?',
    a: 'Failed renders are credited back automatically.',
  },
  {
    q: 'Which model should I use?',
    a: 'Use Sora for drafts and iteration. Use Veo Fast for quick quality upgrades. Use Veo Pro for the final export.',
  },
  {
    q: 'Is there a daily limit?',
    a: 'Starter includes daily limits to keep the service reliable for everyone. Paid packs have higher limits and priority.',
  },
]

interface HomePageClientProps {
  userProfile: UserProfile | null
}

interface HomepageSettings {
  hero_badge_text: string
  hero_h1_text: string
  hero_h1_text_logged_in: string
  hero_description: string
  hero_image_paths: string[]
  hero_image_alt_texts: string[]
  hero_video_paths: string[]
  theme_style: string
  primary_color: string
  secondary_color: string
  accent_color: string
  background_gradient: string
  cta_primary_text: string
  cta_primary_text_logged_out: string
  cta_secondary_text: string
}

export default function HomePageClient({ userProfile }: HomePageClientProps) {
  const router = useRouter()
  // 避免 Hero A/B & emoji 导致 hydration mismatch：
  // 首次渲染（服务端/客户端）都不渲染 Hero，挂载后再显示
  const [heroMounted, setHeroMounted] = useState(false)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const [hydratedProfile, setHydratedProfile] = useState<UserProfile | null>(userProfile)
  const [, setStats] = useState<Stats | null>(null)
  const [credits, setCredits] = useState<number>(userProfile?.credits || 0)
  const [, setWalletInfo] = useState<{
    permanentCredits: number
    bonusCredits: number
    bonusExpiresAt: string | null
    totalAvailable: number
  } | null>(null)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [imagesReady, setImagesReady] = useState(false)
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null)
  const [homepageSettings, setHomepageSettings] = useState<HomepageSettings | null>(null)
  const [paymentPlans, setPaymentPlans] = useState<Array<{
    id: string
    plan_name: string
    plan_type: string
    amount: number
    currency: string
    credits: number
    videos: number
    description: string | null
    badge_text: string | null
    stripe_buy_button_id: string | null
    stripe_payment_link_id: string | null
    is_active: boolean
    is_recommended: boolean
    display_order: number
  }>>([])
  const [hasRechargeRecords, setHasRechargeRecords] = useState<boolean | null>(null)
  const imageSectionRef = useRef<HTMLDivElement | null>(null)
  const accountProfile = hydratedProfile ?? userProfile

  useEffect(() => {
    setHeroMounted(true)
  }, [])

  // Phase 2D: home_view（每次首页进入只打一次）
  useEffect(() => {
    Events.homeView(accountProfile?.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Map planId to payment plan for checkout
  const getPaymentPlanByPlanId = (planId: PlanId) => {
    const planConfig = PRICING_CONFIG.plans[planId]
    if (!planConfig) return null
    
    // Find matching payment plan by amount (with some tolerance for floating point)
    const amount = planConfig.priceUsd
    return paymentPlans.find((p) => Math.abs(p.amount - amount) < 0.01) ?? null
  }

  // Handle checkout from pricing cards
  const handlePricingCheckout = async (planId: PlanId) => {
    const plan = getPaymentPlanByPlanId(planId)
    if (!plan) {
      console.error('Payment plan not found for planId:', planId)
      alert('Payment plan not available. Please try again later.')
      return
    }
    await startPaymentLinkCheckout(plan)
  }

  // Check recharge records for new users（传 Authorization 以免服务端从 cookie 取不到 session 导致 401）
  useEffect(() => {
    if (!hydratedProfile || hasRechargeRecords !== null || !supabase) return
    const client = supabase

    async function run() {
      try {
        const { data: { session } } = await client.auth.getSession()
        const headers: Record<string, string> = session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}
        const res = await fetch('/api/payment/recharge-records', { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            const hasRecords = data.records && data.records.length > 0
            setHasRechargeRecords(hasRecords)
          }
        }
      } catch (error) {
        console.error('Failed to check recharge records:', error)
        setHasRechargeRecords(false) // Default to false on error
      }
    }

    run()
  }, [hydratedProfile, hasRechargeRecords, supabase])

  const startPaymentLinkCheckout = async (plan: (typeof paymentPlans)[number]) => {
    const returnTo = '/#pricing-plans'

    // Check actual auth status, not just hydratedProfile (which may be stale after login)
    let isAuthenticated = false
    if (supabase) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        isAuthenticated = !!session?.user
      } catch (err) {
        console.error('Failed to check auth status:', err)
      }
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated && !hydratedProfile) {
      setPostLoginRedirect(returnTo)
      router.push(`/login?redirect=${encodeURIComponent(returnTo)}`)
      return
    }

    try {
      // 获取认证头和 device_id
      const authHeaders = await getAuthHeaders()
      
      // 获取 device_id（用于风控）
      let deviceId: string | undefined;
      try {
        if (typeof window !== 'undefined') {
          const { getOrCreateDeviceId } = await import('@/lib/risk/deviceId');
          deviceId = getOrCreateDeviceId();
        }
      } catch (err) {
        console.warn('Failed to get device ID:', err);
      }
      
      console.log('[Checkout] Starting checkout for plan:', plan.id, {
        hasAuth: !!authHeaders.Authorization,
        isAuthenticated,
        hasHydratedProfile: !!hydratedProfile,
        deviceId: deviceId?.substring(0, 20) || 'none',
      })
      
      // 使用新的 Checkout Session API（支持 device_id）
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders, // 添加认证头
        },
        body: JSON.stringify({ planId: plan.id, deviceId }),
      })
      
      console.log('[Checkout] API response status:', res.status)
      const json = await res.json()
      console.log('[Checkout] API response:', json)

      if (res.status === 401) {
        console.error('[Checkout] 401 Unauthorized - Authentication failed', {
          planId: plan.id,
          hasAuthHeader: !!authHeaders.Authorization,
          authHeaderLength: authHeaders.Authorization?.length || 0,
          error: json.error || 'Unknown error',
        })
        
        // 防止无限循环
        const redirectKey = 'payment_checkout_redirect_attempt'
        const redirectAttempt = sessionStorage.getItem(redirectKey)
        const now = Date.now()
        
        if (redirectAttempt) {
          const lastAttempt = parseInt(redirectAttempt, 10)
          if (now - lastAttempt < 10000) { // 增加到 10 秒
            console.error('[Checkout] 检测到无限循环，停止重定向', {
              lastAttempt,
              now,
              diff: now - lastAttempt,
            })
            alert('Login status error. Please refresh the page and try again.')
            return
          }
        }
        
        // 尝试刷新认证状态
        if (supabase) {
          try {
            const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession()
            console.log('[Checkout] Refreshing auth session', {
              hasSession: !!newSession,
              hasUser: !!newSession?.user,
              error: sessionError,
            })
            
            if (newSession?.user) {
              // 认证状态已更新，重试一次
              sessionStorage.removeItem(redirectKey)
              // 重新调用（但限制递归深度）
              const retryKey = 'payment_checkout_retry'
              if (!sessionStorage.getItem(retryKey)) {
                console.log('[Checkout] Retrying checkout with refreshed session')
                sessionStorage.setItem(retryKey, '1')
                setTimeout(() => {
                  sessionStorage.removeItem(retryKey)
                  startPaymentLinkCheckout(plan)
                }, 500)
                return
              }
            }
          } catch (refreshErr) {
            console.error('[Checkout] Failed to refresh auth:', refreshErr)
          }
        }
        
        sessionStorage.setItem(redirectKey, now.toString())
        setPostLoginRedirect(returnTo)
        router.push(`/login?redirect=${encodeURIComponent(returnTo)}`)
        return
      }
      
      // 清除重定向尝试记录（成功时）
      sessionStorage.removeItem('payment_checkout_redirect_attempt')
      sessionStorage.removeItem('payment_checkout_retry')

      if (!res.ok) {
        console.error('[Checkout] API returned error', {
          status: res.status,
          ok: res.ok,
          error: json?.error,
          message: json?.message,
        })
        throw new Error(json?.error || json?.message || 'Failed to start checkout')
      }

      if (json?.url) {
        console.log('[Checkout] Success! Redirecting to Stripe Checkout', {
          url: json.url,
        })
        window.location.href = json.url
        return
      }

      console.error('[Checkout] Missing url in response', json)
      throw new Error('Missing checkout URL')
    } catch (e) {
      console.error('[Checkout] Checkout failed with exception', {
        error: e,
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : undefined,
        planId: plan.id,
      })
      // 清除重定向尝试记录（错误时）
      sessionStorage.removeItem('payment_checkout_redirect_attempt')
      sessionStorage.removeItem('payment_checkout_retry')
      alert(e instanceof Error ? e.message : 'Checkout failed. Please try again.')
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setSupabase(createClient())
  }, [])

  // Allow deep links like "/?pricing=1&redirect=/video?prompt=..." to open the recharge modal
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const params = new URLSearchParams(window.location.search)
      const shouldOpenPricing = params.get('pricing') === '1'
      const redirect = params.get('redirect')

      if (redirect) {
        setPostLoginRedirect(redirect)
      }

      if (shouldOpenPricing) {
        setShowPricingModal(true)
        // prevent re-opening on refresh
        params.delete('pricing')
        const newQuery = params.toString()
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash || ''}`
        window.history.replaceState({}, '', newUrl)
      }
    } catch {
      // ignore
    }
  }, [])

  // Load homepage settings and payment plans
  useEffect(() => {
    const loadData = async () => {
      try {
        // Add a timestamp to bypass browser caches
        const timestamp = Date.now()
        const [settingsResponse, plansResponse] = await Promise.all([
          fetch(`/api/homepage?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          }),
          fetch(`/api/payment-plans?t=${timestamp}`, { cache: 'no-store' }),
        ])
        
        const settingsData = await settingsResponse.json()
        if (settingsData.success && settingsData.settings) {
          console.log('[Homepage Settings] Loaded:', {
            theme_style: settingsData.settings.theme_style,
            image_count: settingsData.settings.hero_image_paths?.length || 0,
            image_paths: settingsData.settings.hero_image_paths,
          })
          setHomepageSettings(settingsData.settings)
        }

        const plansData = await plansResponse.json()
        if (plansData.success && plansData.plans) {
          setPaymentPlans(plansData.plans)
        }
      } catch (error) {
        console.error('Failed to load homepage settings:', error)
      }
    }
    loadData()
    
    // Refresh settings periodically (every 5 minutes)
    const refreshInterval = setInterval(() => {
      loadData()
    }, 5 * 60 * 1000) // 5分钟
    
    return () => clearInterval(refreshInterval)
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

  // Fetch wallet info (including bonus credits)
  useEffect(() => {
    if (!hydratedProfile || !supabase) {
      setWalletInfo(null)
      return
    }

    let isMounted = true

    const fetchWalletInfo = async () => {
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('/api/wallet', {
          headers,
        })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (!isMounted || !data?.success) {
          return
        }
        setWalletInfo(data.wallet)
        // Also update total credits
        if (data.wallet?.totalAvailable !== undefined) {
          setCredits(data.wallet.totalAvailable)
        }
      } catch (error) {
        console.error('Failed to fetch wallet info:', error)
      }
    }

    fetchWalletInfo()
    // Refresh wallet info every 30 seconds
    const interval = setInterval(fetchWalletInfo, 30000)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [hydratedProfile, supabase, getAuthHeaders])

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
        // Safely remove element, check if it's still in DOM
        try {
          if (textarea.isConnected && textarea.parentNode) {
            textarea.remove()
          }
        } catch (error) {
          // Silently fail if element is already removed
          console.debug('Failed to remove textarea (safe to ignore):', error)
        }
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
        { rootMargin: '400px' } // Increased from 200px to 400px for earlier loading
      )

      observer.observe(node)
      cleanupFunctions.push(() => observer.disconnect())
    }

    createObserver(imageSectionRef, setImagesReady)

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

  // NOTE: Currently unused; keep the computation for future UI.
  // const successRate =
  //   stats && typeof stats.succeeded === 'number'
  //     ? Math.round((stats.succeeded / Math.max(stats.total || 1, 1)) * 100)
  //     : null

  // 根据主题样式动态设置背景类
  const themeStyle = homepageSettings?.theme_style || 'cosmic'
  console.log('[Theme] Current style:', themeStyle, 'settings:', homepageSettings)
  
  const getThemeClasses = () => {
    switch (themeStyle) {
      case 'christmas':
        return {
          container: 'relative min-h-screen overflow-hidden text-white christmas-theme',
          bg: 'christmas-bg',
          glow: 'christmas-glow',
          decorations: ['christmas-snow', 'christmas-lights'],
        }
      case 'minimal':
        return {
          container: 'min-h-screen bg-white text-gray-900',
          bg: '',
          glow: '',
          decorations: [],
        }
      case 'modern':
        return {
          container: 'min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white',
          bg: '',
          glow: '',
          decorations: [],
        }
      case 'classic':
        return {
          container: 'min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900',
          bg: '',
          glow: '',
          decorations: [],
        }
      default: // cosmic
        return {
          container: 'relative min-h-screen overflow-hidden bg-[#050b18] text-white',
          bg: 'cosmic-space',
          glow: 'cosmic-glow',
          decorations: ['cosmic-stars', 'cosmic-noise'],
        }
    }
  }

  const themeClasses = getThemeClasses()

  return (
    <div className={themeClasses.container}>
      {themeClasses.bg && <div className={`${themeClasses.bg} absolute inset-0`} aria-hidden="true" />}
      {themeClasses.glow && <div className={`${themeClasses.glow} absolute inset-0`} aria-hidden="true" />}
      {themeClasses.decorations.map((decoration, index) => (
        <div key={index} className={`${decoration} absolute inset-0`} aria-hidden="true" />
      ))}
      <div className="relative z-10">
      {/* Navigation - V2.1 简化版：只保留 5 项 */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            {/* 左侧：Logo + 导航链接 */}
            <div className="flex items-center gap-6">
              <Link href="/" className="text-lg font-semibold text-[var(--text)]">
                Sora2Ai
              </Link>
              <div className="hidden md:flex items-center gap-5">
                {hydratedProfile ? (
                  <Link
                    href="/prompts"
                    className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                    rel="nofollow"
                  >
                    Prompts
                  </Link>
                ) : null}
                <Link
                  href={hydratedProfile ? '/video' : '/login'}
                  className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Generate
                </Link>
                <Link
                  href="#pricing-plans"
                  className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  href="/use-cases"
                  className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  Examples
                </Link>
                <Link
                  href="/enterprise"
                  className="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors"
                >
                  For Teams
                </Link>
              </div>
            </div>
            
            {/* 右侧：Credits + 登录 */}
            <div className="flex items-center gap-3">
              {hydratedProfile ? (
                <>
                  {/* Credits 显示 */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)]">
                    <span className="text-xs text-[var(--muted)]">Credits:</span>
                    <span className="text-sm font-semibold text-[var(--text)]">{credits}</span>
                  </div>
                  {/* 头像 */}
                  {hydratedProfile.avatar_url ? (
                    <img
                      src={hydratedProfile.avatar_url}
                      alt={hydratedProfile.name ?? 'User'}
                      className="h-8 w-8 rounded-full object-cover border border-[var(--border)]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-sm font-medium text-[var(--text)]">
                      {(hydratedProfile.name ?? hydratedProfile.email ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <LogoutButton />
                </>
              ) : (
                <LoginButton />
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========== SELL 区域：HeroV2 ========== */}
      {heroMounted ? (
        <HeroV2
          isLoggedIn={!!hydratedProfile}
          onGenerate={(prompt) => {
            router.push(`/video?prompt=${encodeURIComponent(prompt)}`)
          }}
        />
      ) : null}

      {/* ========== SHOW 区域 ========== */}
      <div className="cosmic-content">


        <main className="mx-auto max-w-7xl px-4 py-8 text-white sm:px-6 lg:px-8">

        {/* Logged-in: Scenario / Use Cases showcase (all links go to the hub page) */}
        {hydratedProfile && (
          <div className="mb-10">
            <Card className="!bg-white/5 border border-white/15 backdrop-blur-xl text-blue-50 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.9)]">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-white">Scenario Applications</CardTitle>
                    <p className="mt-2 text-sm text-blue-100/80">
                      Browse scenario inspirations. To keep navigation simple, every scenario entry links to the same hub page.
                    </p>
                  </div>
                  <Link href="/use-cases">
                    <Button variant="primary" size="sm">
                      Open Use Cases
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {USE_CASE_SHOWCASE.map((item) => (
                    <Link
                      key={item.title}
                      href="/use-cases"
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-energy-water hover:bg-white/10"
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-energy-water">{item.tag}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{item.title}</p>
                      <p className="mt-1 text-sm text-blue-100/80">{item.description}</p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

          <>
        {/* Pricing and Recharge Section */}
        <div className="mb-8">
          <Card className="!bg-white/5 border border-white/15 backdrop-blur-xl text-blue-50 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.9)]">
            <CardHeader>
              <CardTitle className="text-white">Pricing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-blue-100/80 mb-2">
                    <strong className="text-white">Video Generation Price:</strong>
                    <span className="font-semibold text-energy-water"> 10 credits/video</span>
                  </p>
                  <p className="text-xs text-blue-200/75">
                    【Watermark-free】OpenAI&apos;s latest Sora 2.0 model, official beta testing, pricing is tentative and may change in the future
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Image Carousel - Optimized for performance */}
        <div className="mb-8 space-y-6" ref={imageSectionRef}>
          {imagesReady && homepageSettings?.hero_image_paths && homepageSettings.hero_image_paths.length > 0 ? (
            <>
              {/* Top row: slide from right to left - Reduced to 2 sets for better performance */}
              <div className="overflow-hidden will-change-transform">
                <div className="flex gap-6 animate-slide-right" style={{ width: '200%' }}>
                  {/* First set */}
                  <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                    {homepageSettings.hero_image_paths.slice(0, Math.ceil(homepageSettings.hero_image_paths.length / 2)).map((path, index) => (
                      <div key={`top-${path}-${index}`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                        <R2Image
                          src={path}
                          alt={homepageSettings.hero_image_alt_texts?.[index] || `Image ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                          loading={index < 2 ? "eager" : "lazy"} // Load first 2 images eagerly for better initial experience
                        />
                      </div>
                    ))}
                  </div>
                  {/* Second set - duplicate for seamless loop */}
                  <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                    {homepageSettings.hero_image_paths.slice(0, Math.ceil(homepageSettings.hero_image_paths.length / 2)).map((path, index) => (
                      <div key={`top-dup-${path}-${index}`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                        <R2Image
                          src={path}
                          alt={homepageSettings.hero_image_alt_texts?.[index] || `Image ${index + 1}`}
                          className="w-full h-auto rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Bottom row: slide from left to right - Reduced to 2 sets for better performance */}
              <div className="overflow-hidden will-change-transform">
                <div className="flex gap-6 animate-slide-left" style={{ width: '200%' }}>
                  {/* First set */}
                  <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                    {homepageSettings.hero_image_paths.slice(Math.ceil(homepageSettings.hero_image_paths.length / 2)).map((path, index) => (
                      <div key={`bottom-${path}-${index}`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                        <R2Image
                          src={path}
                          alt={homepageSettings.hero_image_alt_texts?.[Math.ceil(homepageSettings.hero_image_paths.length / 2) + index] || `Image ${Math.ceil(homepageSettings.hero_image_paths.length / 2) + index + 1}`}
                          className="w-full h-auto rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                  {/* Second set - duplicate for seamless loop */}
                  <div className="flex gap-6 flex-shrink-0" style={{ width: '50%' }}>
                    {homepageSettings.hero_image_paths.slice(Math.ceil(homepageSettings.hero_image_paths.length / 2)).map((path, index) => (
                      <div key={`bottom-dup-${path}-${index}`} className="flex-shrink-0 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                        <R2Image
                          src={path}
                          alt={homepageSettings.hero_image_alt_texts?.[Math.ceil(homepageSettings.hero_image_paths.length / 2) + index] || `Image ${Math.ceil(homepageSettings.hero_image_paths.length / 2) + index + 1}`}
                          className="w-full h-auto rounded-lg"
                          loading="lazy"
                        />
                      </div>
                    ))}
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

        {/* Use Cases Section - For non-logged-in users */}
        {!hydratedProfile && (
          <section className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Built for Creators, Marketers, and Businesses</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {USE_CASES_FOR_VISITORS.map((useCase) => (
                <Link
                  key={useCase.title}
                  href={useCase.link}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-energy-water hover:bg-white/10"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                  <p className="text-sm text-blue-100/80">{useCase.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* How It Works Section */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">How It Works</h2>
            <p className="text-blue-100/80">Create professional videos in 4 simple steps</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-water text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-blue-100/80">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Prompt Templates and Feature Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-8 mt-10 items-start">
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
            <div className="space-y-6 w-full">
              {/* Features */}
              <Card className="w-full">
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

              {/* User Info */}
              <Card className="w-full">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  {!accountProfile && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Log in to sync your credits, track tasks, and access billing details.
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {accountProfile ? (
                    <>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {accountProfile.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Username
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {accountProfile.name || 'Not set'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Credits
                          </p>
                          <p className="text-sm font-semibold text-energy-water dark:text-energy-soft">
                            {credits}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Created At
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {accountProfile?.created_at ? formatDate(accountProfile.created_at) : '-'}
                          </p>
                        </div>
                      </div>
                      {accountProfile.last_login_at && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            Last Login
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {formatDate(accountProfile.last_login_at)}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Log in to view your account details, remaining credits, and recent video tasks.
                      </p>
                      <Link href="/login">
                        <Button type="button" variant="primary" size="sm" className="w-full">
                          Login / Sign up
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

        {/* Pricing Plans Section - Full pricing page content */}
        <div id="pricing-plans" className="mb-12 scroll-mt-24">
          {/* Phase 2C: 简化开场 */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-2">
              Simple prepaid credits.
            </h2>
            <p className="text-xl text-white/90 mb-4">
              Pay once. Use anytime.
            </p>
            <p className="text-base text-white/60">
              Most videos cost 10 credits. No subscriptions. No lock-in.
            </p>
          </div>

          {/* Pricing Cards - Phase 2C: 结果导向 */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <PlanCard
              planId="starter"
              title="Starter"
              price="$4.90"
              videoEstimate="~12 videos"
              badge="Try the workflow"
              bullets={[
                "120 bonus credits (7 days)",
                "Test with Sora + Veo Fast",
                "Daily limits keep service fair",
              ]}
              ctaLabel="Start with Starter"
              onCta={handlePricingCheckout}
              footnote="Most videos cost 10 credits."
            />

            <PlanCard
              planId="creator"
              title="Creator"
              price="$39"
              videoEstimate="~60 videos"
              badge="Recommended"
              bullets={[
                "600 permanent credits",
                "+60 bonus (30 days)",
                "Unlock Veo Pro",
                "Better limits + queue",
              ]}
              ctaLabel="Get Creator Pack"
              onCta={handlePricingCheckout}
              variant="primary"
              footnote="Most videos cost 10 credits."
            />

            <PlanCard
              planId="studio"
              title="Studio"
              price="$99"
              videoEstimate="~180 videos"
              badge="Best for Veo Pro"
              bullets={[
                "1,800 permanent credits",
                "+270 bonus (45 days)",
                "Priority queue",
                "For final exports",
              ]}
              ctaLabel="Get Studio Pack"
              onCta={handlePricingCheckout}
              footnote="Most videos cost 10 credits."
            />

            <PlanCard
              planId="pro"
              title="Pro"
              price="$299"
              videoEstimate="~600 videos"
              badge="Teams & heavy usage"
              bullets={[
                "6,000 permanent credits",
                "+1,200 bonus (60 days)",
                "Best value per credit",
                "Fastest queue",
              ]}
              ctaLabel="Get Pro Pack"
              onCta={handlePricingCheckout}
              footnote="Most videos cost 10 credits."
            />
          </div>

          {/* Credit Usage Table */}
          <div className="mb-10">
            <CreditUsageTable config={{
              currency: PRICING_CONFIG.currency,
              soraCreditsPerRender: PRICING_CONFIG.modelCosts.sora,
              veoFlashCreditsPerRender: PRICING_CONFIG.modelCosts.veo_fast,
              veoProCreditsPerRender: PRICING_CONFIG.modelCosts.veo_pro,
            }} />
          </div>

          {/* Phase 2C: 风险反转文案 */}
          <div className="mb-10 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center items-center text-center">
              <div className="flex items-center gap-2 text-green-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Unused credits never expire</span>
              </div>
              <div className="flex items-center gap-2 text-green-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium">Failed generations refunded automatically</span>
              </div>
            </div>
          </div>

          {/* Workflow Section */}
          <div className="mb-10 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
            <div className="text-lg font-semibold text-white mb-3">A workflow you can scale</div>
            <div className="grid gap-3 text-sm text-white/80 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Step 1: Draft with Sora</div>
                <p className="mt-1 text-white/70">Iterate fast and explore ideas.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="font-semibold text-white">Step 2: Finalize with Veo Pro</div>
                <p className="mt-1 text-white/70">Upgrade the version you ship.</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/60">
              You don&apos;t need Veo Pro for every render — only for the final cut.
            </p>
          </div>

          {/* FAQ Section */}
          <div className="mb-6">
            <FAQAccordion items={PRICING_FAQ_ITEMS} />
          </div>
        </div>


        {/* Final CTA Section */}
        <section className="mb-12 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Start Creating AI Videos Today</h2>
            <Link href={hydratedProfile ? '/video' : '/login'}>
              <Button variant="primary" size="lg" className="shadow-energy-focus">
                Generate Your First Video Free
              </Button>
            </Link>
          </div>
        </section>

        {/* ========== EXPLAIN 区域：SEO 长文（折叠） ========== */}
        <section id="seo-content" className="mb-12">
          <details className="card p-6">
            <summary className="cursor-pointer text-sm font-medium text-[var(--muted)] hover:text-[var(--text)] transition-colors list-none flex items-center gap-2">
              <svg className="w-4 h-4 transition-transform details-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Read more about Sora2 AI video generation
            </summary>
            
            <div className="mt-6 space-y-6 text-sm text-[var(--muted)] leading-relaxed">
              <div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  Best Sora Alternatives for AI Video Generation
                </h3>
                <p>
                  Looking for the best Sora alternatives? Our platform is one of the top text-to-video AI tools that 
                  creates stunning, professional-quality videos from text prompts in seconds. Whether you&apos;re 
                  creating marketing content, social media videos, educational materials, or creative projects, we 
                  make AI video generation accessible to everyone, regardless of technical expertise.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  How Our Text-to-Video AI Works
                </h3>
                <p>
                  As a leading Sora alternative, we offer 30 free credits when you sign up - no credit card required. 
                  Our platform supports various video styles including cinematic shots, documentary footage, fashion 
                  content, nature scenes, sports highlights, and abstract visuals. Each video is generated using 
                  advanced AI technology to ensure high quality and creative results that match your vision.
                </p>
                <p className="mt-3">
                  Our text-to-video AI generator process is simple: enter a detailed text description of the video 
                  you want to create, select your preferred aspect ratio and duration, and let our AI do the rest. 
                  The platform supports both portrait (9:16) and landscape (16:9) formats, with video durations of 
                  10 or 15 seconds. All videos are generated in high quality and can be downloaded immediately after 
                  completion.
                </p>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  Why Choose Our Sora Alternative?
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Free AI video generator - Get started with 30 free credits</li>
                  <li>Text-to-video AI technology comparable to OpenAI Sora</li>
                  <li>Multiple video styles and categories</li>
                  <li>Fast generation times, typically completed in minutes</li>
                  <li>High-quality output suitable for professional use</li>
                  <li>Easy-to-use interface with prompt templates</li>
                  <li>Flexible pricing plans with credit-based system</li>
                  <li>No watermark on generated videos</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  Compare Sora Alternatives
                </h3>
                <p>
                  When comparing Sora alternatives like Runway, Pika, Luma, and our platform, we stand out with our 
                  user-friendly interface, competitive pricing, and high-quality output. Our free tier makes it easy 
                  to get started, and our credit system ensures you only pay for what you use.
                </p>
              </div>
              
              <div className="pt-4 border-t border-[var(--border)]">
                <h3 className="text-base font-semibold text-[var(--text)] mb-2">
                  Data Usage Transparency
                </h3>
                <p>
                  We use Google Sign-In to securely authenticate your account. We only request your email address 
                  and basic profile information (name, profile picture) to create your account and provide 
                  personalized video generation services. Your data is encrypted and stored securely. For more 
                  information, please review our{' '}
                  <Link href="/privacy" className="underline underline-offset-2 hover:text-[var(--text)]">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>
          </details>
        </section>
          </>
      </main>
      </div>

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
    </div>
  )
}

