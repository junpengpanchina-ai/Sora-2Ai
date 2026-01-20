"use client";

import React from "react";

export type MismatchRow = {
  user_id: string;
  email?: string | null;
  legacy_credits: number;
  wallet_permanent: number;
  wallet_bonus: number;
  wallet_total: number;
  diff: number;
};

function fmt(n: number) {
  return Number.isFinite(n) ? n.toLocaleString() : String(n);
}

type Props = {
  rows: MismatchRow[];
};

export function TopMismatchesTable({ rows }: Props) {
  const safeRows = rows ?? [];

  const exportJson = () => {
    void navigator.clipboard.writeText(JSON.stringify(safeRows, null, 2));
  };

  const exportCsv = () => {
    const header = [
      "user_id",
      "email",
      "legacy_credits",
      "wallet_permanent",
      "wallet_bonus",
      "wallet_total",
      "diff",
    ];
    const lines = [header.join(",")].concat(
      safeRows.map((r) =>
        [
          r.user_id,
          (r.email ?? "").replaceAll(",", " "),
          r.legacy_credits,
          r.wallet_permanent,
          r.wallet_bonus,
          r.wallet_total,
          r.diff,
        ].join(",")
      )
    );
    void navigator.clipboard.writeText(lines.join("\n"));
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Top mismatches</div>
          <div className="text-xs opacity-70">
            只展示 / 导出，不提供一键修复（锁仓纪律）。
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportJson}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Copy JSON
          </button>
          <button
            onClick={exportCsv}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            Copy CSV
          </button>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-80">
            <tr className="border-b border-white/10">
              <th className="py-2 pr-3">user_id</th>
              <th className="py-2 pr-3">email</th>
              <th className="py-2 pr-3">legacy</th>
              <th className="py-2 pr-3">perm</th>
              <th className="py-2 pr-3">bonus</th>
              <th className="py-2 pr-3">wallet_total</th>
              <th className="py-2 pr-3">diff</th>
            </tr>
          </thead>
          <tbody>
            {safeRows.length === 0 ? (
              <tr>
                <td className="py-3 opacity-70" colSpan={7}>
                  无 mismatch ✅
                </td>
              </tr>
            ) : (
              safeRows.map((r) => (
                <tr key={r.user_id} className="border-b border-white/5">
                  <td className="py-2 pr-3 font-mono text-xs opacity-90">
                    {r.user_id}
                  </td>
                  <td className="py-2 pr-3 opacity-90">{r.email ?? "-"}</td>
                  <td className="py-2 pr-3">{fmt(r.legacy_credits)}</td>
                  <td className="py-2 pr-3">{fmt(r.wallet_permanent)}</td>
                  <td className="py-2 pr-3">{fmt(r.wallet_bonus)}</td>
                  <td className="py-2 pr-3">{fmt(r.wallet_total)}</td>
                  <td className="py-2 pr-3 font-semibold">
                    {r.diff === 0 ? (
                      <span className="opacity-80">0</span>
                    ) : r.diff > 0 ? (
                      <span className="text-yellow-200">{fmt(r.diff)}</span>
                    ) : (
                      <span className="text-red-200">{fmt(r.diff)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

