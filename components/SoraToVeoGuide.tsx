'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SoraToVeoGuideProps {
  onRefine?: () => void
  onUpgrade?: () => void
  prompt?: string
}

/**
 * Sora → Veo 无感引导组件
 * 在 Sora 预览完成后自动显示，引导用户自然升级到 Veo
 */
export default function SoraToVeoGuide({ 
  onRefine, 
  onUpgrade,
  prompt 
}: SoraToVeoGuideProps) {
  const router = useRouter()
  const [showGuide, setShowGuide] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    // 延迟显示，让用户先看到预览结果
    const timer1 = setTimeout(() => {
      setShowGuide(true)
    }, 2000)

    const timer2 = setTimeout(() => {
      setShowOptions(true)
    }, 4000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const handleRefine = () => {
    if (onRefine) {
      onRefine()
    }
  }

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade()
    } else {
      // 默认行为：切换到 Veo Pro
      router.push('/video?model=veo3.1-pro')
    }
  }

  if (!showGuide) return null

  return (
    <div className="mt-4 space-y-3">
      {/* Step 1: 轻提示 */}
      {showGuide && !showOptions && (
        <div className="rounded-lg bg-green-50/90 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-sm text-green-800 dark:text-green-200">
            This preview helps validate the idea.
          </p>
        </div>
      )}

      {/* Step 2: 选项卡 */}
      {showOptions && (
        <div className="rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">
            Next step options:
          </p>
          
          <div className="space-y-2">
            {/* Option A: Refine (默认，高亮) */}
            <button
              onClick={handleRefine}
              className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2.5 text-sm font-medium transition-all shadow-md hover:shadow-lg"
            >
              Refine this preview
            </button>

            {/* Option B: Upgrade (次级，但视觉完整) */}
            <button
              onClick={handleUpgrade}
              className="w-full rounded-lg bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600 text-blue-700 dark:text-blue-300 px-4 py-2.5 text-sm font-medium transition-all"
            >
              Generate final-quality video (Veo Pro)
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400 text-center">
            Many creators start with a preview before moving to final production.
          </p>
        </div>
      )}
    </div>
  )
}

