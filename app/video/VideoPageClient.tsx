'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'
import { createClient } from '@/lib/supabase/client'

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
  const [referenceUrl, setReferenceUrl] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9'>('9:16')
  const [duration, setDuration] = useState<'10' | '15'>('10')
  const [size, setSize] = useState<'small' | 'large'>('small')
  const [useWebhook, setUseWebhook] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<VideoResult | null>(null)
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('') // Save current prompt
  const [credits, setCredits] = useState<number | null>(null)
  const hasReadPromptFromUrl = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setSupabase(createClient())
  }, [])

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

  // Fetch credits
  useEffect(() => {
    if (!supabase) {
      return
    }

    async function fetchCredits() {
      try {
        const response = await fetch('/api/stats', {
          headers: await getAuthHeaders(),
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.credits !== undefined) {
            setCredits(data.credits)
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error)
      }
    }
    fetchCredits()
    const interval = setInterval(fetchCredits, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [getAuthHeaders, supabase])

  // Read prompt from URL query parameter (only once)
  useEffect(() => {
    if (hasReadPromptFromUrl.current) return
    
    const promptParam = searchParams.get('prompt')
    if (promptParam) {
      setPrompt(decodeURIComponent(promptParam))
      hasReadPromptFromUrl.current = true
      // Clear the URL parameter after reading
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('prompt')
      router.replace(newUrl.pathname + newUrl.search, { scroll: false })
    }
  }, [searchParams, router])

  // Poll task status
  useEffect(() => {
    if (!pollingTaskId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/result/${pollingTaskId}`, {
          headers: await getAuthHeaders(),
        })
        const data = await response.json()
        
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
            setPollingTaskId(null)
          }
        } else if (data.status === 'failed') {
          setCurrentResult(prev => ({
            ...(prev ?? { task_id: pollingTaskId, prompt: currentPrompt }),
            task_id: pollingTaskId,
            status: 'failed',
            error: data.error,
            progress: data.progress ?? prev?.progress,
            prompt: prev?.prompt || currentPrompt,
            violationType: parseViolationType(data.violation_type),
          }))
          setPollingTaskId(null)
        }
      } catch (error) {
        console.error(`Failed to poll task ${pollingTaskId}:`, error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(interval)
  }, [pollingTaskId, currentPrompt, getAuthHeaders])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) {
      console.error('Supabase client not initialized')
      return
    }
    setLoading(true)

    try {
      const authHeaders = await getAuthHeaders()
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          prompt,
          url: referenceUrl || undefined,
          aspectRatio,
          duration,
          size,
          useWebhook,
        }),
      })

      if (response.status === 401) {
        router.push('/login')
        return
      }

      const data = await response.json()
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
        setReferenceUrl('')
      } else {
        const errorMsg = data.error || 'Unknown error'
        const errorDetails = data.details || ''
        
        let shouldClearResult = true

        if (errorMsg.includes('Insufficient credits') || errorMsg.includes('credits')) {
          alert(`Insufficient credits! Video generation requires 10 credits. Current credits: ${credits || 0}. Please recharge first.`)
          router.push('/')
        } else if (errorMsg.includes('User not found')) {
          alert(`User not found: ${errorDetails || 'Please try logging in again'}\n\nIf the problem persists, please contact support.`)
          // Optional: auto redirect to login page
          // router.push('/login')
        } else if (violationTypeFromResponse) {
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
          alert(`Generation failed: ${errorMsg}${errorDetails ? '\n\n' + errorDetails : ''}`)
        }

        if (shouldClearResult) {
          setCurrentResult(null)
        }
      }
    } catch (error) {
      console.error('Failed to generate video:', error)
      alert('Failed to generate video, please try again later')
    } finally {
      setLoading(false)
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

  const violationInfo =
    currentResult?.violationType ? VIOLATION_GUIDANCE[currentResult.violationType] : null

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-xl font-bold text-gray-900 dark:text-white"
              >
                Sora2Ai Videos
              </Link>
              <Link
                href="/video"
                className="text-sm font-medium text-energy-water dark:text-energy-soft"
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
                className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
              >
                Home
              </Link>
              <Link
                href="/prompts"
                className="text-sm font-medium text-gray-700 transition-colors hover:text-energy-water dark:text-gray-300 dark:hover:text-energy-water-deep"
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Sora-2 Video Generation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Generate high-quality videos using OpenAI Sora 2.0 model
          </p>
        </div>

        {/* Generation Form */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Create New Task
            </h2>
            {credits !== null && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Credits Cost: <span className="font-semibold text-energy-water dark:text-energy-soft">10 credits/video</span>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prompt <span className="text-red-500">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="e.g., A cute cat playing on the grass"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reference Image URL (Optional)
              </label>
              <input
                type="url"
                value={referenceUrl}
                onChange={(e) => setReferenceUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="https://example.com/image.png"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Aspect Ratio
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as '9:16' | '16:9')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="9:16">9:16 (Portrait)</option>
                  <option value="16:9">16:9 (Landscape)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration (seconds)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as '10' | '15')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Video Quality
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value as 'small' | 'large')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-energy-water focus:outline-none focus:ring-energy-water dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="small">Small</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useWebhook"
                checked={useWebhook}
                onChange={(e) => setUseWebhook(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-energy-water focus:ring-energy-water"
              />
              <label htmlFor="useWebhook" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Use Webhook callback (Recommended, real-time updates)
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !supabase}
              className="w-full rounded-md bg-energy-water px-4 py-2 text-white hover:bg-energy-water-deep focus:outline-none focus:ring-2 focus:ring-energy-water focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!supabase ? 'Initializing...' : loading ? 'Generating...' : 'Generate Video'}
            </button>
            {!supabase && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                Setting up secure connection… Please wait a moment.
              </p>
            )}
          </form>
        </div>

        {/* Current Generation Result */}
        {currentResult && (
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
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
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Generation Progress</span>
                    <span>{currentResult.progress || 0}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-3 rounded-full bg-energy-water transition-all duration-300"
                      style={{ width: `${currentResult.progress || 0}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Generating video, please wait...
                  </p>
                </div>
              )}

              {currentResult.status === 'succeeded' && currentResult.video_url && (
                <>
                  <div className="mt-4 flex justify-center">
                    <video
                      src={currentResult.video_url}
                      controls
                      className="max-w-md w-full rounded-lg"
                    >
                      Your browser does not support video playback
                    </video>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentResult.remove_watermark && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ No Watermark
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setCurrentResult(null)}
                      className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {currentResult.status === 'failed' && (
                <div className="mt-4 rounded-md bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    Generation Failed
                  </p>
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {currentResult.error || 'Unknown error'}
                    </p>
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
                        <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                          💡 Your credits have been refunded automatically.
                        </p>
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
      </div>
    </div>
  )
}


