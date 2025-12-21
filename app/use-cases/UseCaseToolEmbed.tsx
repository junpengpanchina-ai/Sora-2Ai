'use client'

import { useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Textarea } from '@/components/ui'

interface UseCaseToolEmbedProps {
  defaultPrompt?: string
  useCaseTitle?: string
}

/**
 * 从使用场景标题生成一个简洁的默认 prompt（50-100字符）
 * 只提取核心关键词，生成简洁明了的提示词
 */
function generateDefaultPromptFromUseCase(keyword: string, title: string): string {
  // 如果 keyword 太长（超过100字符），截取并简化
  if (keyword && keyword.length > 100) {
    // 提取前50个字符，确保是完整的词
    const shortKeyword = keyword.substring(0, 50).trim()
    const lastSpace = shortKeyword.lastIndexOf(' ')
    const finalKeyword = lastSpace > 0 ? shortKeyword.substring(0, lastSpace) : shortKeyword
    return `Create a professional ${finalKeyword} video with high-quality visuals`
  }
  
  // 如果 keyword 太短或只是关键词，生成一个简洁的提示词
  if (!keyword || keyword.length < 10 || keyword === title) {
    const cleanTitle = title.toLowerCase().replace(/\b(ai|video|generation|for|how|to|use)\b/gi, '').trim()
    return `Create a professional ${cleanTitle || title.toLowerCase()} video with engaging visuals`
  }
  
  // 如果 keyword 长度合适，直接使用（但确保不超过100字符）
  return keyword.length > 100 ? keyword.substring(0, 100) : keyword
}

export default function UseCaseToolEmbed({ defaultPrompt = '', useCaseTitle = '' }: UseCaseToolEmbedProps) {
  const router = useRouter()
  
  // 生成简洁的默认 prompt（限制在100字符以内）
  const initialPrompt = useMemo(() => {
    if (defaultPrompt && defaultPrompt.length >= 10 && defaultPrompt.length <= 100) {
      return defaultPrompt
    }
    const generated = generateDefaultPromptFromUseCase(defaultPrompt, useCaseTitle)
    // 确保不超过100字符
    return generated.length > 100 ? generated.substring(0, 100) : generated
  }, [defaultPrompt, useCaseTitle])
  
  const [prompt, setPrompt] = useState(initialPrompt)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isNavigatingRef = useRef(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    // Prevent double submission
    if (isNavigatingRef.current || submitting) {
      return
    }
    
    const trimmedPrompt = prompt.trim()
    
    // 验证 prompt 长度和内容
    if (!trimmedPrompt) {
      setError('Please enter a video generation prompt')
      return
    }
    
    if (trimmedPrompt.length < 10) {
      setError('Prompt is too short. Please provide a more detailed description (at least 10 characters).')
      return
    }
    
    if (trimmedPrompt.length > 500) {
      setError('Prompt is too long. Please keep it under 500 characters.')
      return
    }
    
    setError(null)
    setSubmitting(true)
    isNavigatingRef.current = true
    
    try {
      // 清理 prompt：移除多余的空格和换行
      const cleanedPrompt = trimmedPrompt.replace(/\s+/g, ' ').trim()
      const encoded = encodeURIComponent(cleanedPrompt)
      
      // Use a small delay to ensure the form submission is complete before navigation
      // This helps avoid DOM manipulation conflicts during page transition
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Use router.push with error handling
      // Wrap in try-catch to handle any navigation errors gracefully
      try {
        router.push(`/video?prompt=${encoded}`)
      } catch (navError) {
        // If router.push fails, fallback to window.location
        console.warn('[UseCaseToolEmbed] router.push failed, using window.location:', navError)
        window.location.href = `/video?prompt=${encoded}`
      }
    } catch (err) {
      console.error('[UseCaseToolEmbed] Error navigating to video page:', err)
      setError('Failed to navigate to video page. Please try again.')
      setSubmitting(false)
      isNavigatingRef.current = false
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border-2 border-energy-water/50 bg-gradient-to-br from-white to-energy-water/5 p-6 shadow-xl backdrop-blur dark:from-gray-900/90 dark:to-gray-800/50"
    >
      {/* 醒目的标题和图标 */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-energy-water/20 text-2xl">
          🎬
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Generate Video Now</h2>
          <p className="text-xs text-energy-water dark:text-energy-water/80">Quick & Easy - Just 1 Click</p>
        </div>
      </div>
      
      {/* 简化的提示词输入框 */}
      <div className="relative">
        <Textarea
          rows={3}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Enter a short video description (e.g., 'A futuristic city at night with neon lights')"
          className="mt-2 pr-20 text-sm"
          required
          maxLength={200}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-400">
          {prompt.length}/200
        </div>
      </div>
      
      {/* 示例提示词 */}
      <div className="mt-3">
        <p className="mb-2 text-xs font-medium text-gray-600 dark:text-gray-400">💡 Quick Examples:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Professional product showcase',
            'Animated explainer video',
            'Social media short video',
          ].map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700 transition hover:border-energy-water hover:bg-energy-water/10 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-energy-water"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
      
      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      
      {/* 醒目的生成按钮 */}
      <Button 
        type="submit" 
        disabled={submitting} 
        className="mt-4 w-full bg-energy-water py-3 text-base font-semibold hover:bg-energy-water-deep"
      >
        {submitting ? 'Redirecting...' : '🚀 Generate Video Now'}
      </Button>
      
      <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Free to try • No credit card required
      </p>
    </form>
  )
}
