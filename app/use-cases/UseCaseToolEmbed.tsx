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
 * 避免重复添加 "Create a professional" 前缀
 */
function generateDefaultPromptFromUseCase(keyword: string, title: string): string {
  // 清理输入：移除可能已存在的 "Create a professional" 前缀
  const cleanKeyword = keyword
    .replace(/^create\s+a\s+professional\s+/i, '')
    .replace(/\s+video\s+with\s+.*$/i, '')
    .trim()
  
  // 如果 keyword 太长（超过100字符），截取并简化
  if (cleanKeyword && cleanKeyword.length > 100) {
    // 提取前50个字符，确保是完整的词
    const shortKeyword = cleanKeyword.substring(0, 50).trim()
    const lastSpace = shortKeyword.lastIndexOf(' ')
    const finalKeyword = lastSpace > 0 ? shortKeyword.substring(0, lastSpace) : shortKeyword
    return `Create a professional ${finalKeyword} video with high-quality visuals`
  }
  
  // 如果 keyword 太短或只是关键词，生成一个简洁的提示词
  if (!cleanKeyword || cleanKeyword.length < 10 || cleanKeyword === title) {
    const cleanTitle = title.toLowerCase()
      .replace(/^create\s+a\s+professional\s+/i, '')
      .replace(/\b(ai|video|generation|for|how|to|use|create|make|generate)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    if (!cleanTitle || cleanTitle.length < 3) {
      return 'Create a professional video with engaging visuals and smooth transitions'
    }
    
    return `Create a professional ${cleanTitle} video with engaging visuals`
  }
  
  // 如果 keyword 已经包含完整描述，检查是否已有 "Create a professional" 前缀
  if (cleanKeyword.toLowerCase().startsWith('create a professional')) {
    // 如果已有前缀，直接使用（但确保不超过100字符）
    return cleanKeyword.length > 100 ? cleanKeyword.substring(0, 100) : cleanKeyword
  }
  
  // 如果 keyword 长度合适且没有前缀，添加前缀
  return cleanKeyword.length > 100 ? cleanKeyword.substring(0, 100) : cleanKeyword
}

export default function UseCaseToolEmbed({ defaultPrompt = '', useCaseTitle = '' }: UseCaseToolEmbedProps) {
  const router = useRouter()
  
  // 生成简洁的默认 prompt（限制在200字符以内，但建议100字符）
  const initialPrompt = useMemo(() => {
    if (!defaultPrompt) {
      // 如果没有默认提示词，从标题生成
      const generated = generateDefaultPromptFromUseCase('', useCaseTitle)
      return generated.length > 200 ? generated.substring(0, 200) : generated
    }
    
    // 清理默认提示词：移除重复的前缀
    const cleaned = defaultPrompt
      .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
      .replace(/\s+/g, ' ')
      .trim()
    
    // 如果清理后的提示词长度合适，直接使用
    if (cleaned.length >= 10 && cleaned.length <= 200) {
      return cleaned
    }
    
    // 否则重新生成
    const generated = generateDefaultPromptFromUseCase(cleaned, useCaseTitle)
    return generated.length > 200 ? generated.substring(0, 200) : generated
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
      // 清理 prompt：移除多余的空格和换行，以及重复的前缀
      let cleanedPrompt = trimmedPrompt
        .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
        .replace(/\s+/g, ' ')
        .trim()
      
      // 确保提示词不会太长
      if (cleanedPrompt.length > 500) {
        cleanedPrompt = cleanedPrompt.substring(0, 500).trim()
      }
      
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
