import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

type EnterpriseApiKeyRow = {
  id: string;
  user_id: string;
  api_key: string;
  is_active: boolean;
  rate_limit_per_min: number | null;
};

function getApiKey(req: Request): string | null {
  const headerKey = req.headers.get("x-api-key");
  if (headerKey) return headerKey.trim();

  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1]?.trim() ?? null : null;
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

function getClientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  return realIp?.trim() ?? null;
}

function getMinuteBucketIso(d: Date): string {
  const copy = new Date(d);
  copy.setUTCSeconds(0, 0);
  return copy.toISOString();
}

// ---- Unified success response (可卖级保障) ----
type SuccessPayload = {
  ok: true;
  request_id: string | null;
  batch_id: string;
  idempotent_replay?: boolean;
  total_count: number;
  cost_per_video: number;
  required_credits: number;
  available_credits: number;
  status: "queued" | "processing" | "completed" | "partial" | "failed";
};

function successResponse(p: SuccessPayload) {
  return NextResponse.json(p, { status: 200 });
}

async function verifyApiKey(req: Request) {
  const apiKey = getApiKey(req);
  if (!apiKey) {
    return { error: "MISSING_API_KEY" as const };
  }

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  const { data: key, error } = await client
    .from("enterprise_api_keys")
    .select("*")
    .eq("api_key", apiKey)
    .eq("is_active", true)
    .single();

  if (error || !key) {
    return { error: "INVALID_API_KEY" as const };
  }

  return { key: key as EnterpriseApiKeyRow };
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent") ?? null;

  const auth = await verifyApiKey(req);
  if ("error" in auth) {
    const status = auth.error === "MISSING_API_KEY" ? 401 : 403;
    return NextResponse.json(
      { ok: false, error: auth.error, request_id: requestId ?? null },
      { status },
    );
  }

  const { key } = auth;
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 幂等：若 request_id 已存在且关联了 batch_job_id，直接返回完整结构
  if (requestId) {
    const { data: existingUsage, error: existingUsageError } = await client
      .from("enterprise_api_usage")
      .select("batch_job_id")
      .eq("api_key_id", key.id)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingUsageError && existingUsage?.batch_job_id) {
      // 读取旧 batch，返回完整结构（和正常成功一致）
      const { data: existingBatch, error: existingBatchError } = await client
        .from("batch_jobs")
        .select("id,total_count,cost_per_video,status")
        .eq("id", existingUsage.batch_job_id)
        .maybeSingle();

      if (!existingBatchError && existingBatch) {
        const existingTotal = Number(existingBatch.total_count ?? 0);
        const existingCost = Number(existingBatch.cost_per_video ?? 10);
        const existingRequired = existingTotal * existingCost;

        // 获取当前余额（用于返回）
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: balanceData } = await (client as any).rpc(
          "get_total_available_credits",
          { user_uuid: key.user_id },
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = balanceData as any;
        const available =
          typeof raw === "number"
            ? raw
            : typeof raw?.total === "number"
              ? raw.total
              : typeof raw?.available === "number"
                ? raw.available
                : typeof raw?.credits === "number"
                  ? raw.credits
                  : Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "number"
                    ? raw[0]
                    : 0;
        const availableBalance = Number(available) || 0;

        return successResponse({
          ok: true,
          request_id: requestId,
          batch_id: existingBatch.id,
          idempotent_replay: true,
          total_count: existingTotal,
          cost_per_video: existingCost,
          required_credits: existingRequired,
          available_credits: availableBalance,
          status: (existingBatch.status as SuccessPayload["status"]) ?? "queued",
        });
      }
    }
  }

  // 解析 body 并构建 items
  const body = await req.json().catch(() => ({}));

  type BatchItem = { prompt: string };
  type BodyWithItems = { items?: BatchItem[] };

  const parsedBody = body as BodyWithItems;

  const items: BatchItem[] = Array.isArray(parsedBody.items)
    ? parsedBody.items.filter(
        (it) => typeof it?.prompt === "string" && it.prompt.trim().length > 0,
      )
    : [];

  if (!items.length) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_PAYLOAD",
        message: "items[] with { prompt: string } is required",
        request_id: requestId ?? null,
      },
      { status: 400 },
    );
  }

  const totalCount = items.length;
  if (totalCount > 500) {
    return NextResponse.json(
      {
        ok: false,
        error: "TOO_MANY_ITEMS",
        message: "Too many items in one batch (max 500).",
        request_id: requestId ?? null,
      },
      { status: 400 },
    );
  }

  // 余额预检：计算预计成本并检查 credit_wallet 余额
  const defaultCostPerVideo =
    typeof process.env.ENTERPRISE_BATCH_COST_PER_VIDEO === "string"
      ? Number(process.env.ENTERPRISE_BATCH_COST_PER_VIDEO)
      : 10;

  const costPerVideo =
    Number.isFinite(defaultCostPerVideo) && defaultCostPerVideo > 0
      ? defaultCostPerVideo
      : 10;

  const estimatedCredits = totalCount * costPerVideo;

  // 使用现有 RPC 获取用户总可用积分（credit_wallet）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: balanceData, error: balanceError } = await (client as any).rpc(
    "get_total_available_credits",
    { user_uuid: key.user_id },
  );

  if (balanceError) {
    // eslint-disable-next-line no-console
    console.error("[enterprise/video-batch] balance check failed", balanceError);
    return NextResponse.json(
      {
        ok: false,
        error: "BALANCE_CHECK_FAILED",
        request_id: requestId ?? null,
      },
      { status: 500 },
    );
  }

  // 稳健解包：兼容 RPC 返回 INTEGER / {total} / {available} / {credits} 等多种形态
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = balanceData as any;
  const available =
    typeof raw === "number"
      ? raw
      : typeof raw?.total === "number"
        ? raw.total
        : typeof raw?.available === "number"
          ? raw.available
          : typeof raw?.credits === "number"
            ? raw.credits
            : Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "number"
              ? raw[0]
              : 0;
  const availableBalance = Number(available) || 0;
  if (availableBalance < estimatedCredits) {
    return NextResponse.json(
      {
        ok: false,
        error: "INSUFFICIENT_CREDITS",
        message: `Insufficient credits. Required: ${estimatedCredits}, Available: ${availableBalance}`,
        required: estimatedCredits,
        available: availableBalance,
        request_id: requestId ?? null,
      },
      { status: 402 }, // 402 Payment Required
    );
  }

  const now = new Date();
  const bucket = getMinuteBucketIso(now);
  const limit =
    typeof key.rate_limit_per_min === "number"
      ? key.rate_limit_per_min
      : 60;

  // 写 usage，一条请求一条记录（带 minute_bucket / request_id）
  const { error: usageInsertError } = await client
    .from("enterprise_api_usage")
    .insert({
      api_key_id: key.id,
      endpoint: "/api/enterprise/video-batch",
      ip,
      user_agent: userAgent,
      request_id: requestId,
      minute_bucket: bucket,
    });

  // ----------------- 可直接覆盖的幂等冲突处理（23505） -----------------
  if (usageInsertError && requestId && usageInsertError.code === "23505") {
    // 幂等重放：找到之前那条 usage，拿到 batch_job_id
    const { data: existedUsage, error: existedUsageError } = await client
      .from("enterprise_api_usage")
      .select("batch_job_id")
      .eq("api_key_id", key.id)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existedUsageError) {
      // eslint-disable-next-line no-console
      console.error("[enterprise/video-batch] idempotency_lookup_failed", {
        request_id: requestId,
        api_key_id: key.id,
        error: existedUsageError,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "IDEMPOTENCY_LOOKUP_FAILED",
          request_id: requestId,
        },
        { status: 500 },
      );
    }

    if (!existedUsage?.batch_job_id) {
      // 理论上不会发生：有 unique 冲突却查不到记录
      return NextResponse.json(
        {
          ok: false,
          error: "IDEMPOTENCY_INCONSISTENT",
          request_id: requestId,
        },
        { status: 500 },
      );
    }

    // 读取旧 batch，返回完整结构（和正常成功一致）
    const { data: existingBatch, error: existingBatchError } = await client
      .from("batch_jobs")
      .select("id,total_count,cost_per_video,status")
      .eq("id", existedUsage.batch_job_id)
      .maybeSingle();

    if (existingBatchError || !existingBatch) {
      // eslint-disable-next-line no-console
      console.error("[enterprise/video-batch] idempotency_batch_not_found", {
        request_id: requestId,
        batch_id: existedUsage.batch_job_id,
        error: existingBatchError,
      });
      return NextResponse.json(
        {
          ok: false,
          error: "IDEMPOTENCY_BATCH_NOT_FOUND",
          request_id: requestId,
        },
        { status: 500 },
      );
    }

    const existingTotal = Number(existingBatch.total_count ?? 0);
    const existingCost = Number(existingBatch.cost_per_video ?? costPerVideo);
    const existingRequired = existingTotal * existingCost;

    return successResponse({
      ok: true,
      request_id: requestId,
      batch_id: existingBatch.id,
      idempotent_replay: true,
      total_count: existingTotal,
      cost_per_video: existingCost,
      required_credits: existingRequired,
      available_credits: Number(availableBalance ?? 0),
      status: (existingBatch.status as SuccessPayload["status"]) ?? "queued",
    });
  }

  // 按 minute_bucket 做硬限流
  const usageCountRes = await client
    .from("enterprise_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", key.id)
    .eq("minute_bucket", bucket);

  const used =
    (usageCountRes as { count?: number | null }).count ?? 0;

  if (used > limit) {
    return NextResponse.json(
      {
        ok: false,
        error: "RATE_LIMIT_EXCEEDED",
        limit,
        used,
        request_id: requestId ?? null,
      },
      { status: 429 },
    );
  }

  // 从 body 提取 webhook_url（可选）
  type BodyWithWebhook = BodyWithItems & { webhook_url?: string };
  const webhookUrl =
    typeof (body as BodyWithWebhook).webhook_url === "string"
      ? (body as BodyWithWebhook).webhook_url?.trim() ?? null
      : null;

  const { data: batch, error: batchError } = await client
    .from("batch_jobs")
    .insert({
      user_id: key.user_id,
      status: "queued",
      total_count: totalCount,
      cost_per_video: costPerVideo,
      webhook_url: webhookUrl,
      webhook_status: webhookUrl ? "pending" : null,
      // 先交给内部 Worker 进行冻结和结算；此处不直接扣费
    })
    .select("*")
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      {
        ok: false,
        error: "BATCH_CREATE_FAILED",
        message:
          batchError?.message ?? "failed to create batch_jobs record",
        request_id: requestId ?? null,
      },
      { status: 500 },
    );
  }

  const batchId: string = batch.id;

  // 为每个 item 创建占位的 video_tasks 记录（由内部 Worker/现有流水线消费）
  const taskRows = items.map((item, index) => ({
    user_id: key.user_id,
    prompt: item.prompt,
    status: "pending",
    batch_job_id: batchId,
    batch_index: index,
  }));

  const { error: tasksError } = await client
    .from("video_tasks")
    .insert(taskRows);

  if (tasksError) {
    // 如果子任务插入失败，标记 batch 为 failed，方便排查
    await client
      .from("batch_jobs")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", batchId);

    return NextResponse.json(
      {
        ok: false,
        error: "VIDEO_TASKS_CREATE_FAILED",
        message: tasksError.message,
        request_id: requestId ?? null,
      },
      { status: 500 },
    );
  }

  // 回写 usage.batch_job_id（非关键路径，失败不阻断）
  if (requestId) {
    client
      .from("enterprise_api_usage")
      .update({ batch_job_id: batchId })
      .eq("api_key_id", key.id)
      .eq("request_id", requestId)
      .then(() => {
        // no-op
      })
      .catch((e: unknown) => {
        // eslint-disable-next-line no-console
        console.error(
          "[enterprise/video-batch] usage batch_job_id update failed",
          e,
        );
      });
  }

  // 触发 internal worker（非阻塞，失败不影响批次创建）
  const workerSecret = process.env.INTERNAL_WORKER_SECRET;
  if (workerSecret) {
    const workerUrl = new URL("/api/internal/batch-worker", req.url).toString();
    fetch(workerUrl, {
      method: "POST",
      headers: { "x-worker-secret": workerSecret },
    }).catch(() => {
      // 静默失败，worker 会通过 cron 自动处理
    });
  }

  // ----------------- 正常成功返回（可直接覆盖你 395-404 行） -----------------
  return successResponse({
    ok: true,
    request_id: requestId ?? null,
    batch_id: batchId,
    total_count: totalCount,
    cost_per_video: costPerVideo,
    required_credits: estimatedCredits,
    available_credits: availableBalance,
    status: "queued",
  });
}

