"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics/track";
import type { PlanId } from "@/lib/billing/types";
import { UPGRADE_NUDGE_COPY } from "./UpgradeNudgeCopy";

type Trigger =
  | "after_2_sora_renders"
  | "export_click"
  | "quality_intent_click"
  | "high_iteration"
  | "prompt_high_intent"
  | "veo_locked_click"
  | "commercial_format"
  | "retry_same_prompt_3";

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

  const copy = UPGRADE_NUDGE_COPY[trigger];
  if (!copy) return null;

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-xl px-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur-sm">
        <div className="text-sm font-semibold text-white">{copy.title}</div>
        <div className="mt-2 text-sm text-white/80">{copy.body}</div>

        {planId === "starter" && trigger === "veo_locked_click" ? (
          <div className="mt-2 text-xs text-white/60">
            Starter is designed for testing the workflow. Upgrade to unlock Veo Pro and higher limits.
          </div>
        ) : null}

        <div className="mt-4 flex gap-2">
          <button
            className="flex-1 rounded-xl bg-gradient-to-r from-[#1f75ff] to-[#3f8cff] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            onClick={() => {
              track("upsell_nudge_accept", { trigger, planId });
              onUpgrade();
              setOpen(false);
            }}
          >
            {copy.primary}
          </button>
          <button
            className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5 transition-colors"
            onClick={() => {
              track("upsell_nudge_dismiss", { trigger, planId });
              setOpen(false);
              onDismiss?.();
            }}
          >
            {copy.secondary}
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

