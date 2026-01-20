/**
 * P2 Step 3: 影子校验 — 双读比对 users.credits vs wallets，只读不写，供 Admin 对账
 * GET /api/admin/reconcile/legacy-credits
 */
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await validateAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 200), 1000);
  const minAbsDiff = Number(url.searchParams.get("min_abs_diff") ?? 1);

  const { data, error } = await supabase
    .from("admin_credit_mismatch")
    .select("*")
    .order("diff", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[reconcile/legacy-credits] query error:", error);
    return NextResponse.json({ ok: false, error: "QUERY_FAILED", details: error.message }, { status: 500 });
  }

  const rows = (data ?? []).filter((row: { diff?: number }) =>
    typeof row.diff === "number" ? Math.abs(row.diff) >= minAbsDiff : true
  );

  return NextResponse.json({
    ok: true,
    mismatch_count: rows.length,
    rows,
  });
}
