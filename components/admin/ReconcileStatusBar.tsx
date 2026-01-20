"use client";

import React from "react";
import type { ReconcileStatus } from "@/lib/admin-reconcile-status";

type Props = {
  status: ReconcileStatus;
  note?: string;
  date?: string;
};

export function ReconcileStatusBar({ status, note, date }: Props) {
  const style =
    status === "OK"
      ? "border-green-500/40 bg-green-500/10 text-green-200"
      : status === "WARN"
      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
      : "border-red-500/40 bg-red-500/10 text-red-200";

  const label =
    status === "OK"
      ? "OK · 已收口"
      : status === "WARN"
      ? "WARN · 只观察不动"
      : "STOP · 一票否决（先止血）";

  const icon = status === "OK" ? "🟢" : status === "WARN" ? "🟡" : "🔴";

  return (
    <div className={`w-full rounded-2xl border p-4 ${style}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm opacity-90">
            Credits Reconcile · Lockdown{" "}
            {date ? <span className="opacity-70">({date})</span> : null}
          </div>
          <div className="mt-1 text-lg font-semibold">
            {icon} {label}
          </div>
          {note ? (
            <div className="mt-1 text-sm opacity-90">{note}</div>
          ) : null}
        </div>

        <div className="text-right text-sm leading-5 opacity-95">
          <div className="font-semibold">执行口令</div>
          <div>抓取量站稳之前，不允许任何扩展</div>
          <div>索引波动是消化，不是问题</div>
        </div>
      </div>
    </div>
  );
}

