import { NextRequest, NextResponse } from 'next/server'

/**
 * API route to log client-side errors to server logs
 * This allows Vercel to see errors that occur in the browser
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { error, context, level = 'error' } = body

    // Log to Vercel function logs (visible in Vercel Dashboard)
    const logData = {
      level,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : error,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        url: context?.url || request.headers.get('referer'),
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

