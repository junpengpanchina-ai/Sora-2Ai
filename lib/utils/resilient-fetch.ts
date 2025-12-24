import type { RetryOptions } from './retry'
import { withRetry } from './retry'

export interface ResilientFetchOptions extends RetryOptions {
  /**
   * Per-attempt timeout. If exceeded, the attempt aborts and may retry.
   */
  timeoutMs?: number
  /**
   * Add `Connection: keep-alive` header when possible (Node runtimes).
   */
  keepAlive?: boolean
  /**
   * When true, if all retries fail with a retryable network error, return a 503 Response
   * instead of throwing. This is useful for SDKs (e.g., Supabase) that can surface HTTP errors
   * cleanly without crashing the caller (and avoids noisy stack traces during builds).
   */
  returnErrorResponseOnFailure?: boolean
}

function isRetryableFetchError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const msg = (error.message || '').toLowerCase()
  const causeCode = (error as Error & { cause?: { code?: string } }).cause?.code

  return (
    error.name === 'AbortError' ||
    msg.includes('fetch failed') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('timeout') ||
    msg.includes('socket') ||
    msg.includes('tls') ||
    msg.includes('other side closed') ||
    causeCode === 'UND_ERR_SOCKET' ||
    causeCode === 'ECONNRESET'
  )
}

function createAbortSignalWithTimeout(initSignal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let onAbort: (() => void) | null = null
  if (initSignal) {
    if (initSignal.aborted) {
      clearTimeout(timeoutId)
      controller.abort()
    } else {
      onAbort = () => controller.abort()
      initSignal.addEventListener('abort', onAbort, { once: true })
    }
  }

  const cleanup = () => {
    clearTimeout(timeoutId)
    if (initSignal && onAbort) {
      initSignal.removeEventListener('abort', onAbort)
    }
  }

  return { signal: controller.signal, cleanup }
}

export async function resilientFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 30000

  try {
    return await withRetry(
      async () => {
        const { signal, cleanup } = createAbortSignalWithTimeout(init?.signal, timeoutMs)
        try {
          const headers = new Headers(init?.headers)
          if (options.keepAlive) {
            headers.set('Connection', 'keep-alive')
          }

          return await fetch(input, {
            ...init,
            signal,
            headers,
          })
        } catch (error) {
          if (isRetryableFetchError(error)) {
            throw error
          }
          // Non-retryable: rethrow immediately.
          throw error
        } finally {
          cleanup()
        }
      },
      {
        maxRetries: options.maxRetries ?? 3,
        retryDelay: options.retryDelay ?? 500,
        exponentialBackoff: options.exponentialBackoff ?? true,
        onRetry: options.onRetry ?? (() => {}),
      }
    )
  } catch (error) {
    // Optionally avoid throwing retryable network errors to prevent noisy stacks.
    // Returning a non-2xx Response lets callers (e.g., Supabase) surface a normal HTTP error object.
    if (options.returnErrorResponseOnFailure && isRetryableFetchError(error)) {
      return new Response(
        JSON.stringify({
          error: 'fetch_failed',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 503,
          headers: {
            'content-type': 'application/json',
          },
        }
      )
    }
    throw error
  }
}


