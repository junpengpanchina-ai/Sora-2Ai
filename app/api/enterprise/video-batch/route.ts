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

function getRequestId(req: Request): string | null {
  return (
    req.headers.get("x-request-id")?.trim() ??
    req.headers.get("x-idempotency-key")?.trim() ??
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

  // 幂等：若 request_id 已存在且关联了 batch_job_id，直接返回
  if (requestId) {
    const { data: existing, error: existingError } = await client
      .from("enterprise_api_usage")
      .select("batch_job_id")
      .eq("api_key_id", key.id)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingError && existing?.batch_job_id) {
      return NextResponse.json({
        ok: true,
        request_id: requestId,
        batch_id: existing.batch_job_id,
        idempotent_replay: true,
      });
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

  const availableBalance = Number(balanceData ?? 0);
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

  // 如果因 request_id 冲突失败，按幂等重放处理
  if (usageInsertError && requestId && usageInsertError.code === "23505") {
    const { data: existed } = await client
      .from("enterprise_api_usage")
      .select("batch_job_id")
      .eq("api_key_id", key.id)
      .eq("request_id", requestId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existed?.batch_job_id) {
      return NextResponse.json({
        ok: true,
        request_id: requestId,
        batch_id: existed.batch_job_id,
        idempotent_replay: true,
      });
    }
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

  return NextResponse.json({
    ok: true,
    batch_id: batchId,
    total_count: totalCount,
    cost_per_video: costPerVideo,
    status: "queued",
    request_id: requestId ?? null,
  });
}

