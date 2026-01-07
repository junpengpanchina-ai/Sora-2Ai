'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface VeoProRecommendationProps {
  onClose?: () => void
  showCloseButton?: boolean
}

/**
 * Veo Pro 推荐组件
 * 只在用户已经付出成本时推荐（失败/重试时）
 * 不打扰但必然升级的策略
 */
export default function VeoProRecommendation({ 
  onClose, 
  showCloseButton = true 
}: VeoProRecommendationProps) {
  const router = useRouter()
  const [isClosing, setIsClosing] = useState(false)

  const handleClose = () => {
    if (onClose) {
      setIsClosing(true)
      setTimeout(() => {
        onClose()
        setIsClosing(false)
      }, 200)
    }
  }

  const handleLearnMore = () => {
    // 跳转到定价页面或 Veo Pro 说明页面
    router.push('/?pricing=1&model=veo-pro')
  }

  return (
    <div 
      className={`bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 transition-all duration-200 ${
        isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg 
            className="w-5 h-5 text-blue-600 dark:text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            <span className="font-semibold text-blue-700 dark:text-blue-300">
              This result may be limited by the current model.
            </span>
            <br />
            <span className="text-gray-700 dark:text-gray-300">
              For higher consistency and fewer retries,{' '}
              <button
                onClick={handleLearnMore}
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline inline-flex items-center gap-1"
              >
                Veo Pro
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {' '}is usually a better choice for this type of scene.
            </span>
          </p>
        </div>
        
        {showCloseButton && (
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close recommendation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

