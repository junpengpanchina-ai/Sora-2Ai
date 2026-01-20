import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";

async function detectLedgerTable(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
): Promise<"wallet_ledger" | "credit_ledger" | null> {
  const t1 = await supabase.from("wallet_ledger").select("id").limit(1);
  if (!t1.error) return "wallet_ledger";
  const t2 = await supabase.from("credit_ledger").select("id").limit(1);
  if (!t2.error) return "credit_ledger";
  return null;
}

async function detectLegacyAudit(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
): Promise<boolean> {
  const t = await supabase.from("legacy_credits_audit").select("id").limit(1);
  return !t.error;
}

/**
 * 锁仓风格：写死到 Admin 的判定逻辑（只根据“最近 14 天快照”）
 * 规则：
 * - STOP：任一天出现 wallet_negative_users>0 或 legacy_write_events>0（可算时） 或 mismatch_users 连续上升/恶化
 * - WARN：存在 mismatch（但没恶化）或 legacyWrites 不可算
 * - OK：连续 14 天 mismatch=0 AND legacyWrites=0 AND wallet_negative_users=0
 */
export function decideStatusFromWindow(windowRows: Array<{
  mismatch_users?: number | null;
  wallet_negative_users?: number | null;
  legacy_credits_write_events?: number | null;
}>) {
  const rows = windowRows.slice(-14);

  const hasUnknownLegacyWrites = rows.some(
    (r) =>
      r.legacy_credits_write_events === null ||
      typeof r.legacy_credits_write_events === "undefined",
  );

  const anyNegative = rows.some((r) => (r.wallet_negative_users ?? 0) > 0);
  if (anyNegative) {
    return {
      status: "STOP" as const,
      note: "STOP: wallet_negative_users > 0 in last 14d",
    };
  }

  const anyLegacyWrite = rows.some(
    (r) => (r.legacy_credits_write_events ?? 0) > 0,
  );
  if (!hasUnknownLegacyWrites && anyLegacyWrite) {
    return {
      status: "STOP" as const,
      note: "STOP: legacy credits still written in last 14d",
    };
  }

  // 恶化定义：mismatch_users 出现“连续 3 天上升”
  let worseningStreak = 0;
  for (let i = 1; i < rows.length; i += 1) {
    const prev = Number(rows[i - 1]?.mismatch_users ?? 0);
    const cur = Number(rows[i]?.mismatch_users ?? 0);
    if (cur > prev) {
      worseningStreak += 1;
    } else {
      worseningStreak = 0;
    }
    if (worseningStreak >= 2) {
      return {
        status: "STOP" as const,
        note: "STOP: mismatches worsening trend (>=3 days increasing)",
      };
    }
  }

  const allMismatchZero =
    rows.length >= 14 &&
    rows.every((r) => Number(r.mismatch_users ?? 0) === 0);
  const allNegativeZero =
    rows.length >= 14 &&
    rows.every((r) => Number(r.wallet_negative_users ?? 0) === 0);
  const allLegacyZero =
    !hasUnknownLegacyWrites &&
    rows.length >= 14 &&
    rows.every((r) => Number(r.legacy_credits_write_events ?? 0) === 0);

  if (allMismatchZero && allNegativeZero && allLegacyZero) {
    return {
      status: "OK" as const,
      note: "OK: 14d clean window (no mismatch, no legacy writes, no negatives)",
    };
  }

  if (hasUnknownLegacyWrites) {
    return {
      status: "WARN" as const,
      note: "WARN: legacy writes unknown (add legacy_credits_audit)",
    };
  }

  if (rows.some((r) => Number(r.mismatch_users ?? 0) > 0)) {
    return {
      status: "WARN" as const,
      note: "WARN: mismatches exist; continue observe, do not change rules",
    };
  }

  return {
    status: "WARN" as const,
    note: "WARN: not yet 14d clean window",
  };
}

