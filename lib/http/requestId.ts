import { randomUUID } from 'crypto'

export function getRequestId(req: Request): string {
  const h = req.headers

  const fromHeader =
    h.get('x-request-id') ||
    h.get('request-id') ||
    h.get('idempotency-key') ||
    h.get('x-idempotency-key') ||
    h.get('x-requestid')

  if (fromHeader && fromHeader.trim()) return fromHeader.trim().slice(0, 128)

  return randomUUID()
}

