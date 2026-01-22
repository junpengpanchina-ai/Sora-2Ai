import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type BatchJobDetail = {
  id: string;
  user_id: string;
  status: string;
  total_count: number;
  success_count: number;
  failed_count: number;
  cost_per_video: number;
  frozen_credits: number;
  credits_spent: number;
  settlement_status: string;
  webhook_url: string | null;
  webhook_status: string | null;
  webhook_last_error: string | null;
  webhook_attempts: number | null;
  webhook_last_sent_at: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // 从 credit_ledger 聚合的对账字段
  debit_freeze_delta: number | null;
  refund_delta: number | null;
  net_delta: number | null;
  // 任务列表
  tasks: Array<{
    id: string;
    batch_index: number;
    status: string;
    prompt: string | null;
    video_url: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
  }>;
};

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const batchId = params.id;

  // 1) 查询 batch_jobs
  const { data: batch, error: batchError } = await supabase
    .from("batch_jobs")
    .select("*")
    .eq("id", batchId)
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      { error: "Batch not found", details: batchError?.message },
      { status: 404 },
    );
  }

  // 2) 从 credit_ledger 聚合对账数据
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batchRow = batch as any;
  const batchIdStr = String(batchRow.id);

  const { data: ledgerFreeze } = await supabase
    .from("credit_ledger")
    .select("ref_id, credits_delta")
    .eq("ref_id", batchIdStr)
    .or("ref_type.eq.batch_upfront,ref_type.eq.batch_freeze");

  const { data: ledgerRefund } = await supabase
    .from("credit_ledger")
    .select("ref_id, credits_delta")
    .eq("ref_id", batchIdStr)
    .or("ref_type.eq.batch_refund,type.eq.refund");

  // 聚合
  let debitFreeze: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ledgerFreeze ?? []).forEach((row: any) => {
    debitFreeze = (debitFreeze ?? 0) + Number(row.credits_delta);
  });

  let refund: number | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ledgerRefund ?? []).forEach((row: any) => {
    refund = (refund ?? 0) + Number(row.credits_delta);
  });

  const netDelta =
    debitFreeze !== null && refund !== null
      ? debitFreeze + refund
      : batchRow.credits_spent
        ? -batchRow.credits_spent
        : null;

  // 3) 查询 video_tasks
  const { data: tasks, error: tasksError } = await supabase
    .from("video_tasks")
    .select("id, batch_index, status, prompt, video_url, error_message, created_at, updated_at")
    .eq("batch_job_id", batchId)
    .order("batch_index", { ascending: true });

  if (tasksError) {
    // eslint-disable-next-line no-console
    console.warn("[admin/batch-jobs] load tasks failed", tasksError);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taskList = ((tasks ?? []) as any[]).map((t: any) => ({
    id: String(t.id),
    batch_index: Number(t.batch_index ?? 0),
    status: String(t.status ?? "unknown"),
    prompt: t.prompt ?? null,
    video_url: t.video_url ?? null,
    error_message: t.error_message ?? null,
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  const result: BatchJobDetail = {
    id: batchIdStr,
    user_id: batchRow.user_id,
    status: batchRow.status ?? "unknown",
    total_count: batchRow.total_count ?? 0,
    success_count: batchRow.success_count ?? 0,
    failed_count: batchRow.failed_count ?? 0,
    cost_per_video: batchRow.cost_per_video ?? 0,
    frozen_credits: batchRow.frozen_credits ?? 0,
    credits_spent: batchRow.credits_spent ?? 0,
    settlement_status: batchRow.settlement_status ?? "pending",
    webhook_url: batchRow.webhook_url ?? null,
    webhook_status: batchRow.webhook_status ?? null,
    webhook_last_error: batchRow.webhook_last_error ?? null,
    webhook_attempts: batchRow.webhook_attempts ?? null,
    webhook_last_sent_at: batchRow.webhook_last_sent_at ?? null,
    created_at: batchRow.created_at,
    updated_at: batchRow.updated_at,
    completed_at: batchRow.completed_at ?? null,
    debit_freeze_delta: debitFreeze,
    refund_delta: refund,
    net_delta: netDelta,
    tasks: taskList,
  };

  return NextResponse.json(result);
}
