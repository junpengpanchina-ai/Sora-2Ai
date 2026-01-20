import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";
import {
  decideReconcileStatus,
  type ReconcileStatus,
} from "@/lib/admin-reconcile-status";

export const dynamic = "force-dynamic";

function yyyyMmDd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDayUtc(dateStr: string): Date {
  // 统一用 UTC，避免时区混乱；如需 Asia/Shanghai，可在此调整
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function addDaysUtc(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

type DailyRow = {
  date: string;

  total_users: number;
  users_with_wallet: number;

  mismatch_users: number;
  mismatch_gt_0_users: number;
  mismatch_sample_user_ids: string[];

  legacy_credits_write_events: number;
  check_recharge_manual_reconciles: number;

  wallet_total_sum: number;
  wallet_negative_users: number;

  ledger_events_24h: number;

  status: ReconcileStatus;
  note: string;
};

export async function GET(req: Request) {
  const admin = await validateAdminSession();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "ADMIN_UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const today = new Date();
  const date = dateParam ?? yyyyMmDd(today);

  const dayStart = startOfDayUtc(date);
  const dayEnd = addDaysUtc(dayStart, 1);

  const dayStartIso = dayStart.toISOString();
  const dayEndIso = dayEnd.toISOString();

  // 1) total_users
  const { count: totalUsers, error: e1 } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });
  if (e1) {
    console.error("[reconcile-daily] total_users", e1);
    return NextResponse.json({ ok: false, error: "QUERY_FAILED_total_users" }, { status: 500 });
  }

  // 2) users_with_wallet
  const { count: usersWithWallet, error: e2 } = await supabase
    .from("wallets")
    .select("user_id", { count: "exact", head: true });
  if (e2) {
    console.error("[reconcile-daily] users_with_wallet", e2);
    return NextResponse.json(
      { ok: false, error: "QUERY_FAILED_users_with_wallet" },
      { status: 500 }
    );
  }

  // 3) mismatch（使用 admin_credit_mismatch 视图）
  const { data: mismatchRows, error: e3 } = await supabase
    .from("admin_credit_mismatch")
    .select("user_id,diff")
    .limit(1000);
  if (e3) {
    console.error("[reconcile-daily] mismatch", e3);
    return NextResponse.json({ ok: false, error: "QUERY_FAILED_mismatch" }, { status: 500 });
  }

  const mismatchUsers = mismatchRows?.length ?? 0;
  const mismatchGt0Users =
    mismatchRows?.filter((r) => Math.abs(Number((r as { diff: number }).diff ?? 0)) > 0).length ??
    0;
  const mismatchSampleUserIds =
    mismatchRows?.slice(0, 10).map((r) => String((r as { user_id: unknown }).user_id)) ?? [];

  // 4) wallet_total_sum & wallet_negative_users
  const { data: walletsAgg, error: e4 } = await supabase
    .from("wallets")
    .select("permanent_credits, bonus_credits");
  if (e4) {
    console.error("[reconcile-daily] wallets", e4);
    return NextResponse.json({ ok: false, error: "QUERY_FAILED_wallets" }, { status: 500 });
  }

  let walletTotalSum = 0;
  let walletNegativeUsers = 0;
  for (const w of walletsAgg ?? []) {
    const perm = Number((w as { permanent_credits?: number }).permanent_credits ?? 0);
    const bonus = Number((w as { bonus_credits?: number }).bonus_credits ?? 0);
    const total = perm + bonus;
    walletTotalSum += total;
    if (total < 0) walletNegativeUsers += 1;
  }

  // 5) ledger_events_24h（wallet_ledger）
  const { count: ledgerEvents24h, error: e5 } = await supabase
    .from("wallet_ledger")
    .select("id", { count: "exact", head: true })
    .gte("created_at", dayStartIso)
    .lt("created_at", dayEndIso);
  if (e5) {
    console.error("[reconcile-daily] ledger_events_24h", e5);
  }

  // 6) check_recharge_manual_reconciles：目前暂时没有 DB 留痕，先返回 0（后续可用 ledger metadata 补全）
  const checkReconcileManual = 0;

  // 7) legacy_credits_write_events：若未加审计触发器，暂时返回 0
  const legacyWrites = 0;

  const base = {
    date,
    total_users: totalUsers ?? 0,
    users_with_wallet: usersWithWallet ?? 0,
    mismatch_users: mismatchUsers,
    mismatch_gt_0_users: mismatchGt0Users,
    mismatch_sample_user_ids: mismatchSampleUserIds,
    legacy_credits_write_events: legacyWrites,
    check_recharge_manual_reconciles: checkReconcileManual,
    wallet_total_sum: walletTotalSum,
    wallet_negative_users: walletNegativeUsers,
    ledger_events_24h: ledgerEvents24h ?? 0,
  };

  const { status, note } = decideReconcileStatus({
    mismatch_users: base.mismatch_users,
    mismatch_gt_0_users: base.mismatch_gt_0_users,
    legacy_credits_write_events: base.legacy_credits_write_events,
    wallet_negative_users: base.wallet_negative_users,
  });

  const row: DailyRow = {
    ...base,
    status,
    note,
  };

  return NextResponse.json({ ok: true, row });
}

