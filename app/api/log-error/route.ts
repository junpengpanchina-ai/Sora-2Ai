import { NextRequest, NextResponse } from 'next/server'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * API route to log client-side errors to server logs
 * This allows Vercel to see errors that occur in the browser
 */
/**
 * Sanitize error data to remove sensitive information
 */
function sanitizeErrorData(error: unknown): unknown {
  if (typeof error === 'string') {
    return sanitizeString(error)
  }
  
  if (error instanceof Error) {
    return {
      message: sanitizeString(error.message),
      name: error.name,
      // Only include stack trace in development
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }
  
  if (typeof error === 'object' && error !== null) {
    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'apikey', 'authorization', 'auth', 'credential', 'session']
    
    for (const [key, value] of Object.entries(error)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk))
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value)
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }
  
  return error
}

/**
 * Sanitize string to remove potential sensitive patterns
 */
function sanitizeString(str: string): string {
  // Remove potential API keys, tokens, etc.
  // This is a basic sanitization - adjust based on your needs
  return str
    .replace(/password["\s:=]+[^,\s}"]+/gi, 'password=[REDACTED]')
    .replace(/token["\s:=]+[^,\s}"]+/gi, 'token=[REDACTED]')
    .replace(/api[_-]?key["\s:=]+[^,\s}"]+/gi, 'apiKey=[REDACTED]')
    .replace(/secret["\s:=]+[^,\s}"]+/gi, 'secret=[REDACTED]')
}

/**
 * Sanitize context object to remove sensitive information
 */
function sanitizeContext(context: unknown): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}
  
  if (typeof context === 'object' && context !== null) {
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'apiKey', 'authorization']
    
    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase()
      const isSensitive = sensitiveKeys.some(sk => lowerKey.includes(sk))
      
      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value)
      } else {
        sanitized[key] = value
      }
    }
  }
  
  return sanitized
}

export async function POST(request: NextRequest) {
  // #region agent log
  const requestIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/log-error/route.ts:79',message:'Error log API - ENTRY',data:{requestIp,hasBody:true},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  try {
    const body = await request.json()
    const { error, context, level = 'error' } = body
    // #region agent log
    const errorStr = typeof error === 'string' ? error : JSON.stringify(error).substring(0,200)
    const hasStack = typeof error === 'object' && error && 'stack' in error
    const contextStr = JSON.stringify(context).substring(0,200)
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/log-error/route.ts:87',message:'Error log API - DATA RECEIVED',data:{errorPreview:errorStr,hasStack,contextPreview:contextStr,level,requestIp},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // SECURITY FIX: Sanitize error and context data to prevent sensitive information leakage
    const sanitizedError = sanitizeErrorData(error)
    const sanitizedContext = sanitizeContext(context || {})
    
    // #region agent log
    const sanitizedErrorStr = typeof sanitizedError === 'string' ? sanitizedError : JSON.stringify(sanitizedError).substring(0,200)
    fetch('http://127.0.0.1:7242/ingest/ef411af9-a357-4528-93a0-017b8708eb6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/log-error/route.ts:96',message:'Error log API - DATA SANITIZED',data:{sanitizedErrorPreview:sanitizedErrorStr,level,requestIp},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Log to Vercel function logs (visible in Vercel Dashboard)
    // Only include sanitized data
    const logData = {
      level,
      error: sanitizedError,
      context: {
        ...sanitizedContext,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        referer: sanitizedContext.url || request.headers.get('referer'),
        url: sanitizedContext.url || request.headers.get('referer'),
      },
    }

    // Use appropriate console method based on level
    if (level === 'error') {
      console.error('[Client Error]', JSON.stringify(logData, null, 2))
    } else if (level === 'warn') {
      console.warn('[Client Warning]', JSON.stringify(logData, null, 2))
    } else {
      console.log('[Client Log]', JSON.stringify(logData, null, 2))
    }

    return NextResponse.json({ 
      success: true,
      logged: true,
    })
  } catch (err) {
    // If logging itself fails, log to console
    console.error('[Log Error API] Failed to log error:', err)
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

