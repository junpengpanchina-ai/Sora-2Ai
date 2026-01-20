"use client";

import React from "react";

type Props = {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
};

export function KpiCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm opacity-80">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {subtitle ? (
        <div className="mt-2 text-xs opacity-70">{subtitle}</div>
      ) : null}
    </div>
  );
}

