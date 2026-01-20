import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";
import { decideStatusFromWindow } from "./snapshot/route";

export const dynamic = "force-dynamic";

function clampInt(v: string | null, def: number, min: number, max: number) {
  const n = Number(v ?? "");
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

export async function GET(req: Request) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const days = clampInt(url.searchParams.get("days"), 14, 1, 90);

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("credit_reconciliation_daily")
    .select("*")
    .order("date", { ascending: true })
    .limit(days);

  if (error) {
    return NextResponse.json(
      { ok: false, error: "query_failed", detail: error.message },
      { status: 500 },
    );
  }

  const rows = data ?? [];
  const decision = decideStatusFromWindow(
    rows as Array<{
      mismatch_users?: number | null;
      wallet_negative_users?: number | null;
      legacy_credits_write_events?: number | null;
    }>,
  );

  return NextResponse.json({
    ok: true,
    days,
    status: decision.status,
    note: decision.note,
    rows,
  });
}

