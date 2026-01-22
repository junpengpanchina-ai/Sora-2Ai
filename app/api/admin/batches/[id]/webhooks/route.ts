import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await validateAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const batchId = params.id;
  if (!batchId) {
    return NextResponse.json({ ok: false, error: "MISSING_BATCH_ID" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 从 batch_jobs 读取 webhook 状态
  const { data: batch } = await client
    .from("batch_jobs")
    .select("webhook_url,webhook_status,webhook_last_error,webhook_attempts,webhook_last_sent_at")
    .eq("id", batchId)
    .maybeSingle();

  if (!batch) {
    return NextResponse.json({ ok: false, error: "BATCH_NOT_FOUND" }, { status: 404 });
  }

  // 如果没有 webhook_url，返回空
  if (!batch.webhook_url) {
    return NextResponse.json({
      ok: true,
      webhook_url: null,
      attempts: [],
      summary: {
        total_attempts: 0,
        success_count: 0,
        failed_count: 0,
        last_status: null,
      },
    });
  }

  // 构建 attempts 记录（从 batch_jobs 字段推断）
  const attempts = [];
  if (batch.webhook_attempts > 0) {
    attempts.push({
      attempt: batch.webhook_attempts,
      status: batch.webhook_status === "sent" ? "success" : "failed",
      http_code: batch.webhook_status === "sent" ? 200 : null,
      error: batch.webhook_last_error ?? null,
      created_at: batch.webhook_last_sent_at ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    webhook_url: batch.webhook_url,
    attempts,
    summary: {
      total_attempts: batch.webhook_attempts ?? 0,
      success_count: batch.webhook_status === "sent" ? 1 : 0,
      failed_count: batch.webhook_status === "failed" ? 1 : 0,
      last_status: batch.webhook_status ?? null,
      last_error: batch.webhook_last_error ?? null,
      last_sent_at: batch.webhook_last_sent_at ?? null,
    },
  });
}
