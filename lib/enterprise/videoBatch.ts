import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyEnterpriseApiKey } from '@/lib/enterprise/apiKey'
import { getRequestId } from '@/lib/http/requestId'

function enterpriseJson(body: Record<string, unknown>, requestId: string, init?: ResponseInit) {
  return NextResponse.json(
    {
      ...body,
      mode: 'enterprise',
      request_id: requestId,
    },
    {
      ...init,
      headers: {
        ...(init?.headers ?? {}),
        'x-request-id': requestId,
      },
    }
  )
}

function getMinuteBucketIso(d: Date): string {
  const x = new Date(d)
  x.setUTCSeconds(0, 0)
  return x.toISOString()
}

function unwrapCreditsAny(x: unknown): number {
  if (typeof x === 'number') return x
  if (Array.isArray(x) && typeof x[0] === 'number') return x[0]
  if (x && typeof x === 'object') {
    const o = x as Record<string, unknown>
    const v = o.total ?? o.available ?? o.credits ?? o.value ?? o.result ?? o.data
    if (typeof v === 'number') return v
    if (Array.isArray(v) && typeof v[0] === 'number') return v[0]
  }
  return 0
}

async function tryEnqueueBatch(batchId: string) {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return { enqueued: false, mode: 'pull-worker' as const }

  try {
    const importBullMQ = new Function('return import(\'bullmq\')') as () => Promise<{
      Queue: new (name: string, opts: unknown) => unknown
    }>
    const bullmq = await importBullMQ()
    const queueName = process.env.BATCH_QUEUE_NAME || 'batch_jobs'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queue = new bullmq.Queue(queueName, { connection: { url: redisUrl } }) as any

    await queue.add(
      'batch_job',
      { batch_id: batchId },
      {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      }
    )

    return { enqueued: true, mode: 'bullmq' as const }
  } catch {
    return { enqueued: false, mode: 'pull-worker' as const }
  }
}

