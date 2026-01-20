"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  user_id: string;
  email?: string | null;
  legacy_credits: number;
  wallet_permanent: number;
  wallet_bonus: number;
  wallet_total: number;
  diff: number;
};

type ApiResponse = {
  ok: boolean;
  mismatch_count: number;
  rows: Row[];
};

export default function LegacyCreditsReconcileClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [minAbsDiff, setMinAbsDiff] = useState(1);
  const [limit, setLimit] = useState(200);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(
        `/api/admin/reconcile/legacy-credits?min_abs_diff=${minAbsDiff}&limit=${limit}`,
        { cache: "no-store" }
      );
      const raw = (await res.json()) as ApiResponse | { ok?: boolean; error?: unknown };
      if (!res.ok || !("ok" in raw) || !raw.ok) {
        const message =
          raw && typeof raw === "object" && "error" in raw && typeof raw.error === "string"
            ? raw.error
            : "FETCH_FAILED";
        throw new Error(message);
      }
      const json = raw as ApiResponse;
      setRows(json.rows ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kpi = useMemo(() => {
    const mismatchUsers = rows.length;
    const sumAbsDiff = rows.reduce((acc, r) => acc + Math.abs(Number(r.diff ?? 0)), 0);
    const maxAbsDiff = rows.reduce(
      (acc, r) => Math.max(acc, Math.abs(Number(r.diff ?? 0))),
      0
    );
    return { mismatchUsers, sumAbsDiff, maxAbsDiff };
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Legacy Credits Reconcile</h1>
          <p className="text-sm text-neutral-500">
            只读对账：legacy (users.credits) vs wallets (permanent + bonus)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-neutral-500">minAbsDiff</span>
            <input
              className="w-20 rounded border border-neutral-600 bg-transparent px-2 py-1 text-sm"
              type="number"
              value={minAbsDiff}
              min={1}
              onChange={(e) => setMinAbsDiff(Number(e.target.value) || 1)}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-neutral-500">limit</span>
            <input
              className="w-24 rounded border border-neutral-600 bg-transparent px-2 py-1 text-sm"
              type="number"
              value={limit}
              min={1}
              max={1000}
              onChange={(e) => setLimit(Number(e.target.value) || 200)}
            />
          </label>
          <button
            className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            onClick={load}
            disabled={loading}
          >
            {loading ? "刷新中..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="Mismatch Users" value={loading ? "—" : String(kpi.mismatchUsers)} />
        <KpiCard title="Sum |diff|" value={loading ? "—" : String(kpi.sumAbsDiff)} />
        <KpiCard title="Max |diff|" value={loading ? "—" : String(kpi.maxAbsDiff)} />
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          Error: {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded border border-neutral-700 overflow-hidden">
        <div className="bg-neutral-900/60 px-4 py-2 text-sm font-medium">
          Top mismatches
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/40">
              <tr className="text-left">
                <Th>User</Th>
                <Th>Email</Th>
                <Th className="text-right">Legacy</Th>
                <Th className="text-right">Wallet Total</Th>
                <Th className="text-right">Perm</Th>
                <Th className="text-right">Bonus</Th>
                <Th className="text-right">Diff</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id} className="border-t border-neutral-800">
                  <Td className="font-mono text-xs">{r.user_id}</Td>
                  <Td>{r.email ?? "-"}</Td>
                  <Td className="text-right">{r.legacy_credits}</Td>
                  <Td className="text-right">{r.wallet_total}</Td>
                  <Td className="text-right">{r.wallet_permanent}</Td>
                  <Td className="text-right">{r.wallet_bonus}</Td>
                  <Td className="text-right font-medium">{r.diff}</Td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <Td colSpan={7} className="py-6 text-center text-neutral-500">
                    No mismatches（或全部低于阈值）。
                  </Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-neutral-500 leading-5">
        说明：此页只做对账与定位，不提供“一键修复”。迁移仍按
        <code className="mx-1 rounded bg-neutral-900 px-1.5 py-0.5">
          scripts/p2_legacy_credits_migrate.sql
        </code>
        等脚本执行。
      </div>
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border border-neutral-700 bg-neutral-900/40 p-4">
      <div className="text-xs text-neutral-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-4 py-2 ${className}`}>{children}</th>;
}

function Td({
  children,
  className = "",
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td colSpan={colSpan} className={`px-4 py-2 ${className}`}>
      {children}
    </td>
  );
}

