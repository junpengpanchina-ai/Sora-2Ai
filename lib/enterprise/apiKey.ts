import { createServiceClient } from '@/lib/supabase/service'

export type EnterpriseKeyRow = {
  id: string
  user_id: string
  is_active: boolean
  rate_limit_per_min?: number | null
  webhook_url?: string | null
  webhook_secret?: string | null
  // allow extra columns without typing churn
  [key: string]: unknown
}

export function pickApiKey(req: Request): string | null {
  const h = req.headers
  const x = h.get('x-api-key')
  if (x) return x.trim()
  const auth = h.get('authorization')
  if (auth?.toLowerCase().startsWith('bearer ')) return auth.slice(7).trim()
  return null
}

export async function verifyEnterpriseApiKey(
  req: Request
): Promise<{ ok: true; key: EnterpriseKeyRow } | { ok: false; error: 'MISSING_API_KEY' | 'INVALID_API_KEY' }> {
  const apiKey = pickApiKey(req)
  if (!apiKey) return { ok: false, error: 'MISSING_API_KEY' }

  const supabase = await createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase
  const { data: key, error } = await client
    .from('enterprise_api_keys')
    .select('*')
    .eq('api_key', apiKey)
    .eq('is_active', true)
    .maybeSingle()

  if (error || !key) return { ok: false, error: 'INVALID_API_KEY' }
  return { ok: true, key: key as EnterpriseKeyRow }
}

