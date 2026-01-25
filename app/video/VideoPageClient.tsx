'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LogoutButton from '@/components/LogoutButton'
import VeoProRecommendation from '@/components/VeoProRecommendation'
import SoraToVeoGuide from '@/components/SoraToVeoGuide'
import VeoUpgradeNudge from '@/components/growth/VeoUpgradeNudge'
import { UpgradeNudge } from '@/components/upsell/UpgradeNudge'
import { createClient } from '@/lib/supabase/client'
import { setPostLoginRedirect } from '@/lib/auth/post-login-redirect'
import { Events } from '@/lib/analytics/events'

type ViolationType = 'input_moderation' | 'output_moderation' | 'third_party'

interface VideoResult {
  task_id: string
  status: 'processing' | 'succeeded' | 'failed'
  progress?: number
  video_url?: string
  remove_watermark?: boolean
  pid?: string
  error?: string
  prompt?: string
  violationType?: ViolationType
}

const VIOLATION_GUIDANCE: Record<ViolationType, { headline: string; description: string; suggestions: string[] }> = {
  input_moderation: {
    headline: 'Prompt rejected by safety filters',
    description:
      'The text prompt contains violent, adult, hateful, or illegal content. Please rewrite your idea using neutral, policy-compliant language.',
    suggestions: [
      'Remove explicit, graphic, or hateful details',
      'Avoid requests related to weapons, drugs, or unlawful behavior',
      'Describe original characters or scenes instead of real people',
    ],
  },
  output_moderation: {
    headline: 'Generated output triggered guardrails',
    description:
      'The model stopped because the resulting video contained unsafe visuals (graphic violence, nudity, or other disallowed scenes). Try a simpler and safer description.',
    suggestions: [
      'Tone down graphic or shocking details',
      'Avoid referencing gore, injuries, or adult situations',
      'Focus on the creative mood or setting instead of intense actions',
    ],
  },
  third_party: {
    headline: 'Blocked by intellectual-property guardrails',
    description:
      'The request referenced real brands, celebrities, or copyrighted characters. Please use original names and fictional concepts.',
    suggestions: [
      'Invent fictional brands or characters',
      'Describe visual styles instead of specific franchises',
      'Avoid logos, trademarks, and protected artworks',
    ],
  },
}

const parseViolationType = (value?: string | null): ViolationType | undefined => {
  if (!value) {
    return undefined
  }
  if (value === 'input_moderation' || value === 'output_moderation' || value === 'third_party') {
    return value
  }
  return undefined
}

