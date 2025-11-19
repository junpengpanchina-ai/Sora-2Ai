/**
 * Client-side error logger
 * Sends errors to server API so they appear in Vercel logs
 */

interface LogContext {
  url?: string
  userAgent?: string
  [key: string]: any
}

/**
 * Log an error to the server (visible in Vercel Dashboard)
 */
export async function logError(
  error: Error | string | unknown,
  context?: LogContext
): Promise<void> {
  try {
    const errorData = error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : typeof error === 'string'
      ? { message: error }
      : error

    await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: errorData,
        context: {
          ...context,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        },
        level: 'error',
      }),
    }).catch((err) => {
      // Silently fail if logging fails (don't break the app)
      console.error('Failed to send error log:', err)
    })
  } catch (err) {
    // Silently fail if logging fails
    console.error('Error logger failed:', err)
  }
}

/**
 * Log a warning to the server
 */
export async function logWarning(
  message: string,
  context?: LogContext
): Promise<void> {
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: { message },
        context: {
          ...context,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
        level: 'warn',
      }),
    }).catch(() => {
      // Silently fail
    })
  } catch (err) {
    // Silently fail
  }
}

/**
 * Log info to the server (for debugging)
 */
export async function logInfo(
  message: string,
  context?: LogContext
): Promise<void> {
  try {
    await fetch('/api/log-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: { message },
        context: {
          ...context,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
        },
        level: 'info',
      }),
    }).catch(() => {
      // Silently fail
    })
  } catch (err) {
    // Silently fail
  }
}

