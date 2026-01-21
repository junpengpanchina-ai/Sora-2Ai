import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

type BatchJobWithLedger = {
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
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  // 从 credit_ledger 聚合的对账字段
  debit_freeze_delta: number | null; // freeze 阶段扣的（负数）
  refund_delta: number | null; // finalize 阶段退的（正数）
  net_delta: number | null; // 实际扣费（一般 = -credits_spent）
};

export async function GET(req: Request) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
  const userId = searchParams.get("userId");
  const status = searchParams.get("status");

  // 1) 查询 batch_jobs
  let query = supabase
    .from("batch_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (userId) {
    query = query.eq("user_id", userId);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data: batches, error: batchError } = await query;

  if (batchError) {
    return NextResponse.json(
      { error: "Failed to fetch batch_jobs", details: batchError.message },
      { status: 500 },
    );
  }

  if (!batches || batches.length === 0) {
    return NextResponse.json({ batches: [], count: 0 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batchRows = batches as any[];
  const batchIds = batchRows.map((b) => String(b.id));

  // 2) 从 credit_ledger 聚合对账数据
  // freeze 阶段：ref_type = 'batch_upfront' 或 type = 'spend' + ref_id = batch_id
  // refund 阶段：ref_type = 'batch_refund' 或 type = 'refund' + ref_id = batch_id
  const { data: ledgerFreeze, error: ledgerFreezeError } = await supabase
    .from("credit_ledger")
    .select("ref_id, credits_delta")
    .in("ref_id", batchIds)
    .or("ref_type.eq.batch_upfront,ref_type.eq.batch_freeze");

  const { data: ledgerRefund, error: ledgerRefundError } = await supabase
    .from("credit_ledger")
    .select("ref_id, credits_delta")
    .in("ref_id", batchIds)
    .or("ref_type.eq.batch_refund,type.eq.refund");

  if (ledgerFreezeError || ledgerRefundError) {
    // eslint-disable-next-line no-console
    console.warn("[admin/batch-jobs] ledger query failed", {
      freeze: ledgerFreezeError,
      refund: ledgerRefundError,
    });
  }

  // 聚合：按 batch_id 汇总
  const freezeMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((ledgerFreeze ?? []) as any[]).forEach((row: any) => {
    const batchId = String(row.ref_id);
    freezeMap.set(batchId, (freezeMap.get(batchId) ?? 0) + Number(row.credits_delta));
  });

  const refundMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((ledgerRefund ?? []) as any[]).forEach((row: any) => {
    const batchId = String(row.ref_id);
    refundMap.set(batchId, (refundMap.get(batchId) ?? 0) + Number(row.credits_delta));
  });

  // 3) 组装结果
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: BatchJobWithLedger[] = batchRows.map((batch: any) => {
    const batchId = String(batch.id);
    const debitFreeze = freezeMap.get(batchId) ?? null;
    const refund = refundMap.get(batchId) ?? null;
    const netDelta =
      debitFreeze !== null && refund !== null
        ? debitFreeze + refund
        : batch.credits_spent
          ? -batch.credits_spent
          : null;

    return {
      id: batchId,
      user_id: batch.user_id,
      status: batch.status,
      total_count: batch.total_count ?? 0,
      success_count: batch.success_count ?? 0,
      failed_count: batch.failed_count ?? 0,
      cost_per_video: batch.cost_per_video ?? 0,
      frozen_credits: batch.frozen_credits ?? 0,
      credits_spent: batch.credits_spent ?? 0,
      settlement_status: batch.settlement_status ?? "pending",
      webhook_url: batch.webhook_url ?? null,
      webhook_status: batch.webhook_status ?? null,
      webhook_last_error: batch.webhook_last_error ?? null,
      created_at: batch.created_at,
      updated_at: batch.updated_at,
      completed_at: batch.completed_at ?? null,
      debit_freeze_delta: debitFreeze,
      refund_delta: refund,
      net_delta: netDelta,
    };
  });

  return NextResponse.json({
    batches: result,
    count: result.length,
  });
}
