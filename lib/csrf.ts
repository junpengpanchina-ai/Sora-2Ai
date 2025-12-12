/**
 * CSRF protection utilities
 * Next.js doesn't have built-in CSRF protection for API routes,
 * so we implement basic Origin/Referer validation
 */

/**
 * Get allowed origins from environment variables
 */
function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const origins: string[] = []
  
  if (appUrl) {
    origins.push(appUrl)
    // Also allow without trailing slash
    if (appUrl.endsWith('/')) {
      origins.push(appUrl.slice(0, -1))
    } else {
      origins.push(`${appUrl}/`)
    }
  }
  
  // Allow localhost in development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://127.0.0.1:3000')
  }
  
  return origins
}

/**
 * Validate request origin/referer to prevent CSRF attacks
 * @param request - The incoming request
 * @returns true if origin is valid, false otherwise
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const allowedOrigins = getAllowedOrigins()
  
  // If no origin/referer and in development, allow (for direct API calls like Postman)
  if (process.env.NODE_ENV === 'development' && !origin && !referer) {
    return true
  }
  
  // Check origin first (more reliable)
  if (origin) {
    // Extract origin from referer if needed
    let originToCheck = origin
    
    // Remove trailing slash for comparison
    if (originToCheck.endsWith('/')) {
      originToCheck = originToCheck.slice(0, -1)
    }
    
    const isValid = allowedOrigins.some(allowed => {
      const normalizedAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed
      return originToCheck === normalizedAllowed
    })
    
    if (isValid) {
      return true
    }
  }
  
  // Fallback to referer check
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = refererUrl.origin
      
      const normalizedReferer = refererOrigin.endsWith('/') 
        ? refererOrigin.slice(0, -1) 
        : refererOrigin
      
      return allowedOrigins.some(allowed => {
        const normalizedAllowed = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed
        return normalizedReferer === normalizedAllowed
      })
    } catch {
      // Invalid URL, reject
      return false
    }
  }
  
  // No origin or referer, reject in production
  return false
}