export default function VideoPageClient() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [prompt, setPrompt] = useState('')
  const [promptTouched, setPromptTouched] = useState(false)
  const [referenceUrl, setReferenceUrl] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [duration, setDuration] = useState<'10' | '15'>('10')
  // size parameter removed, API only supports small, backend uses small fixed
  const [useWebhook, setUseWebhook] = useState(false)
  const [model, setModel] = useState<'sora-2' | 'veo-flash' | 'veo-pro'>('sora-2')
  const [generationMode, setGenerationMode] = useState<'single' | 'batch'>('single')
  const [batchPrompts, setBatchPrompts] = useState('')
  const [batchModel, setBatchModel] = useState<'sora-2' | 'veo-flash' | 'veo-pro'>('sora-2')
  const [batchAspectRatio, setBatchAspectRatio] = useState<'16:9' | '9:16'>('16:9')
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResult, setBatchResult] = useState<{
    ok: boolean;
    batch_id?: string;
    total_count?: number;
    credits_frozen?: number;
    message?: string;
    error?: string;
  } | null>(null)
  const [firstFrameUrl, setFirstFrameUrl] = useState('')
  const [lastFrameUrl, setLastFrameUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<VideoResult | null>(null)
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('') // Save current prompt
  const [credits, setCredits] = useState<number | null>(null)
  const [hasRechargeRecords, setHasRechargeRecords] = useState<boolean | null>(null)
  const [showNewUserBanner, setShowNewUserBanner] = useState(false)
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0) // Track retry count for Veo Pro recommendation
  const [showVeoProRecommendation, setShowVeoProRecommendation] = useState(false) // Show Veo Pro recommendation
  // Pixel-perfect (1:1) display: prevent upscaling beyond intrinsic resolution (adjusted for DPR)
  const [videoMaxCssWidth, setVideoMaxCssWidth] = useState<number | null>(null)
  const hasReadPromptFromUrl = useRef(false)
  const isMountedRef = useRef(true)
  
  // Image upload states
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Growth tracking states
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [timeOnResultSec, setTimeOnResultSec] = useState(0) // Track time spent viewing result
  const [didDownloadOrShare, setDidDownloadOrShare] = useState(false) // Track download/share actions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`) // Unique session ID
  const [soraGenerationsSession, setSoraGenerationsSession] = useState(0) // Track Sora generations in this session
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [userId, setUserId] = useState<string | undefined>(undefined) // User ID for tracking
  const [soraRenders7d, setSoraRenders7d] = useState(0) // Approximate Sora usage for triggers
  const [remixSamePrompt24h, setRemixSamePrompt24h] = useState(0) // Approximate remix count for same prompt
  const lastSubmittedPromptRef = useRef<string | null>(null)
  const hasTrackedEnterRef = useRef(false)
  const generationStartMsRef = useRef<number | null>(null)
  const trackedResultTaskIdsRef = useRef<Set<string>>(new Set())
  const [userEntitlements, setUserEntitlements] = useState<{
    planId: string;
    veoProEnabled: boolean;
  } | null>(null)

  const MIN_PROMPT_LENGTH = 5
  const cleanedPrompt = prompt
    .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
    .replace(/\s+/g, ' ')
    .trim()

  const promptValidationMessage =
    promptTouched && (!cleanedPrompt || cleanedPrompt.length < MIN_PROMPT_LENGTH)
      ? `Please enter at least ${MIN_PROMPT_LENGTH} characters (currently ${cleanedPrompt.length}).`
      : null

  const canSubmit = !!supabase && !loading && !!cleanedPrompt && cleanedPrompt.length >= MIN_PROMPT_LENGTH

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const client = createClient()
    setSupabase(client)
    isMountedRef.current = true
    
    // Get user ID for tracking
    client.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id)
      }
    }).catch(() => {
      // Ignore errors
    })
    
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Phase 2: video_page_enter (track once)
  useEffect(() => {
    if (hasTrackedEnterRef.current) return
    hasTrackedEnterRef.current = true
    const fromHero = !!searchParams.get('prompt')
    Events.videoPageEnter(userId, fromHero)
  }, [searchParams, userId])

  // Phase 2: generation_success / generation_failed (dedupe by task_id)
  useEffect(() => {
    const taskId = currentResult?.task_id
    const status = currentResult?.status
    if (!taskId || !status) return
    if (trackedResultTaskIdsRef.current.has(taskId)) return

    if (status === 'succeeded') {
      trackedResultTaskIdsRef.current.add(taskId)
      const durationMs = generationStartMsRef.current ? Date.now() - generationStartMsRef.current : undefined
      Events.generationSuccess(userId, model, durationMs)
    }
    if (status === 'failed') {
      trackedResultTaskIdsRef.current.add(taskId)
      Events.generationFailed(userId, currentResult?.error)
    }
  }, [currentResult?.status, currentResult?.task_id, currentResult?.error, model, userId])


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

  // Fetch user entitlements
  useEffect(() => {
    if (!supabase || !isMountedRef.current) {
      return
    }

    async function fetchEntitlements() {
      try {
        const headers = await getAuthHeaders()
        const res = await fetch('/api/user/entitlements', { headers })
        if (res.ok) {
          const data = await res.json()
          if (data.success && data.entitlements) {
            setUserEntitlements({
              planId: data.entitlements.planId || 'free',
              veoProEnabled: data.entitlements.veoProEnabled || false,
            })
          }
        }
      } catch (error) {
        console.error('Failed to fetch entitlements:', error)
      }
    }

    fetchEntitlements()
  }, [supabase, getAuthHeaders])

  // Fetch credits with retry logic
  useEffect(() => {
    if (!supabase || !isMountedRef.current) {
      return
    }

    const MAX_RETRIES = 3
    const BASE_DELAY = 1000 // 1 second

    async function fetchCredits(retryAttempt = 0): Promise<void> {
      if (!isMountedRef.current) return
      
      try {
        // Create abort controller for timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout
        
        const response = await fetch('/api/stats', {
          headers: await getAuthHeaders(),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // Check again after async operation
        if (!isMountedRef.current) return
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.credits !== undefined && isMountedRef.current) {
            setCredits(data.credits)
          }
        } else if (response.status >= 500 && retryAttempt < MAX_RETRIES) {
          // Retry on server errors
          const delay = BASE_DELAY * Math.pow(2, retryAttempt)
          console.warn(`[VideoPage] Stats API returned ${response.status}, retrying in ${delay}ms...`)
          setTimeout(() => fetchCredits(retryAttempt + 1), delay)
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[VideoPage] Stats API request timeout')
        } else if (retryAttempt < MAX_RETRIES) {
          // Retry on network errors
          const delay = BASE_DELAY * Math.pow(2, retryAttempt)
          console.warn(`[VideoPage] Failed to fetch credits, retrying in ${delay}ms...`, error)
          setTimeout(() => fetchCredits(retryAttempt + 1), delay)
        } else {
          console.error('Failed to fetch credits after retries:', error)
        }
      }
    }
    
    fetchCredits()
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        fetchCredits()
      } else {
        clearInterval(interval)
      }
    }, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [getAuthHeaders, supabase])

  // Check recharge records to determine if user is new
  useEffect(() => {
    if (!supabase || !isMountedRef.current) return

    async function checkRechargeRecords() {
      try {
        const headers = await getAuthHeaders()
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
      }
    }

    checkRechargeRecords()
  }, [supabase, getAuthHeaders])

  // Determine if should show new user banner
  useEffect(() => {
    if (credits !== null && hasRechargeRecords !== null) {
      const shouldShow = !hasRechargeRecords && credits <= 30
      setShowNewUserBanner(shouldShow)
    }
  }, [credits, hasRechargeRecords])

  // Read prompt from URL query parameter (only once)
  useEffect(() => {
    if (hasReadPromptFromUrl.current || !isMountedRef.current) return
    
    const promptParam = searchParams.get('prompt')
    if (promptParam) {
      // Next.js useSearchParams().get() already decodes the URL parameter
      // No need to call decodeURIComponent again, which would cause double-decoding and garbled text
      
      // Clean the prompt: remove duplicated prefix and extra spaces
      const cleanedPrompt = promptParam
        .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
        .replace(/\s+/g, ' ')
        .trim()
      
      setPrompt(cleanedPrompt)
      // Mark as touched so validation is visible if the URL prompt is too short
      setPromptTouched(true)
      hasReadPromptFromUrl.current = true
      
      // Clear the URL parameter after reading, but delay to avoid DOM conflicts during navigation
      // Use setTimeout to ensure the component is fully mounted and React reconciliation is complete
      const timeoutId = setTimeout(() => {
        if (!isMountedRef.current) return
        
        try {
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete('prompt')
          // Use window.history.replaceState instead of router.replace to avoid React reconciliation conflicts
          window.history.replaceState(
            { ...window.history.state, as: newUrl.pathname + newUrl.search, url: newUrl.pathname + newUrl.search },
            '',
            newUrl.pathname + newUrl.search
          )
        } catch (error) {
          // Silently fail if URL manipulation fails (e.g., during navigation)
          console.debug('[VideoPage] Failed to update URL (safe to ignore):', error)
        }
      }, 100) // Small delay to ensure DOM is stable
      
      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [searchParams, router])

  // Poll task status
  useEffect(() => {
    if (!pollingTaskId || !isMountedRef.current) return

    let consecutiveErrors = 0
    const MAX_CONSECUTIVE_ERRORS = 5 // Allow up to 5 consecutive errors
    const POLLING_INTERVAL = 3000 // Poll every 3 seconds

    const interval = setInterval(async () => {
      // Check if component is still mounted before making updates
      if (!isMountedRef.current) {
        clearInterval(interval)
        return
      }
      
      try {
        console.log('[VideoPage] 🔍 Polling task status:', { taskId: pollingTaskId })
        
        // Use AbortController for request timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
        
        let response: Response
        try {
          response = await fetch(`/api/video/result/${pollingTaskId}`, {
            headers: await getAuthHeaders(),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          
          // Handle network errors
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            console.warn('[VideoPage] ⚠️ Polling request timeout:', { taskId: pollingTaskId })
            consecutiveErrors++
          } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
            console.warn('[VideoPage] ⚠️ Network error during polling:', { 
              taskId: pollingTaskId,
              error: fetchError.message 
            })
            consecutiveErrors++
          } else {
            console.error('[VideoPage] ❌ Unexpected error during polling:', {
              taskId: pollingTaskId,
              error: fetchError instanceof Error ? fetchError.message : String(fetchError)
            })
            consecutiveErrors++
          }
          
          // Stop polling after too many consecutive errors and surface a friendly error
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            console.error('[VideoPage] ❌ Too many consecutive polling errors, stopping:', {
              taskId: pollingTaskId,
              consecutiveErrors
            })
            clearInterval(interval)
            if (isMountedRef.current) {
              setCurrentResult(prev => ({
                ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
                task_id: pollingTaskId,
                status: 'failed',
                error: 'Network connection error. Please check your internet connection and try refreshing the page.',
                prompt: prev?.prompt || currentPrompt,
              }))
              setPollingTaskId(null)
            }
          }
          return
        }
        
        // Check again after async operation
        if (!isMountedRef.current) {
          clearInterval(interval)
          return
        }
        
        // Reset consecutive error counter
        consecutiveErrors = 0
        
        console.log('[VideoPage] 📥 Polling response:', {
          taskId: pollingTaskId,
          status: response.status,
          ok: response.ok,
        })
        
        // Check response status
        if (!response.ok) {
          console.error('[VideoPage] ❌ Polling response not OK:', {
            taskId: pollingTaskId,
            status: response.status,
            statusText: response.statusText,
          })
          
          // 404: task might not exist
          if (response.status === 404) {
            clearInterval(interval)
            if (isMountedRef.current) {
              setCurrentResult(prev => ({
                ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
                task_id: pollingTaskId,
                status: 'failed',
                error: 'Task not found. Please try generating a new video.',
                prompt: prev?.prompt || currentPrompt,
              }))
              setPollingTaskId(null)
            }
            return
          }
          
          // Other errors: keep retrying but increase the error counter
          consecutiveErrors++
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            clearInterval(interval)
            if (isMountedRef.current) {
              setCurrentResult(prev => ({
                ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
                task_id: pollingTaskId,
                status: 'failed',
                error: `Server error (${response.status}). Please try again later.`,
                prompt: prev?.prompt || currentPrompt,
              }))
              setPollingTaskId(null)
            }
          }
          return
        }
        
        const data = await response.json()
        console.log('[VideoPage] 📦 Polling data:', {
          taskId: pollingTaskId,
          success: data.success,
          status: data.status,
          progress: data.progress,
          hasVideoUrl: !!data.video_url,
          hasError: !!data.error,
          error: data.error,
          violationType: data.violation_type,
        })
        
        // Check again before state updates
        if (!isMountedRef.current) {
          clearInterval(interval)
          return
        }
        
        if (data.success) {
          setCurrentResult(prev => ({
            ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
            task_id: pollingTaskId,
            status: data.status,
            progress: data.progress,
            video_url: data.video_url,
            remove_watermark: data.remove_watermark,
            pid: data.pid,
            prompt: prev?.prompt || currentPrompt, // Keep original prompt
            error: undefined,
            violationType: undefined,
          }))

          // If task completed, stop polling
          if (data.status === 'succeeded' || data.status === 'failed') {
            console.log('[VideoPage] ✅ Polling completed:', {
              taskId: pollingTaskId,
              finalStatus: data.status,
            })
            setPollingTaskId(null)
          }
        } else if (data.status === 'failed') {
          // Create a more user-friendly error message
          const errorMessage = data.error || data.details || 'Video generation failed'
          const friendlyError = errorMessage.includes('system error') || errorMessage.includes('temporary')
            ? 'The video generation service encountered a system error. This is usually temporary. Please try again in a few minutes. Your credits have been automatically refunded.'
            : errorMessage
          
          console.error('[VideoPage] ❌ Task failed during polling:', {
            taskId: pollingTaskId,
            error: errorMessage,
            friendlyError,
            violationType: data.violation_type,
            details: data.details,
            fullResponse: data,
          })
          
          if (isMountedRef.current) {
            setCurrentResult(prev => ({
              ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
              task_id: pollingTaskId,
              status: 'failed',
              error: friendlyError,
              progress: data.progress ?? prev?.progress,
              prompt: prev?.prompt || currentPrompt,
              violationType: parseViolationType(data.violation_type),
            }))
            // Increment retry count and show Veo Pro recommendation for non-Veo Pro models
            if (model !== 'veo-pro') {
              setRetryCount(prev => prev + 1)
              setShowVeoProRecommendation(true)
            }
            setPollingTaskId(null)
          }
        }
      } catch (error) {
        // Handle JSON parsing errors or other unexpected errors
        console.error(`[VideoPage] ❌ Failed to poll task ${pollingTaskId}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          taskId: pollingTaskId,
        })
        
        consecutiveErrors++
        
        // Stop polling after too many consecutive errors
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          console.error('[VideoPage] ❌ Too many consecutive errors, stopping polling:', {
            taskId: pollingTaskId,
            consecutiveErrors
          })
          clearInterval(interval)
          if (isMountedRef.current) {
            setCurrentResult(prev => ({
              ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
              task_id: pollingTaskId,
              status: 'failed',
              error: 'Failed to check task status. Please refresh the page and try again.',
              prompt: prev?.prompt || currentPrompt,
            }))
            setPollingTaskId(null)
          }
        }
      }
    }, POLLING_INTERVAL) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [pollingTaskId, currentPrompt, getAuthHeaders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reset retry count and recommendation on new submission
    setRetryCount(0)
    setShowVeoProRecommendation(false)
    setTimeOnResultSec(0)
    setDidDownloadOrShare(false)
    
    // Increment Sora generation count if using Sora
    if (model === 'sora-2') {
      setSoraGenerationsSession(prev => prev + 1)
      setSoraRenders7d(prev => prev + 1)
      
      // Track remix count for same prompt (approximation for 24h window)
      const current = cleanedPrompt
      if (lastSubmittedPromptRef.current && lastSubmittedPromptRef.current === current) {
        setRemixSamePrompt24h(prev => prev + 1)
      } else {
        setRemixSamePrompt24h(1)
        lastSubmittedPromptRef.current = current
      }
    }
    
    if (!supabase) {
      console.error('[VideoPage] ❌ Supabase client not initialized')
      return
    }
    setLoading(true)
    generationStartMsRef.current = Date.now()
    Events.generationStarted(userId, model)

    try {
      // Make validation obvious and avoid popping blocking alerts.
      setPromptTouched(true)
      
      // Validate cleaned prompt
      if (!cleanedPrompt || cleanedPrompt.length < MIN_PROMPT_LENGTH) {
        console.warn('[VideoPage] ⚠️ Prompt too short:', {
          cleanedLength: cleanedPrompt.length,
          minLength: MIN_PROMPT_LENGTH,
        })
        setLoading(false)
        return
      }
      
      const requestBody: Record<string, unknown> = {
        prompt: cleanedPrompt,
        aspectRatio,
        useWebhook,
        model,
      }
      
      // Add model-specific parameters
      if (model === 'sora-2') {
        requestBody.url = referenceUrl || undefined
        requestBody.duration = duration
      } else {
        // Veo models
        if (firstFrameUrl) requestBody.firstFrameUrl = firstFrameUrl
        if (lastFrameUrl) requestBody.lastFrameUrl = lastFrameUrl
        if (referenceUrl) {
          // For Veo, reference image goes into urls array
          requestBody.urls = [referenceUrl]
        }
      }
      
      console.log('[VideoPage] 📤 Starting video generation request:', {
        prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        hasReferenceUrl: !!referenceUrl,
        aspectRatio,
        duration,
        useWebhook,
      })

      const authHeaders = await getAuthHeaders()
      
      // Use AbortController for request timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout
      
      let response: Response
      try {
        response = await fetch('/api/video/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            ...authHeaders,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // Handle network errors
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('[VideoPage] ❌ Request timeout:', { error: 'Request took too long' })
          alert('Request timeout. Please check your network connection and try again.')
          setLoading(false)
          return
        } else if (fetchError instanceof TypeError && fetchError.message.includes('Failed to fetch')) {
          console.error('[VideoPage] ❌ Network error:', { error: fetchError.message })
          alert('Network error. Please check your internet connection and try again.')
          setLoading(false)
          return
        } else {
          console.error('[VideoPage] ❌ Unexpected error:', { error: fetchError })
          alert('An unexpected error occurred. Please try again.')
          setLoading(false)
          return
        }
      }

      console.log('[VideoPage] 📥 Received response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (response.status === 401) {
        console.warn('[VideoPage] ⚠️ Unauthorized (401), redirecting to login')
        const intended =
          typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
        setPostLoginRedirect(intended)
        router.push(`/login?redirect=${encodeURIComponent(intended)}`)
        return
      }

      const data = await response.json()
      console.log('[VideoPage] 📦 Response data:', {
        success: data.success,
        status: data.status,
        hasError: !!data.error,
        error: data.error,
        details: data.details,
        taskId: data.task_id,
        violationType: data.violation_type,
      })

      const violationTypeFromResponse = parseViolationType(data.violation_type)

      if (data.success) {
        // Refresh credits after successful generation
        const statsResponse = await fetch('/api/stats', {
          headers: await getAuthHeaders(),
        })
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          if (statsData.success && statsData.credits !== undefined) {
            setCredits(statsData.credits)
          }
        }

        // Save current prompt
        const submittedPrompt = prompt
        
        // If completed immediately, show result directly
        if (data.status === 'succeeded' && data.video_url) {
          console.log('[VideoPage] ✅ Video generation completed immediately:', {
            taskId: data.task_id,
            videoUrl: data.video_url,
          })
          setCurrentResult({
            task_id: data.task_id || '',
            status: 'succeeded',
            video_url: data.video_url,
            remove_watermark: data.remove_watermark,
            pid: data.pid,
            prompt: submittedPrompt,
            violationType: undefined,
          })
        } else if (data.status === 'processing' && data.task_id) {
          console.log('[VideoPage] 🔄 Video generation in progress, starting polling:', {
            taskId: data.task_id,
            progress: data.progress ?? 0,
          })
          // If processing, always start polling (webhook is only for server-side updates)
          setCurrentPrompt(submittedPrompt) // Save prompt for polling
          setCurrentResult({
            task_id: data.task_id,
            status: 'processing',
            progress: data.progress ?? 0,
            prompt: submittedPrompt,
            violationType: undefined,
          })
          setPollingTaskId(data.task_id)
        }

        // Reset form
        setPrompt('')
        setPromptTouched(false)
        setReferenceUrl('')
      } else {
        const errorMsg = data.error || 'Unknown error'
        const errorDetails = data.details || ''
        const technicalDetails = data.technicalDetails || ''
        
        console.error('[VideoPage] ❌ Video generation failed:', {
          error: errorMsg,
          details: errorDetails,
          technicalDetails: technicalDetails,
          status: data.status,
          taskId: data.task_id,
          violationType: violationTypeFromResponse,
          fullResponse: data,
        })
        
        let shouldClearResult = true

        if (errorMsg.includes('Insufficient credits') || errorMsg.includes('credits')) {
          console.warn('[VideoPage] ⚠️ Insufficient credits')
          const isNewUser = !hasRechargeRecords && credits !== null && credits <= 30
          const message = isNewUser
            ? `You're out of credits! Try the $4.9 starter pack (10 videos) or upgrade to larger packs. Current credits: ${credits || 0}.`
            : `Insufficient credits! Video generation requires 10 credits. Current credits: ${credits || 0}. Please recharge first.`
          alert(message)
          const intended =
            typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
          setPostLoginRedirect(intended)
          router.push(`/?pricing=1&redirect=${encodeURIComponent(intended)}`)
        } else if (errorMsg.includes('User not found')) {
          console.error('[VideoPage] ❌ User not found')
          alert(`User not found: ${errorDetails || 'Please try logging in again'}\n\nIf the problem persists, please contact support.`)
          // Optional: auto redirect to login page
          // router.push('/login')
        } else if (violationTypeFromResponse) {
          console.warn('[VideoPage] ⚠️ Content violation detected:', violationTypeFromResponse)
          setCurrentResult({
            task_id: data.task_id || '',
            status: 'failed',
            error: errorMsg,
            prompt,
            progress: data.progress ?? 0,
            violationType: violationTypeFromResponse,
          })
          shouldClearResult = false
        } else {
          // Log detailed error information to console
          console.error('[VideoPage] ❌ Generation failed - Full error details:', {
            errorMessage: errorMsg,
            errorDetails: errorDetails,
            technicalDetails: technicalDetails,
            httpStatus: response.status,
            responseData: data,
            requestBody: requestBody,
          })
          
          // Increment retry count and show Veo Pro recommendation for non-Veo Pro models
          if (model !== 'veo-pro') {
            setRetryCount(prev => prev + 1)
            setShowVeoProRecommendation(true)
          }
          
          alert(`Generation failed: ${errorMsg}${errorDetails ? '\n\n' + errorDetails : ''}`)
        }

        if (shouldClearResult) {
          setCurrentResult(null)
        }
      }
    } catch (error) {
      console.error('[VideoPage] ❌ Exception during video generation:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      })
      alert('Failed to generate video, please try again later')
    } finally {
      setLoading(false)
      console.log('[VideoPage] ✅ Video generation request completed (loading set to false)')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'processing':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Success'
      case 'failed':
        return 'Failed'
      case 'processing':
        return 'Processing'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!supabase) {
      alert('Please sign in first.')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP image.')
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File is too large. Maximum supported size is 10MB.')
      return
    }

    setUploadingImage(true)
    setUploadProgress(0)

    // Create temporary preview URL for immediate feedback
    const tempPreviewUrl = URL.createObjectURL(file)
    setPreviewImage(tempPreviewUrl)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'reference-images')

      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.status === 401) {
        alert('Unauthorized. Please sign in first.')
        const intended =
          typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
        setPostLoginRedirect(intended)
        router.push(`/login?redirect=${encodeURIComponent(intended)}`)
        // Clean up temp preview
        URL.revokeObjectURL(tempPreviewUrl)
        setPreviewImage(null)
        return
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed.')
      }

      // Set the uploaded image URL and use it as preview
      setReferenceUrl(data.file.url)
      setPreviewImage(data.file.url) // Use the uploaded URL as preview
      setUploadProgress(100)
      setImageError(false)
      
      // Clean up temporary preview URL
      URL.revokeObjectURL(tempPreviewUrl)
    } catch (error) {
      console.error('Image upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed. Please try again.')
      // Clean up temp preview on error
      URL.revokeObjectURL(tempPreviewUrl)
      setPreviewImage(null)
      setImageError(false)
    } finally {
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleImageUpload(files[0])
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle click to upload
  const handleClickUpload = () => {
    fileInputRef.current?.click()
  }

  const violationInfo =
    currentResult?.violationType ? VIOLATION_GUIDANCE[currentResult.violationType] : null

  return (
    <div className="relative min-h-screen overflow-hidden text-white bg-[#050b18]">
      <div className="cosmic-space absolute inset-0" aria-hidden="true" />
      <div className="cosmic-glow absolute inset-0" aria-hidden="true" />
      <div className="cosmic-stars absolute inset-0" aria-hidden="true" />
      <div className="cosmic-noise absolute inset-0" aria-hidden="true" />
      <div className="relative z-10 cosmic-content">
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-white"
              >
                Sora2Ai Videos
              </Link>
              <Link
                href="/video"
                className="text-sm font-medium text-energy-water"
              >
                Video Generation
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {credits !== null && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-energy-water-surface dark:bg-energy-water-muted">
                  <span className="text-sm font-medium text-energy-water dark:text-energy-soft">
                    Credits: {credits}
                  </span>
                </div>
              )}
              <Link
                href="/"
                className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/prompts"
                className="text-sm font-medium text-blue-100 transition-colors hover:text-white"
              >
                Prompts
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          {prompt && prompt.trim() ? (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">
                Create a Quick Video Preview
              </h1>
              <p className="text-lg text-blue-100/80 mb-4">
                Start with a fast visual draft to explore your idea.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-blue-100/70 mb-2">
                  <strong className="text-white">Video Concept:</strong> {prompt}
                </p>
                <p className="text-xs text-blue-100/50">
                  This page is dedicated to generating a video based on your specific prompt. Each video generated from this prompt will be unique, created using advanced AI technology.
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-white mb-2">
                Sora-2 Video Generation
              </h1>
              <p className="text-lg text-blue-100/80">
                Generate high-quality videos using OpenAI Sora 2.0 model
              </p>
            </>
          )}
        </div>

        {/* New User Starter Banner */}
        {showNewUserBanner && (
          <div className="mb-6 rounded-2xl border-2 border-energy-water/50 bg-gradient-to-r from-energy-water/20 via-energy-water/10 to-transparent p-6 shadow-[0_25px_80px_-45px_rgba(33,122,255,0.5)] backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  🎉 Get Started with 10 More AI Videos for $4.9
                </h3>
                <p className="text-blue-100/90 text-sm sm:text-base">
                  Perfect for new users! Get 100 credits (10 videos) with our starter pack. Try it now and continue creating amazing videos.
                </p>
              </div>
              <button
                onClick={() => {
                  const intended = typeof window !== 'undefined' ? window.location.href : '/video'
                  setPostLoginRedirect(intended)
                  router.push(`/#pricing-plans`)
                }}
                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-energy-water to-energy-water-deep px-6 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-energy-water focus:ring-offset-2 focus:ring-offset-transparent"
              >
                Go to Starter Pack →
              </button>
            </div>
          </div>
        )}

        {/* Generation Form - Display first, highest priority */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-white">
                {generationMode === 'single' 
                  ? (prompt && prompt.trim() ? 'Edit or generate a video' : 'Create a new generation')
                  : 'Batch generation'
                }
              </h2>
              {/* Mode Toggle */}
              <div className="flex rounded-lg bg-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setGenerationMode('single')}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                    generationMode === 'single'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Single
                </button>
                <button
                  type="button"
                  onClick={() => setGenerationMode('batch')}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-all ${
                    generationMode === 'batch'
                      ? 'bg-white/20 text-white'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Batch
                </button>
              </div>
            </div>
            {credits !== null && (
              <div className="text-sm text-blue-100/80">
                {model === 'sora-2' && (
                  <span className="text-blue-100/70">
                    Preview credits are used for exploration. Unused credits remain available.
                  </span>
                )}
                {model !== 'sora-2' && (
                  <span>
                        {model === 'veo-flash' && 'This generation uses Flash credits (50 credits).'}
                        {model === 'veo-pro' && 'This generation uses Pro credits (250 credits).'}
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Batch Mode UI */}
          {generationMode === 'batch' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-2">Batch generation</h3>
                <p className="text-sm text-blue-100/70 mb-4">
                  Submit multiple prompts at once and generate videos in a batch. Great for large-scale content creation.
                </p>
                
                {/* Batch Result */}
                {batchResult && (
                  <div className={`mb-4 rounded-lg p-4 ${batchResult.ok ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
                    {batchResult.ok ? (
                      <div>
                        <p className="text-green-300 font-medium">{batchResult.message}</p>
                        <p className="text-sm text-green-300/70 mt-1">
                          Batch ID: {batchResult.batch_id}
                          <span className="mx-2">·</span>
                          Frozen {batchResult.credits_frozen} credits
                        </p>
                        <p className="text-xs text-green-300/50 mt-2">
                          Added to the queue and will run automatically. Review results in your history once finished.
                        </p>
                      </div>
                    ) : (
                      <p className="text-red-300">{batchResult.error || batchResult.message}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-blue-100/80">
                      Prompts (one per line)
                    </label>
                    <textarea
                      rows={8}
                      value={batchPrompts}
                      onChange={(e) => setBatchPrompts(e.target.value)}
                      disabled={batchLoading}
                      className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water font-mono text-sm disabled:opacity-50"
                      placeholder={`Cinematic sunset over a modern city skyline\nAnime-style forest with falling cherry blossoms\nSlow-motion surfing at a sunny beach\n...`}
                    />
                    <p className="mt-1 text-xs text-blue-100/50">
                      One prompt per line. Supports 1–100 prompts. Each prompt must be at least 5 characters.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-blue-100/80">
                        Model
                      </label>
                      <select
                        value={batchModel}
                        onChange={(e) => setBatchModel(e.target.value as 'sora-2' | 'veo-flash' | 'veo-pro')}
                        disabled={batchLoading}
                        className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water disabled:opacity-50"
                      >
                        <option value="sora-2" className="text-black">Sora-2 (10 credits/video)</option>
                        <option value="veo-flash" className="text-black">Veo Flash (50 credits/video)</option>
                        <option value="veo-pro" className="text-black">Veo Pro (250 credits/video)</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-blue-100/80">
                        Aspect ratio
                      </label>
                      <select
                        value={batchAspectRatio}
                        onChange={(e) => setBatchAspectRatio(e.target.value as '16:9' | '9:16')}
                        disabled={batchLoading}
                        className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water disabled:opacity-50"
                      >
                        <option value="16:9" className="text-black">16:9 (Landscape)</option>
                        <option value="9:16" className="text-black">9:16 (Portrait)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-sm text-blue-100/70">
                      {(() => {
                        const prompts = batchPrompts.split('\n').filter(p => p.trim().length >= 5);
                        const count = prompts.length;
                        const costPerVideo = batchModel === 'sora-2' ? 10 : batchModel === 'veo-flash' ? 50 : 250;
                        const totalCost = count * costPerVideo;
                        return (
                          <>
                            <span className="font-medium text-white">{count}</span> prompts queued
                            <span className="mx-2">·</span>
                            Estimated cost: <span className="font-medium text-white">{totalCost}</span> credits
                          </>
                        );
                      })()}
                    </div>
                    <button
                      type="button"
                      disabled={batchLoading || batchPrompts.split('\n').filter(p => p.trim().length >= 5).length === 0}
                      onClick={async () => {
                        const prompts = batchPrompts.split('\n').map(p => p.trim()).filter(p => p.length >= 5);
                        if (prompts.length === 0) return;
                        
                        setBatchLoading(true);
                        setBatchResult(null);
                        
                        try {
                          const authHeaders = await getAuthHeaders()
                          const response = await fetch('/api/video/batch', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'x-csrf-token': '1',
                              ...authHeaders,
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                              prompts,
                              model: batchModel,
                              aspectRatio: batchAspectRatio,
                              duration: '5',
                            }),
                          });
                          
                          const data = await response.json().catch(() => ({} as Record<string, unknown>));
                          
                          if (response.ok && data.ok) {
                            setBatchResult(data);
                            setBatchPrompts(''); // Clear on success
                          } else {
                            if (response.status === 401) {
                              setBatchResult({
                                ok: false,
                                error: 'Please sign in first, then retry batch generation.',
                              });
                              const intended =
                                typeof window !== 'undefined' ? `${window.location.pathname}${window.location.search}` : '/video'
                              setPostLoginRedirect(intended)
                              router.push(`/login?redirect=${encodeURIComponent(intended)}`)
                              return
                            }
                            if (response.status === 403) {
                              setBatchResult({
                                ok: false,
                                error: 'Your account does not have permission to use batch generation.',
                              });
                              return
                            }
                            if (response.status === 402) {
                              const required =
                                typeof (data as { required?: unknown }).required === 'number'
                                  ? (data as { required: number }).required
                                  : undefined
                              const available =
                                typeof (data as { available?: unknown }).available === 'number'
                                  ? (data as { available: number }).available
                                  : undefined
                              setBatchResult({
                                ok: false,
                                error:
                                  `Insufficient credits for this batch.` +
                                  (typeof required === 'number' ? ` Required: ${required}.` : '') +
                                  (typeof available === 'number' ? ` Available: ${available}.` : ''),
                              });
                              return
                            }
                            setBatchResult({
                              ok: false,
                              error:
                                (data as { error?: string; message?: string }).error ||
                                (data as { error?: string; message?: string }).message ||
                                `Failed to create batch (HTTP ${response.status}).`,
                            });
                          }
                        } catch {
                          setBatchResult({
                            ok: false,
                            error: 'Network error. Please try again.',
                          });
                        } finally {
                          setBatchLoading(false);
                        }
                      }}
                      className="rounded-xl bg-gradient-to-r from-energy-water to-energy-water-deep px-6 py-2 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {batchLoading ? 'Submitting…' : 'Start batch generation'}
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-blue-100/50">
                    Need larger-scale batch generation or API access?
                    <a href="/enterprise" className="text-energy-water hover:underline ml-1">
                      Learn about Enterprise API →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Single Mode Form */}
          {generationMode === 'single' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Prompt <span className="text-red-400">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPromptTouched(true)
                  setPrompt(e.target.value)
                }}
                required
                rows={4}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                placeholder="e.g., A cute cat playing on the grass"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className={`text-xs ${promptValidationMessage ? 'text-red-300' : 'text-blue-100/50'}`}>
                  {promptValidationMessage ?? `Tip: prompts work best with more detail. Minimum ${MIN_PROMPT_LENGTH} characters.`}
                </p>
                <p className="text-xs text-blue-100/50">
                  {cleanedPrompt.length}/{MIN_PROMPT_LENGTH}+
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Reference Image (Optional)
              </label>
              
              {/* Drag and Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
                className={`relative mb-3 cursor-pointer rounded-2xl border-2 border-dashed transition-all ${
                  isDragging
                    ? 'border-energy-water bg-energy-water/10'
                    : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
                } ${uploadingImage ? 'pointer-events-none opacity-50' : ''}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={uploadingImage}
                />
                
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  {previewImage && !uploadingImage && !imageError ? (
                    <div className="relative w-full h-48 flex items-center justify-center">
                      <div className="relative w-full h-full max-w-full">
                        {previewImage.startsWith('blob:') ? (
                          // Use regular img for blob URLs (no optimization needed)
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="mx-auto max-h-48 w-auto rounded-lg object-contain"
                            onError={() => {
                              setImageError(true)
                              setPreviewImage(null)
                            }}
                          />
                        ) : (
                          // Use Next.js Image for HTTP URLs
                          <Image
                            src={previewImage}
                            alt="Preview"
                            fill
                            className="object-contain rounded-lg"
                            onError={() => {
                              setImageError(true)
                              setPreviewImage(null)
                            }}
                          />
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setPreviewImage(null)
                          setReferenceUrl('')
                          setImageError(false)
                        }}
                        className="absolute right-0 top-0 z-10 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        title="Remove image"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="mb-4 h-12 w-12 text-blue-100/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="mb-2 text-sm font-medium text-blue-100/80">
                        {uploadingImage ? 'Uploading...' : 'Click to upload image'}
                      </p>
                      <p className="text-xs text-blue-100/50">
                        Or drag and drop images here
                      </p>
                      <p className="mt-2 text-xs text-blue-100/40">
                        Supports JPG, JPEG, PNG, WEBP formats
                      </p>
                      {uploadingImage && (
                        <div className="mt-4 w-full max-w-xs">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-energy-water transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* URL Input (Alternative) */}
              <div className="relative">
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => {
                    const url = e.target.value
                    setReferenceUrl(url)
                    setImageError(false)
                    // Show preview if URL is valid and not from upload
                    if (url && url.startsWith('http')) {
                      setPreviewImage(url)
                    } else if (!url) {
                      setPreviewImage(null)
                    }
                  }}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                  placeholder="Or enter image URL directly (e.g., https://example.com/image.png)"
                />
                {referenceUrl && (
                  <button
                    onClick={() => {
                      setReferenceUrl('')
                      setPreviewImage(null)
                      setImageError(false)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-blue-100/50 hover:text-white"
                    title="Clear URL"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Model <span className="text-yellow-400">*</span>
              </label>
              <select
                value={model}
                onChange={(e) => {
                  const newModel = e.target.value as 'sora-2' | 'veo-flash' | 'veo-pro'
                  setModel(newModel)
                  // Reset Veo-specific fields when switching to Sora
                  if (newModel === 'sora-2') {
                    setFirstFrameUrl('')
                    setLastFrameUrl('')
                  }
                }}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
              >
                <option value="sora-2" className="text-black">Sora Preview</option>
                <option value="veo-flash" className="text-black">Veo Flash</option>
                <option 
                  value="veo-pro" 
                  className="text-black"
                  disabled={userEntitlements?.veoProEnabled === false}
                >
                  Veo Pro{userEntitlements?.veoProEnabled === false ? ' (Upgrade required)' : ''}
                </option>
              </select>
              <p className="mt-1 text-xs text-blue-100/50">
                {model === 'sora-2' && 'Fast, lightweight video generation for early exploration.'}
                {model === 'veo-flash' && 'Quality upgrade with audio, still fast for drafts and testing.'}
                {model === 'veo-pro' && (
                  userEntitlements?.veoProEnabled === false
                    ? 'Veo Pro is available on paid packs. Upgrade to unlock final export quality.'
                    : 'Preferred when final quality and sound matter.'
                )}
              </p>
              {userEntitlements?.veoProEnabled === false && model === 'veo-pro' && (
                <div className="mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2 text-xs text-yellow-200">
                  Veo Pro is locked on Starter Access. <Link href="/pricing" className="underline hover:text-yellow-100">Upgrade to unlock</Link>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-blue-100/80">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                >
                  <option value="9:16" className="text-black">9:16 (Portrait)</option>
                  <option value="16:9" className="text-black">16:9 (Landscape)</option>
                </select>
              </div>

              {model === 'sora-2' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-blue-100/80">
                    Duration (seconds)
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value as '10' | '15')}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                  >
                    <option value="10" className="text-black">10 seconds</option>
                    <option value="15" className="text-black">15 seconds</option>
                  </select>
                </div>
              )}

            </div>

            {/* Veo-specific fields */}
            {(model === 'veo-flash' || model === 'veo-pro') && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-blue-100/80">
                    First Frame URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={firstFrameUrl}
                    onChange={(e) => setFirstFrameUrl(e.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                    placeholder="https://example.com/firstFrame.png"
                  />
                  <p className="mt-1 text-xs text-blue-100/50">
                    First frame image URL for video generation
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-blue-100/80">
                    Last Frame URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={lastFrameUrl}
                    onChange={(e) => setLastFrameUrl(e.target.value)}
                    className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                    placeholder="https://example.com/lastFrame.png"
                  />
                  <p className="mt-1 text-xs text-blue-100/50">
                    Last frame image URL (requires first frame URL)
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useWebhook"
                checked={useWebhook}
                onChange={(e) => setUseWebhook(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 text-energy-water focus:ring-energy-water"
              />
              <label htmlFor="useWebhook" className="ml-2 text-sm text-blue-100/80">
                Use Webhook callback (Recommended, real-time updates)
              </label>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full rounded-2xl bg-gradient-to-r from-[#1f75ff] via-[#3f8cff] to-[#6fd6ff] px-4 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-25px_rgba(33,122,255,0.9)] transition-transform hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-energy-water disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!supabase ? 'Initializing...' : loading ? 'Generating Preview...' : 'Generate Preview'}
            </button>
              <p className="mt-2 text-xs text-blue-100/70 text-center">
              {!supabase
                ? 'Setting up secure connection… Please wait a moment.'
                : loading
                  ? 'Submitting request…'
                  : promptValidationMessage
                    ? promptValidationMessage
                    : 'Ready to generate.'}
              </p>
          </form>
          )}
        </div>

        {/* Unique Content Section for Prompt-based Pages */}
        {prompt && prompt.trim() && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              About This Video Generation
            </h2>
            <div className="space-y-4 text-blue-100/80">
              <p className="text-base leading-relaxed">
                This page is specifically designed to generate a video based on the prompt: <strong className="text-white">{prompt}</strong>
              </p>
              <p className="text-sm">
                Each video generated from this prompt will be unique, created using OpenAI&apos;s Sora 2.0 model. The AI interprets your description and creates a high-quality video that matches your vision.
              </p>
              <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-2">Video Details</h3>
                <ul className="space-y-2 text-sm">
                  <li><strong className="text-white">Prompt:</strong> {prompt}</li>
                  <li><strong className="text-white">Model:</strong> OpenAI Sora 2.0</li>
                  <li><strong className="text-white">Technology:</strong> AI Video Generation</li>
                  <li><strong className="text-white">Platform:</strong> Sora2Ai Videos</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Current Generation Result - Display before guide */}
        {currentResult && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generation Result
            </h2>
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentResult.prompt || 'Video Generation Task'}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                    currentResult.status
                  )}`}
                >
                  {getStatusText(currentResult.status)}
                </span>
              </div>

              {currentResult.status === 'processing' && (
                <div className="mt-4">
                  {/* Phase 2B: Staged progress display */}
                  <h3 className="text-lg font-semibold text-white mb-4">Generating your video</h3>
                  
                  {/* 3-stage progress */}
                  <ul className="space-y-3 mb-4">
                    {[
                      { label: 'Processing prompt', threshold: 10 },
                      { label: 'Generating frames', threshold: 50 },
                      { label: 'Finalizing output', threshold: 90 },
                    ].map((step, idx) => {
                      const progress = currentResult.progress || 0
                      const isActive = progress >= step.threshold && (idx === 2 || progress < [10, 50, 90][idx + 1])
                      const isCompleted = progress > step.threshold + 30 || (idx < 2 && progress >= [10, 50, 90][idx + 1])
                      
                      return (
                        <li 
                          key={step.label}
                          className={`flex items-center gap-3 text-sm transition-colors ${
                            isCompleted 
                              ? 'text-green-400' 
                              : isActive 
                                ? 'text-white' 
                                : 'text-gray-500'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isActive ? (
                            <div className="h-5 w-5 rounded-full border-2 border-energy-water border-t-transparent animate-spin" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-600" />
                          )}
                          <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                  
                  {/* Progress bar */}
                  <div className="h-2 w-full rounded-full bg-gray-700 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-energy-water to-blue-400 transition-all duration-500"
                      style={{ width: `${currentResult.progress || 0}%` }}
                    />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Progress: {currentResult.progress || 0}%</span>
                    <span>~1-3 min</span>
                  </div>
                  
                  {/* Phase 2B: Trust copy - automatic credit refund */}
                  <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Credits are reserved. <strong className="text-gray-300">Refunded automatically</strong> if generation fails.</span>
                    </p>
                  </div>
                </div>
              )}

              {currentResult.status === 'succeeded' && currentResult.video_url && (
                <>
                  {/* Phase 2B: Simplified success state - highlight key actions */}
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center gap-2 text-green-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-lg font-semibold">Your video is ready</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <video
                      src={currentResult.video_url}
                      controls
                      className="w-full max-w-full rounded-lg"
                      preload="metadata"
                      playsInline
                      crossOrigin="anonymous"
                      // For "1:1 original" display, cap CSS width to intrinsicWidth / DPR to avoid upscaling.
                      style={{
                        width: '100%',
                        height: 'auto',
                        maxWidth: videoMaxCssWidth ? `${videoMaxCssWidth}px` : '100%',
                      }}
                      onLoadedMetadata={(e) => {
                        // Log video quality information for debugging
                        const video = e.currentTarget
                        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
                        const maxCssWidth = video.videoWidth ? Math.floor(video.videoWidth / dpr) : null
                        setVideoMaxCssWidth(maxCssWidth)
                        const upscaling = video.videoWidth
                          ? (video.clientWidth * dpr) / video.videoWidth
                          : null
                        console.log('[VideoPage] 📹 Video loaded:', {
                          src: currentResult.video_url,
                          videoWidth: video.videoWidth,
                          videoHeight: video.videoHeight,
                          duration: video.duration,
                          readyState: video.readyState,
                          networkState: video.networkState,
                          devicePixelRatio: dpr,
                          maxCssWidthNoUpscale: maxCssWidth,
                          displayedCssPx: {
                            width: video.clientWidth,
                            height: video.clientHeight,
                          },
                          upscaling,
                          isFromR2: currentResult.video_url?.includes('r2.dev'),
                          isFromOriginalApi: !currentResult.video_url?.includes('r2.dev'),
                        })
                      }}
                      onError={(e) => {
                        const video = e.currentTarget
                        const networkState = video.networkState
                        const errorMessage = networkState === 3 // NETWORK_NO_SOURCE
                          ? 'Video URL has expired (GRSAI videos expire after 2 hours). Please try generating the video again.'
                          : networkState === 2 // NETWORK_LOADING
                          ? 'Video is still loading. Please wait...'
                          : 'Failed to load video. The video URL may have expired or the server is unavailable.'
                        
                        console.error('[VideoPage] ❌ Video load error:', {
                          error: e,
                          src: currentResult.video_url,
                          networkState,
                          errorMessage,
                        })
                        setVideoLoadError(errorMessage)
                      }}
                      onLoadedData={() => {
                        // Clear error when video loads successfully
                        setVideoLoadError(null)
                      }}
                    >
                      Your browser does not support video playback
                    </video>
                  </div>
                  {videoLoadError ? (
                    <div className="mt-2 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">
                        ⚠️ {videoLoadError}
                      </p>
                    </div>
                  ) : null}
                  
                  {/* Phase 2B: Primary action buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    {/* Generate Another */}
                    <button
                      onClick={() => {
                        Events.generateAnotherClick(userId)
                        setCurrentResult(null)
                        setPrompt(currentResult.prompt || '')
                        setPromptTouched(true)
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generate another
                    </button>
                    
                    {currentResult.task_id && (
                        <a
                          href={`/api/video/download/${currentResult.task_id}`}
                          download={`video-${currentResult.task_id}.mp4`}
                          className="inline-flex items-center gap-2 rounded-lg bg-energy-water px-4 py-2 text-sm font-medium text-white hover:bg-energy-water/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={videoLoadError ? "Video URL may have expired. Click to try downloading (will attempt to re-fetch from API)." : "Download original quality video directly from API (no compression, no storage)"}
                          onClick={async (e) => {
                            // Always download via fetch + blob with Authorization header.
                            // This avoids download failures caused by missing cookies in some flows.
                            e.preventDefault()
                            Events.downloadClick(userId)
                            setDidDownloadOrShare(true) // Track download action
                            try {
                              const authHeaders = await getAuthHeaders()
                              const response = await fetch(`/api/video/download/${currentResult.task_id}`, {
                                headers: authHeaders,
                                credentials: 'include',
                              })
                              if (response.ok) {
                                const blob = await response.blob()
                                const url = window.URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `video-${currentResult.task_id}.mp4`
                                a.style.display = 'none'
                                
                                // Safely append the element
                                try {
                                  document.body.appendChild(a)
                                } catch (e) {
                                  console.warn('Failed to append download link:', e)
                                }
                                
                                // Trigger download
                                try {
                                  a.click()
                                } catch (e) {
                                  console.warn('Failed to trigger download:', e)
                                }
                                
                                // Safely remove the element with multi-check + try/catch
                                try {
                                  // Ensure the element is still in the DOM
                                  if (a.parentNode && document.body.contains(a)) {
                                    document.body.removeChild(a)
                                  } else if (a.parentNode) {
                                    // If parentNode exists but isn't body, remove from the parent
                                    a.parentNode.removeChild(a)
                                  } else {
                                    // If already removed, call remove() if available
                                    if (a.remove && typeof a.remove === 'function') {
                                      a.remove()
                                    }
                                  }
                                } catch {
                                  // If all removal methods fail, try remove() as a fallback
                                  try {
                                    if (a.remove && typeof a.remove === 'function') {
                                      a.remove()
                                    }
                                  } catch (e) {
                                    // Last resort: ignore. The element may already be removed by other code.
                                    console.debug('Element removal failed (safe to ignore):', e)
                                  }
                                }
                                
                                // Revoke object URL
                                try {
                                  window.URL.revokeObjectURL(url)
                                } catch (e) {
                                  console.warn('Failed to revoke object URL:', e)
                                }
                                
                                // Update state only if still mounted
                                if (isMountedRef.current) {
                                  setVideoLoadError(null) // Clear error on success
                                }
                              } else if (response.status === 401) {
                                setVideoLoadError('Unauthorized, please login first')
                              } else if (response.status === 404) {
                                const errorData = await response.json().catch(() => ({}))
                                setVideoLoadError(
                                  errorData.details ||
                                    errorData.error ||
                                    'Video not found (the video URL may have expired). Please try generating the video again.'
                                )
                              } else {
                                const errorData = await response.json().catch(() => ({}))
                                setVideoLoadError(errorData.details || errorData.error || `Failed to download video (HTTP ${response.status}).`)
                              }
                            } catch (error) {
                              console.error('Download error:', error)
                              setVideoLoadError('Failed to download video. Please try again or generate a new video.')
                            }
                          }}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {videoLoadError ? 'Try Download' : 'Download'}
                        </a>
                      )}
                    
                    {currentResult.remove_watermark && (
                      <span className="text-xs text-green-400 px-2">
                        ✓ No Watermark
                      </span>
                    )}
                  </div>
                  
                  {/* Helper note */}
                  <p className="mt-4 text-xs text-gray-500 text-center">
                    Issues? <Link href="/support" className="underline hover:text-gray-400">Contact support</Link>
                  </p>
                  
                  {/* Sora → Veo guide (only shown after successful Sora generation) */}
                  {model === 'sora-2' && (
                    <>
                      <SoraToVeoGuide
                        onRefine={() => {
                          // Keep the current prompt and regenerate
                          setCurrentResult(null)
                        }}
                        onUpgrade={() => {
                          // Switch to Veo Pro while keeping the current prompt
                          setModel('veo-pro')
                          setCurrentResult(null)
                        }}
                        prompt={currentResult.prompt}
                      />
                      
                      {/* Veo upgrade nudge (simple triggers: repeated Sora usage + export intent) */}
                      <div className="mt-4">
                        <VeoUpgradeNudge
                          soraRenders7d={soraRenders7d}
                          remixSamePrompt24h={remixSamePrompt24h}
                          bonusUsageRatio={0} // TODO: compute from wallet bonus usage ratio
                          exportIntent={didDownloadOrShare}
                          prompt={currentResult.prompt}
                          aspectRatio={aspectRatio}
                          onUpgradeToVeoPro={() => {
                            setModel('veo-pro')
                          }}
                          onDismiss={() => {
                            // no-op for now
                          }}
                        />
                      </div>

                      {/* Upgrade nudge (Starter → Veo Pro) */}
                      <UpgradeNudge
                        planId={hasRechargeRecords ? 'creator' : 'starter'}
                        soraRendersThisSession={soraGenerationsSession}
                        promptText={currentResult.prompt}
                        onUpgrade={() => {
                          router.push('/pricing')
                        }}
                        onDismiss={() => {
                          // User chose to continue with Sora
                        }}
                      />
                    </>
                  )}
                </>
              )}

              {currentResult.status === 'failed' && (
                <div className="mt-4 rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Trying a different variation to improve the result…
                  </p>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {currentResult.error || 'Unknown error'}
                    </p>
                    
                    {/* Show Veo Pro recommendation for non-Veo Pro models on failure or retry */}
                    {model !== 'veo-pro' && (retryCount >= 1 || showVeoProRecommendation) && (
                      <div className="mt-3">
                        <VeoProRecommendation 
                          onClose={() => setShowVeoProRecommendation(false)}
                        />
                      </div>
                    )}
                    
                    {/* Show credits refunded message for all failures */}
                    <div className="mt-3 rounded-md bg-green-50 p-3 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {model === 'veo-pro' 
                          ? 'Credits have been automatically refunded (Veo Pro auto-refund on failure). You can try again with a different prompt.'
                          : 'Credits have been automatically refunded. You can try again with a different prompt.'
                        }
                      </p>
                    </div>
                    {violationInfo && (
                      <div className="mt-3 rounded-md bg-yellow-50 p-3 dark:bg-yellow-900/20">
                        <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                          ⚠️ {violationInfo.headline}
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          {violationInfo.description}
                        </p>
                        <ul className="mt-1 ml-4 list-disc text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                          {violationInfo.suggestions.map((tip) => (
                            <li key={tip}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setCurrentResult(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* How to Create AI Videos Guide - Display after generation result */}
        {!prompt && (
          <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">
              How to Create AI Videos with Sora2Ai
            </h2>
            <div className="space-y-4 text-blue-100/80">
              <p className="text-base leading-relaxed">
                Creating AI-generated videos with Sora2Ai is simple and straightforward. Start by entering 
                a detailed text prompt that describes the video you want to create. Be specific about the 
                scene, style, camera movement, lighting, mood, and any other visual elements you&apos;re 
                looking for. The more detailed your description, the better the AI can understand and create 
                your vision.
              </p>
              <p className="text-base leading-relaxed">
                Our platform uses OpenAI Sora 2.0, one of the most advanced AI video generation models 
                available. Each video is generated with high quality and attention to detail, ensuring 
                professional results suitable for marketing, social media, education, or creative projects. 
                You can choose between portrait (9:16) or landscape (16:9) aspect ratios, and select video 
                duration of 10 or 15 seconds based on your needs.
              </p>
              <p className="text-base leading-relaxed">
                After submitting your prompt, the video generation process typically takes a few minutes. 
                You&apos;ll receive real-time updates on the progress through our webhook system, and once 
                complete, you can download and use your video immediately. Each video generation costs 10 
                credits, and new users receive 30 free credits to get started.
              </p>
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">
                Best Practices for Writing Video Prompts
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm ml-4">
                <li>Be specific about visual elements: colors, lighting, camera angles, and movement</li>
                <li>Describe the mood and atmosphere you want to convey</li>
                <li>Include details about style: realistic, cinematic, documentary, animated, etc.</li>
                <li>Mention any specific objects, characters, or scenes you want included</li>
                <li>Use descriptive language to help the AI understand your creative vision</li>
              </ul>
            </div>
          </div>
        )}

      </div>
      </div>
    </div>
  )
}


