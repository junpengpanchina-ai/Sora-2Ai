'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 过滤掉无害的 DOM 错误（这些错误通常由 React 并发渲染或组件卸载时的 DOM 操作引起）
    const isHarmlessDOMError = 
      error.message?.includes('removeChild') ||
      error.message?.includes('not a child') ||
      error.name === 'NotFoundError' && error.message?.includes('removeChild')
    
    if (isHarmlessDOMError) {
      // 对于无害的 DOM 错误，只记录到控制台，不显示错误页面
      console.debug('Harmless DOM error (safe to ignore):', error.message)
      // 自动重置错误，让应用继续运行
      setTimeout(() => {
        try {
          reset()
        } catch {
          // 忽略重置错误
        }
      }, 100)
      return
    }
    
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error, reset])
  
  // 如果是无害的 DOM 错误，不显示错误页面
  const isHarmlessDOMError = 
    error.message?.includes('removeChild') ||
    error.message?.includes('not a child') ||
    error.name === 'NotFoundError' && error.message?.includes('removeChild')
  
  if (isHarmlessDOMError) {
    // 返回空内容，让应用继续运行
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-energy-hero dark:bg-energy-hero-dark p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="primary"
            onClick={reset}
          >
            Try again
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.location.href = '/'}
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

