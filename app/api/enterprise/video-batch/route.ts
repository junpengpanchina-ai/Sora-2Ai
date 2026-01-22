import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type EnterpriseKeyRow = {
  id: string;
  user_id: string;
  is_active: boolean;
  rate_limit_per_min?: number | null;
  // 下面几个字段如果你表里有就会自动用；没有也不影响（不会写入 DB）
  webhook_url?: string | null;
  webhook_secret?: string | null;
};

function pickApiKey(req: Request): string | null {
  const h = req.headers;
  const x = h.get("x-api-key");
  if (x) return x.trim();
  const auth = h.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

function normalizeRequestId(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  // 保险：避免超长 request_id 撑爆索引或日志
  return s.length > 128 ? s.slice(0, 128) : s;
}

function getRequestId(req: Request): string | null {
  return (
    normalizeRequestId(req.headers.get("x-request-id")) ??
    normalizeRequestId(req.headers.get("x-idempotency-key")) ??
    null
  );
}

function getMinuteBucketIso(d: Date): string {
  const x = new Date(d);
  x.setUTCSeconds(0, 0);
  return x.toISOString(); // 例如 2026-01-21T12:34:00.000Z
}

// 兼容 RPC 返回：number / {total|available|credits} / [number]
function unwrapCreditsAny(x: unknown): number {
  if (typeof x === "number") return x;
  if (Array.isArray(x) && typeof x[0] === "number") return x[0];
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    const v =
      o.total ?? o.available ?? o.credits ?? o.value ?? o.result ?? o.data;
    if (typeof v === "number") return v;
    if (Array.isArray(v) && typeof v[0] === "number") return v[0];
  }
  return 0;
}

