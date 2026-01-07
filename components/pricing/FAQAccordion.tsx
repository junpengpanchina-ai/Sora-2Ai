"use client";

import { useState } from "react";
import { track } from "@/lib/analytics/track";

export type FAQItem = { q: string; a: string };

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="text-lg font-semibold text-white">FAQ</div>
      <div className="mt-4 space-y-2">
        {items.map((it, idx) => {
          const isOpen = open === idx;
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5">
              <button
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-white hover:bg-white/5 transition-colors"
                onClick={() => {
                  const next = isOpen ? null : idx;
                  setOpen(next);
                  track("pricing_faq_toggle", { index: idx, open: !!next });
                }}
              >
                <span>{it.q}</span>
                <span className="text-white/60">{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen ? (
                <div className="px-4 pb-4 text-sm text-white/70">{it.a}</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

