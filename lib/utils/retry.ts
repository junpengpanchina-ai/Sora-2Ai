/**
 * 重试工具函数
 * 用于在构建时处理网络连接错误
 */

export interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  onRetry: () => {},
}

/**
 * 带重试的异步函数执行
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数执行结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error | unknown

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === opts.maxRetries) {
        throw error
      }

      // 计算延迟时间
      const delay = opts.exponentialBackoff
        ? opts.retryDelay * Math.pow(2, attempt)
        : opts.retryDelay

      // 调用重试回调
      if (opts.onRetry && error instanceof Error) {
        opts.onRetry(attempt + 1, error)
      }

      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // 理论上不会到达这里，但 TypeScript 需要
  throw lastError
}

/**
 * 带重试的 Supabase 查询
 * @param queryFn Supabase 查询函数
 * @param options 重试选项
 * @returns 查询结果
 */
export async function withRetryQuery<T = unknown>(
  queryFn: () => Promise<{ data: T | null; error: unknown }>,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: unknown }> {
  return withRetry(async () => {
    const result = await queryFn()
    
    // 如果是网络错误，抛出异常以触发重试
    if (result.error) {
      const error = result.error as Error
      const errorMessage = error.message || String(error)
      
      // 检查是否是网络相关错误
      const isNetworkError =
        errorMessage.includes('ECONNRESET') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('network') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT') ||
        errorMessage.includes('socket') ||
        errorMessage.includes('TLS')

      if (isNetworkError) {
        throw error
      }
    }

    return result
  }, options)
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

