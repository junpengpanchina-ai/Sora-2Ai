import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

async function verifyApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
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

  return { key };
}

export async function POST(req: Request) {
  const auth = await verifyApiKey(req);
  if ("error" in auth) {
    const status = auth.error === "MISSING_API_KEY" ? 401 : 403;
    return NextResponse.json({ ok: false, error: auth.error }, { status });
  }

  const { key } = auth;
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 简单限流：按最近 60 秒的调用次数对比 rate_limit_per_min
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60_000).toISOString();

  const usageCountRes = await client
    .from("enterprise_api_usage")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", key.id)
    .gte("created_at", oneMinuteAgo);

  const used =
    (usageCountRes as { count?: number | null }).count ?? 0;

  const limit =
    typeof key.rate_limit_per_min === "number"
      ? key.rate_limit_per_min
      : 60;

  if (used >= limit) {
    return NextResponse.json(
      { ok: false, error: "RATE_LIMIT_EXCEEDED" },
      { status: 429 },
    );
  }

  // 记录 usage（不阻断主流程）
  client
    .from("enterprise_api_usage")
    .insert({
      api_key_id: key.id,
      endpoint: "/api/enterprise/video-batch",
    })
    .then(() => {
      // no-op
    })
    .catch((e: unknown) => {
      console.error("[enterprise/video-batch] usage insert failed", e);
    });

  // TODO: 在这里解析 body 并创建 batch_jobs + video_tasks
  // 目前先返回占位响应，确保 API 形状固定
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    ok: true,
    message: "video-batch endpoint is wired with API key + rate limit. Batch creation logic to be implemented.",
    received: body,
  });
}

