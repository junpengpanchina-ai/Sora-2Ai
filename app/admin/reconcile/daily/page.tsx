"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ReconcileStatusBar } from "@/components/admin/ReconcileStatusBar";
import { KpiCard } from "@/components/admin/KpiCard";
import {
  TopMismatchesTable,
  type MismatchRow,
} from "@/components/admin/TopMismatchesTable";
import type { ReconcileStatus } from "@/lib/admin-reconcile-status";

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

type DailyResponse = {
  ok: boolean;
  row?: DailyRow;
  error?: string;
};

type LegacyCreditsResponse = {
  ok: boolean;
  rows?: MismatchRow[];
  mismatch_count?: number;
  error?: string;
};

export default function AdminReconcileDailyPage() {
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const [daily, setDaily] = useState<DailyRow | null>(null);
  const [mismatches, setMismatches] = useState<MismatchRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const mismatchTop = useMemo(() => mismatches.slice(0, 50), [mismatches]);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const dailyRes = await fetch(
        `/api/admin/reconcile/daily?date=${encodeURIComponent(date)}`,
        { cache: "no-store" }
      );
      if (dailyRes.status === 401) throw new Error("ADMIN_UNAUTHORIZED");
      const dailyJson = (await dailyRes.json()) as DailyResponse;
      if (!dailyJson.ok || !dailyJson.row) {
        throw new Error(dailyJson.error ?? "DAILY_FAILED");
      }
      setDaily(dailyJson.row);

      const mmRes = await fetch("/api/admin/reconcile/legacy-credits", {
        cache: "no-store",
      });
      if (mmRes.status === 401) throw new Error("ADMIN_UNAUTHORIZED");
      const mmJson = (await mmRes.json()) as LegacyCreditsResponse;
      if (!mmJson.ok) {
        throw new Error(mmJson.error ?? "MISMATCH_FAILED");
      }
      setMismatches(mmJson.rows ?? []);
    } catch (e) {
      const message = e instanceof Error ? e.message : "UNKNOWN_ERROR";
      setErr(message);
      setDaily(null);
      setMismatches([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold">Credits Reconcile · Daily</div>
          <div className="text-sm opacity-70">
            只读对账面板：显示趋势与一票否决信号，禁止“手痒改逻辑”。
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              void load();
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {err ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          <div className="font-semibold">加载失败</div>
          <div className="mt-1 text-sm opacity-90">{err}</div>
        </div>
      ) : null}

      {daily ? (
        <ReconcileStatusBar status={daily.status} note={daily.note} date={daily.date} />
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm opacity-70">
          暂无数据（或还在加载）。
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <KpiCard
          title="Mismatch Users"
          value={daily ? daily.mismatch_users : "-"}
          subtitle="legacy vs wallet 不一致用户数（只观察/不自动修）"
        />
        <KpiCard
          title="Legacy Credits Writes (24h)"
          value={daily ? daily.legacy_credits_write_events : "-"}
          subtitle=">0 直接 STOP（说明仍有人写 users.credits）"
        />
        <KpiCard
          title="Wallet Negative Users"
          value={daily ? daily.wallet_negative_users : "-"}
          subtitle=">0 直接 STOP（先止血排查扣费/回滚）"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <KpiCard
          title="Ledger Events (24h)"
          value={daily ? daily.ledger_events_24h : "-"}
          subtitle="钱包流水事件量（用来观察系统是否在正常工作）"
        />
        <KpiCard
          title="Manual Reconciles (24h)"
          value={daily ? daily.check_recharge_manual_reconciles : "-"}
          subtitle="check-recharge 补单次数（越少越好）"
        />
      </div>

      <TopMismatchesTable rows={mismatchTop} />
    </div>
  );
}

