"use client";

import { track } from "@/lib/analytics/track";
import type { PlanId } from "@/lib/billing/types";

type Props = {
  planId: PlanId;
  title: string;
  price: string;
  badge?: string;
  bullets: string[];
  ctaLabel: string;
  onCta: (planId: PlanId) => void;
  footnote?: string;
  variant?: "primary" | "secondary";
};

export function PlanCard({
  planId,
  title,
  price,
  badge,
  bullets,
  ctaLabel,
  onCta,
  footnote,
  variant = "secondary",
}: Props) {
  return (
    <div
      className={[
        "rounded-2xl border p-6 shadow-sm",
        variant === "primary" ? "border-[#1f75ff] border-2" : "border-white/10",
        "bg-white/5 backdrop-blur-sm",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {badge ? (
            <div className="mt-2 inline-flex rounded-full bg-[#1f75ff] px-3 py-1 text-xs font-medium text-white">
              {badge}
            </div>
          ) : null}
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold text-white">{price}</div>
          <div className="text-xs text-white/60">One-time purchase</div>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-white/80">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-green-400" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <button
        className={[
          "mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold transition-opacity",
          variant === "primary"
            ? "bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] text-white hover:opacity-90"
            : "bg-white/10 text-white hover:bg-white/15",
        ].join(" ")}
        onClick={() => {
          track("pricing_plan_cta_click", { planId });
          onCta(planId);
        }}
      >
        {ctaLabel}
      </button>

      {footnote ? (
        <div className="mt-3 text-xs text-white/60">{footnote}</div>
      ) : null}
    </div>
  );
}

