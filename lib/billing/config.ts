/**
 * Pricing Configuration (Overseas Market - USD)
 * 
 * ⚠️ IMPORTANT: Credit amounts (permanentCredits, bonusCredits) are imported from planConfig.ts
 * This file only adds UI configuration and anti-abuse rules.
 * To change credit amounts, edit lib/billing/planConfig.ts
 */

import { PLAN_CONFIGS } from './planConfig';

export type PlanId = "free" | "starter" | "creator" | "studio" | "pro";
export type ModelId = "sora" | "veo_fast" | "veo_pro";

export const PRICING_CONFIG = {
  currency: "USD",
  
  // Consumer-facing credit costs per render
  modelCosts: {
    sora: 10,
    veo_fast: 50,
    veo_pro: 250,
  } satisfies Record<ModelId, number>,

  // Display names (marketing-friendly)
  modelDisplay: {
    sora: "Sora",
    veo_fast: "Veo Fast",
    veo_pro: "Veo Pro",
  } satisfies Record<ModelId, string>,

  // New user gift (bonus credits)
  signupGift: {
    bonusCredits: 30,
    bonusExpiresInDays: 7,
    note: "30 bonus credits expire in 7 days",
  },

  // Plans (one-time credit packs + starter access)
  plans: {
    free: {
      priceUsd: 0,
      permanentCredits: 0,
      bonusCredits: 0,
      bonusExpiresInDays: 0,
      entitlements: {
        planId: "free",
        veoProEnabled: false,
        priorityQueue: false,
        maxConcurrency: 1,
      },
      caps: null,
      ui: {
        title: "Free",
        badge: "",
        cta: "Get started",
      },
    },

    starter: {
      // Import credit amounts from planConfig.ts (single source of truth)
      priceUsd: PLAN_CONFIGS.starter.priceUsd,
      permanentCredits: PLAN_CONFIGS.starter.permanentCredits,
      bonusCredits: PLAN_CONFIGS.starter.bonusCredits,
      bonusExpiresInDays: PLAN_CONFIGS.starter.bonusExpiresDays, // Map from bonusExpiresDays
      // Override entitlements structure to match config format
      entitlements: {
        planId: PLAN_CONFIGS.starter.planId,
        veoProEnabled: PLAN_CONFIGS.starter.allowVeoPro,
        priorityQueue: false,
        maxConcurrency: PLAN_CONFIGS.starter.concurrency,
      },
      // daily caps to prevent abuse
      caps: {
        soraPerDay: PLAN_CONFIGS.starter.dailyCaps?.sora || 6,
        veoFastPerDay: PLAN_CONFIGS.starter.dailyCaps?.veo_fast || 1,
        veoProPerDay: 0,
      },
      ui: {
        title: "Starter Access",
        badge: "Try the workflow (7 days)",
        cta: "Start with Starter",
        bullets: [
          "Includes bonus credits for 7 days",
          "Fair-use daily limits to keep the service reliable",
          "Sora + Veo Fast available, Veo Pro locked",
        ],
      },
      antiAbuse: {
        onePerUser: true,
        onePerDevice: true,
        onePerPaymentFingerprint: true,
        maxStarterPerIpCidrPerDay: 3,
      },
    },

    creator: {
      // Import credit amounts from planConfig.ts (single source of truth)
      priceUsd: PLAN_CONFIGS.creator.priceUsd,
      permanentCredits: PLAN_CONFIGS.creator.permanentCredits,
      bonusCredits: PLAN_CONFIGS.creator.bonusCredits,
      bonusExpiresInDays: PLAN_CONFIGS.creator.bonusExpiresDays, // Map from bonusExpiresDays
      // Override entitlements structure to match config format
      entitlements: {
        planId: PLAN_CONFIGS.creator.planId,
        veoProEnabled: PLAN_CONFIGS.creator.allowVeoPro,
        priorityQueue: false,
        maxConcurrency: PLAN_CONFIGS.creator.concurrency,
      },
      caps: null,
      ui: {
        title: "Creator Pack",
        badge: "Recommended",
        cta: "Get Creator",
        bullets: [
          "Permanent credits for ongoing creation",
          "Unlocks Veo Pro for final exports",
          "Better limits + smoother queue",
        ],
      },
    },

    studio: {
      // Import credit amounts from planConfig.ts (single source of truth)
      priceUsd: PLAN_CONFIGS.studio.priceUsd,
      permanentCredits: PLAN_CONFIGS.studio.permanentCredits,
      bonusCredits: PLAN_CONFIGS.studio.bonusCredits,
      bonusExpiresInDays: PLAN_CONFIGS.studio.bonusExpiresDays, // Map from bonusExpiresDays
      // Override entitlements structure to match config format
      entitlements: {
        planId: PLAN_CONFIGS.studio.planId,
        veoProEnabled: PLAN_CONFIGS.studio.allowVeoPro,
        priorityQueue: true,
        maxConcurrency: PLAN_CONFIGS.studio.concurrency,
      },
      caps: null,
      ui: {
        title: "Studio Pack",
        badge: "Best value for Veo Pro",
        cta: "Get Studio",
        bullets: [
          "Built for final exports and client work",
          "More Veo Pro capacity per dollar",
          "Priority queue + higher concurrency",
        ],
      },
    },

    pro: {
      // Import credit amounts from planConfig.ts (single source of truth)
      priceUsd: PLAN_CONFIGS.pro.priceUsd,
      permanentCredits: PLAN_CONFIGS.pro.permanentCredits,
      bonusCredits: PLAN_CONFIGS.pro.bonusCredits,
      bonusExpiresInDays: PLAN_CONFIGS.pro.bonusExpiresDays, // Map from bonusExpiresDays
      // Override entitlements structure to match config format
      entitlements: {
        planId: PLAN_CONFIGS.pro.planId,
        veoProEnabled: PLAN_CONFIGS.pro.allowVeoPro,
        priorityQueue: true,
        maxConcurrency: PLAN_CONFIGS.pro.concurrency,
      },
      caps: null,
      ui: {
        title: "Pro Pack",
        badge: "For teams & heavy usage",
        cta: "Get Pro",
        bullets: [
          "Highest value per credit",
          "Best limits + fastest queue",
          "Ideal for agencies and batch workflows",
        ],
      },
    },
  } satisfies Record<PlanId, {
    priceUsd: number;
    permanentCredits: number;
    bonusCredits: number;
    bonusExpiresInDays: number;
    entitlements: {
      planId: PlanId;
      veoProEnabled: boolean;
      priorityQueue: boolean;
      maxConcurrency: number;
    };
    caps: {
      soraPerDay: number;
      veoFastPerDay: number;
      veoProPerDay: number;
    } | null;
    ui: {
      title: string;
      badge: string;
      cta: string;
      bullets?: string[];
    };
    antiAbuse?: {
      onePerUser: boolean;
      onePerDevice: boolean;
      onePerPaymentFingerprint: boolean;
      maxStarterPerIpCidrPerDay: number;
    };
  }>,

  // Optional: one-off Veo Pro upgrade (fastest path to positive cashflow)
  oneOffUpgrades: {
    veoProUpgrade: {
      priceUsd: 14.9,
      bonusCredits: 300, // enough for 1x Veo Pro + some Sora
      bonusExpiresInHours: 48,
      ui: {
        title: "Veo Pro Upgrade",
        subtitle: "For the final export (48h)",
        cta: "Upgrade with Veo Pro",
      },
    },
  },
} as const;

