'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface DebugInfo {
  origin: string
  supabaseUrl: string
  detectSessionInUrl: boolean
  hasSession: boolean
  sessionUserId: string | null
  sessionEmail: string | null
  timestamp: string
}

export default function LoginDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 检查是否应该显示 debug 面板
    const urlParams = new URLSearchParams(window.location.search)
    const hasDebugParam = urlParams.get('debug') === '1'
    const isDev = process.env.NODE_ENV !== 'production'
    
    if (hasDebugParam || isDev) {
      setIsVisible(true)
      loadDebugInfo()
    }
  }, [])

  const loadDebugInfo = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const info: DebugInfo = {
        origin: window.location.origin,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not configured',
        detectSessionInUrl: true, // 在 client.ts 中已设置
        hasSession: !!session,
        sessionUserId: session?.user?.id || null,
        sessionEmail: session?.user?.email || null,
        timestamp: new Date().toISOString(),
      }
      
      setDebugInfo(info)
    } catch (error) {
      console.error('Failed to load debug info:', error)
      setDebugInfo({
        origin: window.location.origin,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'not configured',
        detectSessionInUrl: true,
        hasSession: false,
        sessionUserId: null,
        sessionEmail: null,
        timestamp: new Date().toISOString(),
      })
    }
  }

  if (!isVisible || !debugInfo) {
    return null
  }

  // 隐藏 Supabase URL 中的敏感部分
  const maskUrl = (url: string) => {
    if (!url || url === 'not configured') return url
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}`
    } catch {
      return url.substring(0, 30) + '...'
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <strong className="font-semibold text-yellow-100">🔍 Debug Info</strong>
        <button
          onClick={loadDebugInfo}
          className="rounded px-2 py-1 text-yellow-200 hover:bg-yellow-500/20"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-2 font-mono text-yellow-100/90">
        <div>
          <span className="text-yellow-200/70">Origin:</span>{' '}
          <span className="text-yellow-100">{debugInfo.origin}</span>
        </div>
        
        <div>
          <span className="text-yellow-200/70">Supabase URL:</span>{' '}
          <span className="text-yellow-100">{maskUrl(debugInfo.supabaseUrl)}</span>
        </div>
        
        <div>
          <span className="text-yellow-200/70">detectSessionInUrl:</span>{' '}
          <span className={debugInfo.detectSessionInUrl ? 'text-green-300' : 'text-red-300'}>
            {debugInfo.detectSessionInUrl ? '✅ true' : '❌ false'}
          </span>
        </div>
        
        <div>
          <span className="text-yellow-200/70">Has Session:</span>{' '}
          <span className={debugInfo.hasSession ? 'text-green-300' : 'text-red-300'}>
            {debugInfo.hasSession ? '✅ Yes' : '❌ No'}
          </span>
        </div>
        
        {debugInfo.sessionUserId && (
          <div>
            <span className="text-yellow-200/70">User ID:</span>{' '}
            <span className="text-yellow-100">{debugInfo.sessionUserId.substring(0, 20)}...</span>
          </div>
        )}
        
        {debugInfo.sessionEmail && (
          <div>
            <span className="text-yellow-200/70">Email:</span>{' '}
            <span className="text-yellow-100">{debugInfo.sessionEmail}</span>
          </div>
        )}
        
        <div className="mt-2 pt-2 border-t border-yellow-500/30">
          <span className="text-yellow-200/70">Timestamp:</span>{' '}
          <span className="text-yellow-100">{debugInfo.timestamp}</span>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-yellow-200/70">
        💡 <strong>Tip:</strong> Add <code className="bg-yellow-500/20 px-1 rounded">?debug=1</code> to URL to show this panel
      </div>
    </div>
  )
}