export async function POST() {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServiceClient();

  const today = new Date();
  const yyyyMmDd = today.toISOString().slice(0, 10); // UTC date
  const since24h = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();

  const ledgerTable = await detectLedgerTable(supabase);
  const hasLegacyAudit = await detectLegacyAudit(supabase);

  // mismatch counts from view
  const mismatchCountRes = await supabase
    .from("admin_credit_mismatch")
    .select("user_id", { count: "exact", head: true })
    .gt("abs_diff", 0);

  const mismatchGt0Res = await supabase
    .from("admin_credit_mismatch")
    .select("user_id", { count: "exact", head: true })
    .gt("abs_diff", 0)
    .or("legacy_credits.gt.0,wallet_total.gt.0");

  const mismatchSampleRes = await supabase
    .from("admin_credit_mismatch")
    .select("user_id,abs_diff")
    .gt("abs_diff", 0)
    .order("abs_diff", { ascending: false })
    .limit(10);

  const mismatch_users = mismatchCountRes.count ?? 0;
  const mismatch_gt_0_users = mismatchGt0Res.count ?? 0;
  const mismatch_sample_user_ids =
    (mismatchSampleRes.data ?? [])
      .map((r: { user_id: string }) => r.user_id)
      .join(",") ?? "";

  // totals
  const totalUsersRes = await supabase
    .from("users")
    .select("id", { count: "exact", head: true });
  const usersWithWalletRes = await supabase
    .from("wallets")
    .select("user_id", { count: "exact", head: true });

  const total_users = totalUsersRes.count ?? 0;
  const users_with_wallet = usersWithWalletRes.count ?? 0;

  // wallet sums + negatives
  let wallet_total_sum = 0;
  let wallet_negative_users = 0;
  {
    const { data: wallets, error } = await supabase
      .from("wallets")
      .select("permanent_credits,bonus_credits");
    if (error) {
      return NextResponse.json(
        { ok: false, error: "wallets_query_failed", detail: error.message },
        { status: 500 },
      );
    }
    for (const w of wallets as Array<{
      permanent_credits: number | null;
      bonus_credits: number | null;
    }>) {
      const perm = Number(w.permanent_credits ?? 0);
      const bonus = Number(w.bonus_credits ?? 0);
      const total = perm + bonus;
      wallet_total_sum += total;
      if (total < 0) wallet_negative_users += 1;
    }
  }

  // legacy writes 24h
  let legacy_credits_write_events: number | null = null;
  if (hasLegacyAudit) {
    const r = await supabase
      .from("legacy_credits_audit")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h);
    legacy_credits_write_events = r.count ?? 0;
  }

  // ledger events 24h + manual reconcile
  let ledger_events_24h = 0;
  let check_recharge_manual_reconciles = 0;
  if (ledgerTable) {
    const r = await supabase
      .from(ledgerTable)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h);
    ledger_events_24h = r.count ?? 0;

    const m = await supabase
      .from(ledgerTable)
      .select("id", { count: "exact", head: true })
      .gte("created_at", since24h)
      .ilike("event_id", "manual_reconcile_%");
    check_recharge_manual_reconciles = m.count ?? 0;
  }

  // 先 upsert 今日行（status 先临时写 WARN，后面再用窗口重新计算）
  const upsertPayload = {
    date: yyyyMmDd,
    total_users,
    users_with_wallet,
    mismatch_users,
    mismatch_gt_0_users,
    mismatch_sample_user_ids,
    legacy_credits_write_events,
    check_recharge_manual_reconciles,
    wallet_total_sum,
    wallet_negative_users,
    ledger_events_24h,
    status: "WARN",
    note: "",
  };

  type UpsertClient = {
    from: (
      table: string,
    ) => {
      upsert: (
        values: typeof upsertPayload,
        options: { onConflict: string },
      ) => {
        select: (
          columns: string,
        ) => {
          single: () => Promise<{
            data: unknown;
            error: { message: string } | null;
          }>;
        };
      };
    };
  };

  const upsertClient = supabase as unknown as UpsertClient;

  const upsertRes = await upsertClient
    .from("credit_reconciliation_daily")
    .upsert(upsertPayload, { onConflict: "date" })
    .select("*")
    .single();

  if (upsertRes.error) {
    return NextResponse.json(
      { ok: false, error: "upsert_failed", detail: upsertRes.error.message },
      { status: 500 },
    );
  }

  // 取最近 14 天窗口，计算 status，再回写今天的 status/note
  const windowRes = await supabase
    .from("credit_reconciliation_daily")
    .select("*")
    .order("date", { ascending: true })
    .limit(14);

  const windowRows = windowRes.data ?? [];
  const decision = decideStatusFromWindow(
    windowRows as Array<{
      mismatch_users?: number | null;
      wallet_negative_users?: number | null;
      legacy_credits_write_events?: number | null;
    }>,
  );

  type UpdateClient = {
    from: (
      table: string,
    ) => {
      update: (
        values: { status: string; note: string },
      ) => {
        eq: (
          column: string,
          value: string,
        ) => {
          select: (columns: string) => {
            single: () => Promise<{
              data: unknown;
              error: { message: string } | null;
            }>;
          };
        };
      };
    };
  };

  const updateClient = supabase as unknown as UpdateClient;

  const updateRes = await updateClient
    .from("credit_reconciliation_daily")
    .update({ status: decision.status, note: decision.note })
    .eq("date", yyyyMmDd)
    .select("*")
    .single();

  if (updateRes.error) {
    return NextResponse.json(
      {
        ok: false,
        error: "status_update_failed",
        detail: updateRes.error.message,
        created: upsertRes.data,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    saved: updateRes.data,
    window_days: windowRows.length,
    status: decision.status,
    note: decision.note,
  });
}

