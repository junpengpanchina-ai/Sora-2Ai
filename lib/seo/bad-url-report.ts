/**
 * 坏 URL 打点：middleware 命中时异步上报，用于每日汇总监控
 */
import type { NextRequest } from 'next/server'

export function reportBadUrlHit(req: NextRequest, pattern: string): void {
  const secret = process.env.INTERNAL_METRICS_SECRET
  const endpoint = process.env.INTERNAL_METRICS_ENDPOINT

  if (!secret || !endpoint) return

  const payload = {
    pattern,
    path: req.nextUrl.pathname,
    ua: req.headers.get('user-agent') || '',
  }

  fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-internal-metrics-secret': secret,
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {})
}
