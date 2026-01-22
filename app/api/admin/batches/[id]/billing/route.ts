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

  // 账本记录（预扣和退款）
  const { data: ledger, error: ledgerError } = await client
    .from("credit_ledger")
    .select("*")
    .in("ref_type", ["batch_upfront", "batch_refund"])
    .eq("ref_id", batchId)
    .order("created_at", { ascending: true });

  if (ledgerError) {
    return NextResponse.json(
      { ok: false, error: "LEDGER_FETCH_FAILED", details: String(ledgerError) },
      { status: 500 },
    );
  }

  // 计算汇总
  const upfront = (ledger ?? []).filter(
    (l: unknown) => (l as { ref_type?: string })?.ref_type === "batch_upfront",
  );
  const refunds = (ledger ?? []).filter(
    (l: unknown) => (l as { ref_type?: string })?.ref_type === "batch_refund",
  );

  const upfrontTotal = upfront.reduce(
    (sum: number, l: unknown) => sum + Math.abs(Number((l as { credits_delta?: number })?.credits_delta ?? 0)),
    0,
  );
  const refundTotal = refunds.reduce(
    (sum: number, l: unknown) => sum + Math.abs(Number((l as { credits_delta?: number })?.credits_delta ?? 0)),
    0,
  );

  return NextResponse.json({
    ok: true,
    ledger: ledger ?? [],
    summary: {
      upfront_total: upfrontTotal,
      refund_total: refundTotal,
      net_spent: upfrontTotal - refundTotal,
      upfront_count: upfront.length,
      refund_count: refunds.length,
    },
  });
}
