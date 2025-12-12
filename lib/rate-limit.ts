/**
 * Simple in-memory rate limiting utility
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (reset on server restart)
// In production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number // Time window in milliseconds
  keyPrefix?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param options - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now()
  const key = `${options.keyPrefix || 'rate-limit'}:${identifier}`
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    // Simple cleanup: remove expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt < now) {
        rateLimitStore.delete(k)
      }
    }
  }

  // No entry or expired, create new
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + options.windowMs,
    }
    rateLimitStore.set(key, newEntry)
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }

  // Entry exists, check count
  if (entry.count >= options.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  return {
    allowed: true,
    remaining: options.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  // Check various headers (set by proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback (will be same for all requests behind same proxy)
  return 'unknown'
}

