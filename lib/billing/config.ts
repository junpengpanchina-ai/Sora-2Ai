/**
 * Pricing Configuration (Overseas Market - USD)
 * 
 * This is the single source of truth for all pricing, credits, bonuses, and entitlements.
 * Update this file to change pricing across the entire application.
 */

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
      // 7-day Starter Access (anti-abuse, not permanent value pack)
      priceUsd: 4.9,
      permanentCredits: 0,
      bonusCredits: 120,
      bonusExpiresInDays: 7,
      entitlements: {
        planId: "starter",
        veoProEnabled: false,
        priorityQueue: false,
        maxConcurrency: 1,
      },
      // daily caps to prevent abuse
      caps: {
        soraPerDay: 6,
        veoFastPerDay: 1,
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
      priceUsd: 39,
      permanentCredits: 600,
      bonusCredits: 60,
      bonusExpiresInDays: 30,
      entitlements: {
        planId: "creator",
        veoProEnabled: true,
        priorityQueue: false,
        maxConcurrency: 2,
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
      priceUsd: 99,
      permanentCredits: 1800,
      bonusCredits: 270,
      bonusExpiresInDays: 45,
      entitlements: {
        planId: "studio",
        veoProEnabled: true,
        priorityQueue: true,
        maxConcurrency: 3,
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
      priceUsd: 299,
      permanentCredits: 6000,
      bonusCredits: 1200,
      bonusExpiresInDays: 60,
      entitlements: {
        planId: "pro",
        veoProEnabled: true,
        priorityQueue: true,
        maxConcurrency: 5,
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

