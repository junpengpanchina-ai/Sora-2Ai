"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";
import type { PlanId } from "@/lib/billing/types";

type Trigger =
  | "after_2_sora_renders"
  | "export_click"
  | "quality_intent_click"
  | "high_iteration"
  | "prompt_high_intent"
  | "veo_locked_click";

type Props = {
  planId: PlanId;
  soraRendersThisSession: number;
  promptText?: string;
  onUpgrade: () => void; // route to /pricing or open paywall
  onDismiss?: () => void;
};

function hasHighIntentPrompt(prompt?: string) {
  if (!prompt) return false;
  const p = prompt.toLowerCase();
  const kws = ["commercial", "client", "ad", "marketing", "product launch", "brand"];
  return kws.some((k) => p.includes(k));
}

export function UpgradeNudge({
  planId,
  soraRendersThisSession,
  promptText,
  onUpgrade,
  onDismiss,
}: Props) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<Trigger | null>(null);

  const eligible = useMemo(() => {
    if (planId === "pro" || planId === "studio") return false; // already has Veo Pro access assumed
    return true;
  }, [planId]);

  useEffect(() => {
    if (!eligible) return;

    // Trigger T1: 用户完成第 2 次 Sora render
    if (soraRendersThisSession === 2) {
      setTrigger("after_2_sora_renders");
      setOpen(true);
    }

    // Trigger T5: Prompt 出现高意图关键词
    if (hasHighIntentPrompt(promptText) && soraRendersThisSession >= 1) {
      setTrigger("prompt_high_intent");
      setOpen(true);
    }
  }, [eligible, soraRendersThisSession, promptText]);

  useEffect(() => {
    if (open && trigger) {
      track("upsell_nudge_view", { trigger, planId });
    }
  }, [open, trigger, planId]);

  if (!open || !trigger) return null;

  const title = "Ready for a cleaner final export?";
  const bodyA =
    "Sora is great for drafts. If this is the version you want to publish, Veo Pro can improve motion realism and detail.";
  const bodyB =
    "If you're exporting this one, Veo Pro typically delivers smoother motion and higher fidelity for the final cut.";

  // Simple AB bucket (client-side only). Replace with real AB system later.
  const getVariant = () => {
    if (typeof window === "undefined") return "A";
    const stored = window.localStorage.getItem("ab_upsell_variant");
    if (stored) return stored;
    const variant = Math.random() < 0.5 ? "A" : "B";
    window.localStorage.setItem("ab_upsell_variant", variant);
    return variant;
  };

  const variant = getVariant();

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-xl px-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="mt-2 text-sm text-white/80">{variant === "A" ? bodyA : bodyB}</div>

        {planId === "starter" ? (
          <div className="mt-2 text-xs text-white/60">
            Veo Pro is available on paid packs with higher limits and priority.
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("upsell_nudge_accept", { trigger, planId, variant });
              onUpgrade();
              setOpen(false);
            }}
          >
            Upgrade this render with Veo Pro
          </button>
          <button
            className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
            onClick={() => {
              track("upsell_nudge_dismiss", { trigger, planId, variant });
              setOpen(false);
              onDismiss?.();
            }}
          >
            Keep drafting with Sora
          </button>
        </div>
      </div>
    </div>
  );
}

// Optional helper you can call when user clicks Export/Download
export function triggerExportNudge(
  setOpen: (v: boolean) => void,
  setTrigger: (t: Trigger) => void
) {
  setTrigger("export_click");
  setOpen(true);
}