// Stripe Payment Link mapping (for reliable pack identification)
export const STRIPE_PAYMENT_LINKS: Record<string, PlanId | "veoProUpgrade"> = {
  "plink_starter_4_9": "starter",
  "plink_creator_39": "creator",
  "plink_studio_99": "studio",
  "plink_pro_299": "pro",
  // Add actual Payment Link IDs from Stripe dashboard
};

// Amount-based fallback mapping (cents)
export function itemIdFromAmount(totalCents: number): PlanId | "veoProUpgrade" | null {
  if (totalCents === 490) return "starter";
  if (totalCents === 3900) return "creator";
  if (totalCents === 9900) return "studio";
  if (totalCents === 29900) return "pro";
  if (totalCents === 1490) return "veoProUpgrade";
  return null;
}

// Plan configuration helper (for apply_purchase)
export function getPlanConfig(itemId: PlanId | "veoProUpgrade") {
  if (itemId === "veoProUpgrade") {
    const upgrade = PRICING_CONFIG.oneOffUpgrades.veoProUpgrade;
    return {
      permanent: 0,
      bonus: upgrade.bonusCredits,
      bonusExpiresAt: new Date(Date.now() + upgrade.bonusExpiresInHours * 60 * 60 * 1000).toISOString(),
      ent: {
        planId: "free" as PlanId, // Keep existing plan, just add bonus
        veoProEnabled: false,
        priority: false,
        maxConcurrency: 1,
      },
    };
  }

  const plan = PRICING_CONFIG.plans[itemId];
  return {
    permanent: plan.permanentCredits,
    bonus: plan.bonusCredits,
    bonusExpiresAt: plan.bonusExpiresInDays
      ? new Date(Date.now() + plan.bonusExpiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : null,
    ent: {
      planId: plan.entitlements.planId,
      veoProEnabled: plan.entitlements.veoProEnabled,
      priority: plan.entitlements.priorityQueue,
      maxConcurrency: plan.entitlements.maxConcurrency,
    },
  };
}

