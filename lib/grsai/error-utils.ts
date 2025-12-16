export type GrsaiViolationType = 'input_moderation' | 'output_moderation' | 'third_party'

interface FriendlyErrorInput {
  failureReason?: string | null
  error?: string | null
  msg?: string | null
  fallback?: string
  httpStatus?: number
  grsaiCode?: number
}

interface FriendlyErrorResult {
  message: string
  violationType?: GrsaiViolationType
}

const VIOLATION_MESSAGES: Record<GrsaiViolationType, string> = {
  input_moderation:
    "Prompt rejected: it contains violent, adult, hateful, or illegal content. Please rewrite it in neutral, policy-compliant language.",
  output_moderation:
    'The generated video triggered output guardrails (graphic violence, nudity, or other unsafe visuals). Try a simpler, safer description.',
  third_party:
    'Blocked by intellectual-property guardrails. Avoid referencing real brands, trademarks, celebrities, or copyrighted characters.',
}

export function formatGrsaiFriendlyError({
  failureReason,
  error,
  msg,
  fallback,
  httpStatus,
  grsaiCode,
}: FriendlyErrorInput = {}): FriendlyErrorResult {
  const normalizedReason = failureReason?.toLowerCase() as GrsaiViolationType | undefined
  if (normalizedReason && VIOLATION_MESSAGES[normalizedReason]) {
    return {
      message: VIOLATION_MESSAGES[normalizedReason],
      violationType: normalizedReason,
    }
  }

  if (error && /third[-\s]?party|copyright|trademark/i.test(error)) {
    return {
      message: VIOLATION_MESSAGES.third_party,
      violationType: 'third_party',
    }
  }

  if (typeof grsaiCode === 'number' && grsaiCode === -22) {
    return {
      message: 'The upstream task could not be found. This request has been cancelled and any credits have been refunded automatically.',
    }
  }

  if (httpStatus === 404) {
    return {
      message:
        'Upstream service returned 404 (task not found). The task was cancelled and your credits were refunded automatically.',
    }
  }

  const detail = (error || msg)?.trim()
  
  // Handle common system errors from Grsai API
  if (detail && /system error|system error please try again/i.test(detail)) {
    return {
      message: 'The video generation service encountered a system error. This is usually temporary. Please try again in a few minutes. Your credits have been automatically refunded.',
    }
  }
  
  // Handle "Failed to generate" errors
  if (detail && /failed to generate/i.test(detail)) {
    return {
      message: detail.includes('system error')
        ? 'The video generation service encountered a system error. Please try again in a few minutes. Your credits have been automatically refunded.'
        : `Video generation failed. ${detail}. Your credits have been automatically refunded.`,
    }
  }
  
  let message =
    fallback ||
    'Video generation failed because the upstream service returned an unexpected error. Please try again in a few minutes. Your credits have been automatically refunded.'
  if (detail) {
    message += ` Details: ${detail}`
  }
  return { message }
}


