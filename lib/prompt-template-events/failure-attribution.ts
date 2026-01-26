export type PromptFailureType = 'moderation' | 'third_party'

export type PromptFailureAttribution = {
  failure_type: PromptFailureType
  fail_code: string
}

function hasAny(hay: string, needles: string[]) {
  const s = hay.toLowerCase()
  return needles.some((n) => s.includes(n))
}

/**
 * Gate v1 only needs 2 buckets:
 * - moderation: unsafe content (input/output moderation)
 * - third_party: everything else (timeouts, 5xx, network, auth, ip/copyright...)
 *
 * We still return a `fail_code` for debugging & future analytics.
 */
export function attributePromptFailure(input: {
  failureReason?: string | null
  violationType?: string | null
  error?: string | null
  httpStatus?: number | null
}): PromptFailureAttribution {
  const reason = (input.failureReason || input.violationType || '').toLowerCase()
  const error = (input.error || '').toLowerCase()
  const http = typeof input.httpStatus === 'number' ? input.httpStatus : null

  if (reason === 'input_moderation' || reason === 'output_moderation') {
    return { failure_type: 'moderation', fail_code: reason }
  }

  if (hasAny(error, ['third_party', 'copyright', 'trademark', 'brand', 'celebrity', 'intellectual-property', 'ip'])) {
    return { failure_type: 'third_party', fail_code: 'ip' }
  }

  if (http === 401 || hasAny(error, ['401', 'unauthorized', 'api key is invalid', 'invalid api key', 'expired'])) {
    return { failure_type: 'third_party', fail_code: 'auth' }
  }
  if (http === 403 || hasAny(error, ['403', 'forbidden', 'permission'])) {
    return { failure_type: 'third_party', fail_code: 'forbidden' }
  }
  if (http === 429 || hasAny(error, ['429', 'rate limit'])) {
    return { failure_type: 'third_party', fail_code: 'rate_limit' }
  }
  if (http && http >= 500) {
    return { failure_type: 'third_party', fail_code: `upstream_${http}` }
  }

  if (hasAny(error, ['timeout', 'timed out', 'request timeout', 'etimedout'])) {
    return { failure_type: 'third_party', fail_code: 'timeout' }
  }
  if (
    hasAny(error, [
      'fetch failed',
      'econnreset',
      'socket hang up',
      'connection reset',
      'connection failed',
      'network',
      'dns',
    ])
  ) {
    return { failure_type: 'third_party', fail_code: 'network' }
  }

  if (hasAny(error, ['invalid', 'bad request', 'parameter', 'prompt cannot', 'schema', 'parse'])) {
    return { failure_type: 'third_party', fail_code: 'param_error' }
  }

  return { failure_type: 'third_party', fail_code: 'unknown' }
}

