/**
 * Internationalization (i18n) utilities
 * Detects user language based on browser settings, URL parameters, or geographic location
 */

export type SupportedLocale = 'en' | 'en-US' | 'ar' | 'ar-SA'

export interface LanguageInfo {
  locale: SupportedLocale
  language: string
  region?: string
  name: string
}

export const supportedLanguages: Record<SupportedLocale, LanguageInfo> = {
  'en': {
    locale: 'en',
    language: 'en',
    name: 'English',
  },
  'en-US': {
    locale: 'en-US',
    language: 'en',
    region: 'US',
    name: 'English (United States)',
  },
  'ar': {
    locale: 'ar',
    language: 'ar',
    name: 'Arabic',
  },
  'ar-SA': {
    locale: 'ar-SA',
    language: 'ar',
    region: 'SA',
    name: 'Arabic (Saudi Arabia)',
  },
}

/**
 * Detect language from Accept-Language header
 */
export function detectLanguageFromHeader(acceptLanguage?: string | null): SupportedLocale {
  if (!acceptLanguage) {
    return 'en'
  }

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [code, q = 'q=1'] = lang.trim().split(';')
      const quality = parseFloat(q.replace('q=', '')) || 1
      return { code: code.toLowerCase(), quality }
    })
    .sort((a, b) => b.quality - a.quality)

  // Check for Arabic (Saudi Arabia)
  for (const lang of languages) {
    if (lang.code.startsWith('ar-sa') || lang.code === 'ar-sa') {
      return 'ar-SA'
    }
    if (lang.code.startsWith('ar')) {
      return 'ar'
    }
  }

  // Check for English
  for (const lang of languages) {
    if (lang.code.startsWith('en-us') || lang.code === 'en-us') {
      return 'en-US'
    }
    if (lang.code.startsWith('en')) {
      return 'en'
    }
  }

  return 'en'
}

/**
 * Detect language from URL parameter
 */
export function detectLanguageFromUrl(searchParams: URLSearchParams): SupportedLocale | null {
  const lang = searchParams.get('lang')
  if (lang && lang in supportedLanguages) {
    return lang as SupportedLocale
  }
  return null
}

/**
 * Get default language based on geographic region
 * This can be enhanced with IP geolocation in the future
 */
export function getDefaultLanguageForRegion(region?: string): SupportedLocale {
  // Map common regions to languages
  const regionMap: Record<string, SupportedLocale> = {
    'SA': 'ar-SA', // Saudi Arabia
    'AE': 'ar',    // United Arab Emirates
    'EG': 'ar',    // Egypt
    'US': 'en-US', // United States
    'GB': 'en',    // United Kingdom
    'CA': 'en',    // Canada
    'AU': 'en',    // Australia
  }

  if (region && region in regionMap) {
    return regionMap[region]
  }

  return 'en'
}

/**
 * Get language from request headers and URL
 */
export function getLanguageFromRequest(
  acceptLanguage?: string | null,
  searchParams?: URLSearchParams,
  region?: string
): SupportedLocale {
  // Priority: URL parameter > Accept-Language header > Geographic region > Default (en)
  
  if (searchParams) {
    const urlLang = detectLanguageFromUrl(searchParams)
    if (urlLang) {
      return urlLang
    }
  }

  if (acceptLanguage) {
    const headerLang = detectLanguageFromHeader(acceptLanguage)
    if (headerLang !== 'en' || !searchParams) {
      return headerLang
    }
  }

  if (region) {
    return getDefaultLanguageForRegion(region)
  }

  return 'en'
}