export async function handleEnterpriseBatchViaApiKey(req: Request, ctx?: { requestId?: string }) {
  const requestId = (ctx?.requestId ?? getRequestId(req)).slice(0, 128)

  // 0) auth
  const auth = await verifyEnterpriseApiKey(req)
  if (!auth.ok) {
    return enterpriseJson({ ok: false, error: auth.error }, requestId, {
      status: auth.error === 'MISSING_API_KEY' ? 401 : 403,
    })
  }
  const key = auth.key

  const supabase = await createServiceClient()
  // The service client is intentionally untyped here to avoid leaking DB types into this module.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const client = supabase as unknown as {
    from: (table: string) => any
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // 1) parse body
  const body = await req.json().catch(() => null)
  const bodyObj = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const itemsRaw = bodyObj?.items
  const items = Array.isArray(itemsRaw) ? itemsRaw : []
  if (!items.length) {
    return enterpriseJson({ ok: false, error: 'INVALID_PAYLOAD', message: 'items[] is required' }, requestId, {
      status: 400,
    })
  }
  if (items.length > 500) {
    return enterpriseJson(
      { ok: false, error: 'TOO_MANY_ITEMS', message: 'Too many items in one batch (max 500).' },
      requestId,
      { status: 400 }
    )
  }

  // 2) simple rate limit（1分钟窗口）
  const now = new Date()
  const minuteBucket = getMinuteBucketIso(now)
  const limit = typeof key.rate_limit_per_min === 'number' ? key.rate_limit_per_min : 60

  const { count: used, error: rlErr } = await client
    .from('enterprise_api_usage')
    .select('id', { count: 'exact', head: true })
    .eq('api_key_id', key.id)
    .eq('minute_bucket', minuteBucket)

  if (rlErr) {
    return enterpriseJson({ ok: false, error: 'RATE_LIMIT_QUERY_FAILED' }, requestId, { status: 500 })
  }
  if ((used ?? 0) >= limit) {
    return enterpriseJson({ ok: false, error: 'RATE_LIMIT_EXCEEDED' }, requestId, { status: 429 })
  }

  // 3) 定价（可按 key / env）
  const costPerVideo = Number(process.env.ENTERPRISE_BATCH_COST_PER_VIDEO ?? 10) || 10
  const totalCount = items.length
  const requiredCredits = totalCount * costPerVideo

  // 4) 余额预检（credit_wallet）
  const { data: balanceData, error: balanceError } = await client.rpc('get_total_available_credits', {
    user_uuid: key.user_id,
  })
  if (balanceError) {
    return enterpriseJson({ ok: false, error: 'BALANCE_CHECK_FAILED' }, requestId, { status: 500 })
  }
  const availableCredits = unwrapCreditsAny(balanceData)
  if (availableCredits < requiredCredits) {
    return enterpriseJson(
      { ok: false, error: 'INSUFFICIENT_CREDITS', required: requiredCredits, available: availableCredits },
      requestId,
      { status: 402 }
    )
  }

  // 5) 先写 usage（幂等闸门：唯一约束 api_key_id + request_id）
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
  const ua = req.headers.get('user-agent') || null

  let existingBatchId: string | null = null
  if (requestId) {
    const { error: usageInsertError } = await client.from('enterprise_api_usage').insert({
      api_key_id: key.id,
      endpoint: '/api/enterprise/video-batch',
      ip,
      user_agent: ua,
      request_id: requestId,
      minute_bucket: minuteBucket,
    })

    if (usageInsertError && usageInsertError.code === '23505') {
      const { data: existed } = await client
        .from('enterprise_api_usage')
        .select('batch_job_id')
        .eq('api_key_id', key.id)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      existingBatchId = existed?.batch_job_id ?? null

      if (existingBatchId) {
        const { data: batchRow } = await client
          .from('batch_jobs')
          .select('total_count,cost_per_video,status,enqueued_at')
          .eq('id', existingBatchId)
          .maybeSingle()

        const t = Number(batchRow?.total_count ?? 0)
        const c = Number(batchRow?.cost_per_video ?? costPerVideo)
        return enterpriseJson({
          ok: true,
          idempotent_replay: true,
          batch_id: existingBatchId,
          total_count: t,
          cost_per_video: c,
          required_credits: t * c,
          available_credits: availableCredits,
          balance_snapshot: true,
          status: String(batchRow?.status ?? 'queued'),
          enqueue: 'skipped_idempotent',
        }, requestId)
      }

      return enterpriseJson({ ok: false, error: 'IDEMPOTENCY_CONFLICT_NO_BATCH' }, requestId, { status: 409 })
    }

    if (usageInsertError) {
      return enterpriseJson({ ok: false, error: 'USAGE_INSERT_FAILED' }, requestId, { status: 500 })
    }
  }

  // 6) 入库 batch_jobs
  const { data: batchInserted, error: batchErr } = await client
    .from('batch_jobs')
    .insert({
      user_id: key.user_id,
      status: 'queued',
      total_count: totalCount,
      success_count: 0,
      failed_count: 0,
      cost_per_video: costPerVideo,
      frozen_credits: 0,
      // Observability fields (added via migration if present)
      request_id: requestId,
      source: 'enterprise',
      ...(typeof bodyObj?.webhook_url === 'string' && bodyObj.webhook_url.trim()
        ? { webhook_url: bodyObj.webhook_url.trim() }
        : {}),
    })
    .select('id,status,total_count,cost_per_video')
    .single()

  if (batchErr || !batchInserted?.id) {
    return enterpriseJson({ ok: false, error: 'BATCH_INSERT_FAILED' }, requestId, { status: 500 })
  }

  const batchId = String(batchInserted.id)

  // 7) 入库 video_tasks
  const tasksPayload = (items as unknown[]).map((itUnknown: unknown, idx: number) => {
    const it = itUnknown && typeof itUnknown === 'object' ? (itUnknown as Record<string, unknown>) : {}
    return {
    batch_job_id: batchId,
    batch_index: idx,
    status: 'pending',
      prompt: String(it.prompt ?? ''),
      model: it.model ? String(it.model) : null,
      meta: (it as Record<string, unknown>).meta ?? null,
      reference_url: it.reference_url ? String(it.reference_url) : null,
      aspect_ratio: it.aspect_ratio ? String(it.aspect_ratio) : null,
      duration: typeof it.duration === 'number' ? it.duration : null,
    }
  })

  const { error: tasksErr } = await client.from('video_tasks').insert(tasksPayload)
  if (tasksErr) {
    await client
      .from('batch_jobs')
      .update({ status: 'failed', failed_count: totalCount, completed_at: new Date().toISOString() })
      .eq('id', batchId)

    return enterpriseJson({ ok: false, error: 'TASKS_INSERT_FAILED' }, requestId, { status: 500 })
  }

  // 8) 关联 usage -> batch
  if (requestId) {
    await client.from('enterprise_api_usage').update({ batch_job_id: batchId }).eq('api_key_id', key.id).eq('request_id', requestId)
  }

  // 9) enqueue（可选 bullmq；否则 pull-worker）
  const { data: existingBatch } = await client.from('batch_jobs').select('enqueued_at').eq('id', batchId).maybeSingle()

  let enqueueResult: { enqueued: boolean; mode: 'bullmq' | 'pull-worker' } = { enqueued: false, mode: 'pull-worker' }
  if (!existingBatch?.enqueued_at) {
    enqueueResult = await tryEnqueueBatch(batchId)
    if (enqueueResult.enqueued) {
      await client.from('batch_jobs').update({ enqueued_at: new Date().toISOString() }).eq('id', batchId)
    }
  } else {
    enqueueResult = { enqueued: true, mode: 'bullmq' }
  }

  // 10) response
  return enterpriseJson({
    ok: true,
    batch_id: batchId,
    total_count: totalCount,
    cost_per_video: costPerVideo,
    required_credits: requiredCredits,
    available_credits: availableCredits,
    balance_snapshot: true,
    status: 'queued',
    enqueue: enqueueResult.enqueued ? 'queued' : 'pull-worker',
    enqueue_mode: enqueueResult.mode,
  }, requestId)
}

