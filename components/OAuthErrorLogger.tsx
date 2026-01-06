'use client'

import { useEffect } from 'react'

interface OAuthErrorLoggerProps {
  error?: string | null
  pathname?: string
}

/**
 * 记录 OAuth 登录错误到日志系统
 * 不记录敏感信息（code、token、email 全量）
 */
export default function OAuthErrorLogger({ error, pathname }: OAuthErrorLoggerProps) {
  useEffect(() => {
    if (!error) return

    // 提取错误代码和描述
    const errorMatch = error.match(/^([^:]+):\s*(.+)$/)
    const errorCode = errorMatch ? errorMatch[1] : error
    const errorDescription = errorMatch ? errorMatch[2] : null

    // 尝试从错误消息中提取更多信息
    let extractedErrorCode: string | null = null
    if (error.includes('invalid_client')) {
      extractedErrorCode = 'invalid_client'
    } else if (error.includes('redirect_uri_mismatch')) {
      extractedErrorCode = 'redirect_uri_mismatch'
    } else if (error.includes('invalid_grant')) {
      extractedErrorCode = 'invalid_grant'
    } else if (error.includes('server_error')) {
      extractedErrorCode = 'server_error'
    } else if (error.includes('Unable to exchange external code')) {
      extractedErrorCode = 'exchange_failed'
    }

    // 记录错误到日志 API
    const logError = async () => {
      try {
        await fetch('/api/log-oauth-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            error: errorCode,
            error_description: errorDescription || error,
            error_code: extractedErrorCode,
            origin: typeof window !== 'undefined' ? window.location.origin : null,
            pathname: pathname || (typeof window !== 'undefined' ? window.location.pathname : null),
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            timestamp: new Date().toISOString(),
          }),
        })
      } catch (logError) {
        // 静默失败，不影响用户体验
        console.error('[OAuth Error Logger] Failed to log error:', logError)
      }
    }

    logError()
  }, [error, pathname])

  return null // 不渲染任何内容
}