async function verifyApiKey(req: Request) {
  const apiKey = pickApiKey(req);
  if (!apiKey) return { error: "MISSING_API_KEY" as const };

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;
  const { data: key, error } = await client
    .from("enterprise_api_keys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !key) return { error: "INVALID_API_KEY" as const };
  return { key: key as EnterpriseKeyRow };
}

// 可选：BullMQ enqueue（有 REDIS_URL 才启用）
async function tryEnqueueBatch(batchId: string) {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return { enqueued: false, mode: "pull-worker" as const };

  try {
    // 动态 import，避免你没装 bullmq 时直接 build 挂
    // 使用 Function 构造器避免 webpack 静态分析
    const importBullMQ = new Function(
      "return import('bullmq')",
    ) as () => Promise<{ Queue: new (name: string, opts: unknown) => unknown }>;
    const bullmq = await importBullMQ();
    const queueName = process.env.BATCH_QUEUE_NAME || "batch_jobs";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queue = new bullmq.Queue(queueName, {
      connection: { url: redisUrl },
    }) as {
      add: (
        name: string,
        data: unknown,
        opts?: unknown,
      ) => Promise<unknown>;
    };

    await queue.add(
      "batch_job",
      { batch_id: batchId },
      {
        removeOnComplete: 1000,
        removeOnFail: 5000,
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
      },
    );

    return { enqueued: true, mode: "bullmq" as const };
  } catch {
    // BullMQ 不可用/未安装/连接失败 → 降级为 pull-worker
    return { enqueued: false, mode: "pull-worker" as const };
  }
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);

  // 0) auth
  const auth = await verifyApiKey(req);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error, request_id: requestId },
      { status: auth.error === "MISSING_API_KEY" ? 401 : 403 },
    );
  }
  const key = auth.key;

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 1) parse body
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_PAYLOAD",
        message: "items[] is required",
        request_id: requestId,
      },
      { status: 400 },
    );
  }
  if (items.length > 500) {
    return NextResponse.json(
      {
        ok: false,
        error: "TOO_MANY_ITEMS",
        message: "Too many items in one batch (max 500).",
        request_id: requestId,
      },
      { status: 400 },
    );
  }

  // 2) simple rate limit（1分钟窗口）
  const now = new Date();
  const minuteBucket = getMinuteBucketIso(now);
  const limit =
    typeof key.rate_limit_per_min === "number" ? key.rate_limit_per_min : 60;

  const { count: used, error: rlErr } = await client
    .from("enterprise_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", key.id)
    .eq("minute_bucket", minuteBucket);

  if (rlErr) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMIT_QUERY_FAILED", request_id: requestId },
      { status: 500 },
    );
  }
  if ((used ?? 0) >= limit) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMIT_EXCEEDED", request_id: requestId },
      { status: 429 },
    );
  }

  // 3) 定价（可按 key / env）
  const costPerVideo =
    Number(process.env.ENTERPRISE_BATCH_COST_PER_VIDEO ?? 10) || 10;
  const totalCount = items.length;
  const requiredCredits = totalCount * costPerVideo;

  // 4) 余额预检（credit_wallet）
  const { data: balanceData, error: balanceError } = await client.rpc(
    "get_total_available_credits",
    { user_uuid: key.user_id },
  );
  if (balanceError) {
    return NextResponse.json(
      { ok: false, error: "BALANCE_CHECK_FAILED", request_id: requestId },
      { status: 500 },
    );
  }
  const availableCredits = unwrapCreditsAny(balanceData);

  if (availableCredits < requiredCredits) {
    return NextResponse.json(
      {
        ok: false,
        error: "INSUFFICIENT_CREDITS",
        required: requiredCredits,
        available: availableCredits,
        request_id: requestId,
      },
      { status: 402 }, // Payment Required
    );
  }

  // 5) 先写 usage（幂等闸门：唯一约束 api_key_id + request_id）
  //    - 如果没有 request_id，则按普通请求处理（不保证幂等）
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
  const ua = req.headers.get("user-agent") || null;

  let existingBatchId: string | null = null;

  if (requestId) {
    const { error: usageInsertError } = await client
      .from("enterprise_api_usage")
      .insert({
        api_key_id: key.id,
        endpoint: "/api/enterprise/video-batch",
        ip,
        user_agent: ua,
        request_id: requestId,
        minute_bucket: minuteBucket,
      });

    // 冲突 → 幂等重放：查回旧 batch_job_id
    if (usageInsertError && usageInsertError.code === "23505") {

      const { data: existed } = await client
        .from("enterprise_api_usage")
        .select("batch_job_id")
        .eq("api_key_id", key.id)
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      existingBatchId = existed?.batch_job_id ?? null;

      if (existingBatchId) {
        const { data: batchRow } = await client
          .from("batch_jobs")
          .select("total_count,cost_per_video,status,enqueued_at")
          .eq("id", existingBatchId)
          .maybeSingle();

        const t = Number(batchRow?.total_count ?? 0);
        const c = Number(batchRow?.cost_per_video ?? costPerVideo);
        return NextResponse.json({
          ok: true,
          idempotent_replay: true,
          request_id: requestId,
          batch_id: existingBatchId,
          total_count: t,
          cost_per_video: c,
          required_credits: t * c,
          available_credits: availableCredits,
          balance_snapshot: true, // 生产级护栏 3：明确标识为快照
          status: String(batchRow?.status ?? "queued"),
          enqueue: "skipped_idempotent", // 生产级护栏 2：幂等重放跳过 enqueue
        });
      }

      // 极端情况：usage 有了但 batch_job_id 为空 → 视为可重试错误
      return NextResponse.json(
        {
          ok: false,
          error: "IDEMPOTENCY_CONFLICT_NO_BATCH",
          request_id: requestId,
        },
        { status: 409 },
      );
    }

    if (usageInsertError) {
      return NextResponse.json(
        { ok: false, error: "USAGE_INSERT_FAILED", request_id: requestId },
        { status: 500 },
      );
    }
  }

  // 6) 入库 batch_jobs
  const { data: batchInserted, error: batchErr } = await client
    .from("batch_jobs")
    .insert({
      user_id: key.user_id,
      status: "queued",
      total_count: totalCount,
      success_count: 0,
      failed_count: 0,
      cost_per_video: costPerVideo,
      frozen_credits: 0,
      // credits_spent / settlement_status 由 worker 写
      // webhook_url 从 body 提取（如果有）
      ...(body?.webhook_url ? { webhook_url: String(body.webhook_url) } : {}),
    })
    .select("id,status,total_count,cost_per_video")
    .single();

  if (batchErr || !batchInserted?.id) {
    return NextResponse.json(
      { ok: false, error: "BATCH_INSERT_FAILED", request_id: requestId },
      { status: 500 },
    );
  }

  const batchId = String(batchInserted.id);

  // 7) 入库 video_tasks（最小字段：batch_job_id + batch_index + prompt + status）
  //    你后面要扩展 model/params/seed/webhook 等都可以在 items 里带，落到你的表字段/JSON
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasksPayload = items.map((it: any, idx: number) => ({
    batch_job_id: batchId,
    batch_index: idx,
    status: "queued",
    prompt: String(it?.prompt ?? it?.template ?? ""),
    // 兼容你已有字段：variables / model / meta 等（有就写，没有就忽略）
    ...(it?.model ? { model: String(it.model) } : {}),
    ...(it?.meta ? { meta: it.meta } : {}),
  }));

  const { error: tasksErr } = await client
    .from("video_tasks")
    .insert(tasksPayload);
  if (tasksErr) {
    // 失败则把 batch 标成 failed（不扣费，因为扣费在 worker freeze）
    await client
      .from("batch_jobs")
      .update({
        status: "failed",
        failed_count: totalCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchId);

    return NextResponse.json(
      { ok: false, error: "TASKS_INSERT_FAILED", request_id: requestId },
      { status: 500 },
    );
  }

  // 8) 关联 usage -> batch（如果 request_id 存在）
  if (requestId) {
    await client
      .from("enterprise_api_usage")
      .update({ batch_job_id: batchId })
      .eq("api_key_id", key.id)
      .eq("request_id", requestId);
  }

  // 9) enqueue（可选 bullmq；否则保持 queued，等你 cron/手动 call internal worker）
  //    生产级护栏 1：防止重复 enqueue（检查 enqueued_at）
  const { data: existingBatch } = await client
    .from("batch_jobs")
    .select("enqueued_at")
    .eq("id", batchId)
    .maybeSingle();

  let enqueueResult: { enqueued: boolean; mode: "bullmq" | "pull-worker" } = {
    enqueued: false,
    mode: "pull-worker",
  };

  if (!existingBatch?.enqueued_at) {
    // 只有 enqueued_at 为空时才 enqueue
    enqueueResult = await tryEnqueueBatch(batchId);

    if (enqueueResult.enqueued) {
      // enqueue 成功后写入 enqueued_at（生产级护栏 1）
      await client
        .from("batch_jobs")
        .update({ enqueued_at: new Date().toISOString() })
        .eq("id", batchId);
    }
  } else {
    // 已经 enqueue 过，跳过（幂等保障）
    enqueueResult = { enqueued: true, mode: "bullmq" };
  }

  // 10) success response（5-10行，企业能直接用）
  return NextResponse.json({
    ok: true,
    batch_id: batchId,
    total_count: totalCount,
    cost_per_video: costPerVideo,
    required_credits: requiredCredits,
    available_credits: availableCredits,
    balance_snapshot: true, // 生产级护栏 3：明确标识为快照
    status: "queued",
    request_id: requestId,
    enqueue: enqueueResult.enqueued ? "queued" : "pull-worker", // 生产级护栏 2
    enqueue_mode: enqueueResult.mode,
  });
}
