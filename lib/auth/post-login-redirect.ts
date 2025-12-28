const STORAGE_KEY = 's2ai_post_login_redirect'

/**
 * Only allow internal redirects to avoid open-redirect vulnerabilities.
 * - must start with "/"
 * - must not start with "//"
 * - must not contain a scheme ("://")
 */
export function sanitizeRedirectPath(input: string | null | undefined): string | null {
  if (!input) return null
  const value = String(input).trim()
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//')) return null
  if (value.includes('://')) return null
  // avoid loops
  if (value.startsWith('/auth/callback')) return null
  if (value.startsWith('/login')) return null
  return value
}

export function setPostLoginRedirect(path: string) {
  const safe = sanitizeRedirectPath(path)
  if (!safe) return
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, safe)
    }
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, safe)
    }
  } catch {
    // ignore
  }
}

export function getPostLoginRedirect(): string | null {
  let value: string | null = null
  try {
    if (typeof sessionStorage !== 'undefined') {
      value = sessionStorage.getItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
  if (!value) {
    try {
      if (typeof localStorage !== 'undefined') {
        value = localStorage.getItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }
  return sanitizeRedirectPath(value)
}

export function clearPostLoginRedirect() {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore
  }
}


