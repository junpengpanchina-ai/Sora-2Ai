'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  // size parameter removed, API only supports small, backend uses small fixed
  const [useWebhook, setUseWebhook] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentResult, setCurrentResult] = useState<VideoResult | null>(null)
  const [pollingTaskId, setPollingTaskId] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState<string>('') // Save current prompt
  const [credits, setCredits] = useState<number | null>(null)
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null)
  const hasReadPromptFromUrl = useRef(false)
  const isMountedRef = useRef(true)
  
  // Image upload states
  const [isDragging, setIsDragging] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    setSupabase(createClient())
    isMountedRef.current = true
    
    return () => {
      isMountedRef.current = false
    }
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

  // Read prompt from URL query parameter (only once)
  useEffect(() => {
    if (hasReadPromptFromUrl.current || !isMountedRef.current) return
    
    const promptParam = searchParams.get('prompt')
    if (promptParam) {
      // Next.js useSearchParams().get() already decodes the URL parameter
      // No need to call decodeURIComponent again, which would cause double-decoding and garbled text
      
      // 清理提示词：移除重复的前缀和多余空格
      const cleanedPrompt = promptParam
        .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
        .replace(/\s+/g, ' ')
        .trim()
      
      setPrompt(cleanedPrompt)
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
    const MAX_CONSECUTIVE_ERRORS = 5 // 允许最多5次连续错误
    const POLLING_INTERVAL = 3000 // 3秒轮询一次

    const interval = setInterval(async () => {
      // Check if component is still mounted before making updates
      if (!isMountedRef.current) {
        clearInterval(interval)
        return
      }
      
      try {
        console.log('[VideoPage] 🔍 Polling task status:', { taskId: pollingTaskId })
        
        // 使用 AbortController 添加超时控制
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时
        
        let response: Response
        try {
          response = await fetch(`/api/video/result/${pollingTaskId}`, {
            headers: await getAuthHeaders(),
            signal: controller.signal,
          })
          clearTimeout(timeoutId)
        } catch (fetchError) {
          clearTimeout(timeoutId)
          
          // 处理网络错误
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
          
          // 如果连续错误太多，停止轮询并显示错误
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
        
        // 重置连续错误计数
        consecutiveErrors = 0
        
        console.log('[VideoPage] 📥 Polling response:', {
          taskId: pollingTaskId,
          status: response.status,
          ok: response.ok,
        })
        
        // 检查响应状态
        if (!response.ok) {
          console.error('[VideoPage] ❌ Polling response not OK:', {
            taskId: pollingTaskId,
            status: response.status,
            statusText: response.statusText,
          })
          
          // 如果是404，任务可能不存在
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
          
          // 其他错误，继续重试但增加错误计数
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
          // 获取更友好的错误信息
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
            setPollingTaskId(null)
          }
        }
      } catch (error) {
        // 处理 JSON 解析错误或其他意外错误
        console.error(`[VideoPage] ❌ Failed to poll task ${pollingTaskId}:`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          taskId: pollingTaskId,
        })
        
        consecutiveErrors++
        
        // 如果连续错误太多，停止轮询
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
    if (!supabase) {
      console.error('[VideoPage] ❌ Supabase client not initialized')
      return
    }
    setLoading(true)

    try {
      // 清理提示词：移除重复的前缀和多余空格
      const cleanedPrompt = prompt
        .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // 验证清理后的提示词
      if (!cleanedPrompt || cleanedPrompt.length < 10) {
        alert('Please enter a valid prompt (at least 10 characters)')
        setLoading(false)
        return
      }
      
      const requestBody = {
        prompt: cleanedPrompt,
        url: referenceUrl || undefined,
        aspectRatio,
        duration,
        // size parameter removed, API only supports small, backend uses small fixed
        useWebhook,
      }
      
      console.log('[VideoPage] 📤 Starting video generation request:', {
        prompt: prompt.substring(0, 50) + (prompt.length > 50 ? '...' : ''),
        hasReferenceUrl: !!referenceUrl,
        aspectRatio,
        duration,
        useWebhook,
      })

      const authHeaders = await getAuthHeaders()
      
      // 使用 AbortController 添加超时控制
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60秒超时
      
      let response: Response
      try {
        response = await fetch('/api/video/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
      } catch (fetchError) {
        clearTimeout(timeoutId)
        
        // 处理网络错误
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
        router.push('/login')
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
          alert(`Insufficient credits! Video generation requires 10 credits. Current credits: ${credits || 0}. Please recharge first.`)
          router.push('/')
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
      alert('请先登录')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('不支持的文件格式，请上传 JPG、JPEG、PNG 或 WEBP 格式的图片')
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('文件大小超过限制，最大支持10MB')
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
        alert('未授权，请先登录')
        router.push('/login')
        // Clean up temp preview
        URL.revokeObjectURL(tempPreviewUrl)
        setPreviewImage(null)
        return
      }

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '上传失败')
      }

      // Set the uploaded image URL and use it as preview
      setReferenceUrl(data.file.url)
      setPreviewImage(data.file.url) // Use the uploaded URL as preview
      setUploadProgress(100)
      setImageError(false)
      
      // Clean up temporary preview URL
      URL.revokeObjectURL(tempPreviewUrl)
    } catch (error) {
      console.error('上传图片失败:', error)
      alert(error instanceof Error ? error.message : '上传失败，请重试')
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
                Generate Video: {prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt}
              </h1>
              <p className="text-lg text-blue-100/80 mb-4">
                Create an AI-generated video from this prompt using OpenAI Sora 2.0. This video will showcase: {prompt.length > 100 ? prompt.substring(0, 100) + '...' : prompt}
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

        {/* Generation Form - Display first, highest priority */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_80px_-45px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              {prompt && prompt.trim() ? 'Modify or Generate Video' : 'Create New Task'}
            </h2>
            {credits !== null && (
              <div className="text-sm text-blue-100/80">
                Credits Cost: <span className="font-semibold text-energy-water">10 credits/video</span>
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-blue-100/80">
                Prompt <span className="text-red-400">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
                rows={4}
                className="w-full rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-white placeholder:text-blue-100/50 shadow-lg backdrop-blur-sm focus:border-energy-water focus:outline-none focus:ring-2 focus:ring-energy-water"
                placeholder="e.g., A cute cat playing on the grass"
              />
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

            </div>

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
              disabled={loading || !supabase}
              className="w-full rounded-2xl bg-gradient-to-r from-[#1f75ff] via-[#3f8cff] to-[#6fd6ff] px-4 py-3 text-base font-semibold text-white shadow-[0_25px_55px_-25px_rgba(33,122,255,0.9)] transition-transform hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-energy-water disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!supabase ? 'Initializing...' : loading ? 'Generating...' : 'Generate Video'}
            </button>
            {!supabase && (
              <p className="mt-2 text-xs text-blue-100/70 text-center">
                Setting up secure connection… Please wait a moment.
              </p>
            )}
          </form>
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
                      className="w-full rounded-lg"
                      preload="metadata"
                      playsInline
                      crossOrigin="anonymous"
                      style={{ maxWidth: '100%', height: 'auto', width: 'auto' }}
                      onLoadedMetadata={(e) => {
                        // Log video quality information for debugging
                        const video = e.currentTarget
                        console.log('[VideoPage] 📹 Video loaded:', {
                          src: currentResult.video_url,
                          videoWidth: video.videoWidth,
                          videoHeight: video.videoHeight,
                          duration: video.duration,
                          readyState: video.readyState,
                          networkState: video.networkState,
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
                  ) : (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      If you encounter any issues, please return to the homepage and provide feedback. We will contact you as soon as possible after receiving your message.
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {currentResult.remove_watermark && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ No Watermark
                        </span>
                      )}
                      {currentResult.task_id && (
                        <a
                          href={`/api/video/download/${currentResult.task_id}`}
                          download={`video-${currentResult.task_id}.mp4`}
                          className="inline-flex items-center gap-2 rounded-lg bg-energy-water px-4 py-2 text-sm font-medium text-white hover:bg-energy-water/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={videoLoadError ? "Video URL may have expired. Click to try downloading (will attempt to re-fetch from API)." : "Download original quality video directly from API (no compression, no storage)"}
                          onClick={async (e) => {
                            // If there's a video load error, show a message that we're trying to re-fetch
                            if (videoLoadError) {
                              e.preventDefault()
                              // Try to download - the endpoint will attempt to re-fetch
                              try {
                                const response = await fetch(`/api/video/download/${currentResult.task_id}`)
                                if (response.ok) {
                                  const blob = await response.blob()
                                  const url = window.URL.createObjectURL(blob)
                                  const a = document.createElement('a')
                                  a.href = url
                                  a.download = `video-${currentResult.task_id}.mp4`
                                  document.body.appendChild(a)
                                  a.click()
                                  document.body.removeChild(a)
                                  window.URL.revokeObjectURL(url)
                                  setVideoLoadError(null) // Clear error on success
                                } else {
                                  const errorData = await response.json().catch(() => ({}))
                                  setVideoLoadError(errorData.details || errorData.error || 'Failed to download video. The video URL may have expired.')
                                }
                              } catch (error) {
                                console.error('Download error:', error)
                                setVideoLoadError('Failed to download video. Please try again or generate a new video.')
                              }
                            }
                          }}
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          {videoLoadError ? 'Try Download (Re-fetch)' : 'Download Original Video'}
                        </a>
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
                    {/* Show credits refunded message for all failures */}
                    <div className="mt-3 rounded-md bg-green-50 p-3 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-xs font-medium text-green-800 dark:text-green-200 flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Credits have been automatically refunded. You can try again with a different prompt.
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


