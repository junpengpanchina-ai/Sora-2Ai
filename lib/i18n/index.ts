import { messages, type Locale } from './messages'

/**
 * English-first (current phase):
 * - We keep the locale parameter for future expansion.
 * - For now we intentionally force `en` in non-admin flows.
 */
export function getLocaleFromRequest(): Locale {
  return 'en'
}

export function getMessages(locale: Locale = 'en') {
  // Intentionally no zh fallback behavior yet (zh is placeholder).
  return locale === 'en' ? messages.en : messages.en
}

