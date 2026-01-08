export type PlanId = "starter" | "creator" | "studio" | "pro";

export type ModelId = "sora" | "veo_fast" | "veo_pro";

export const MODEL_CREDIT_COST: Record<ModelId, number> = {
  sora: 10,
  veo_fast: 50,
  veo_pro: 250,
};

export type PlanConfig = {
  planId: PlanId;
  displayName: string;
  priceUsd: number;
  paymentLinkId: string;

  // Wallet grant
  permanentCredits: number; // never expires
  bonusCredits: number;     // time-limited
  bonusExpiresDays: number; // 0 = no bonus

  // Entitlements
  allowVeoPro: boolean;
  concurrency: number;      // queue priority can be derived from planId
  dailyCaps?: Partial<Record<ModelId, number>>; // for Starter
};

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  starter: {
    planId: "starter",
    displayName: "Starter Access",
    priceUsd: 4.9,
    paymentLinkId: "plink_1SjMNLDqGbi6No9vUku66neA",
    permanentCredits: 0,
    bonusCredits: 200,
    bonusExpiresDays: 7,
    allowVeoPro: false,
    concurrency: 1,
    dailyCaps: { sora: 6, veo_fast: 1 }, // veo_pro locked
  },
  creator: {
    planId: "creator",
    displayName: "Creator Pack",
    priceUsd: 39,
    paymentLinkId: "plink_1SRxHLDqGbi6No9vhu7i5iud",
    permanentCredits: 2000,
    bonusCredits: 600,
    bonusExpiresDays: 14,
    allowVeoPro: true,
    concurrency: 2,
  },
  studio: {
    planId: "studio",
    displayName: "Studio Pack",
    priceUsd: 99,
    paymentLinkId: "plink_1SmxBiDqGbi6No9v4L6dFvvK",
    permanentCredits: 6000,
    bonusCredits: 1500,
    bonusExpiresDays: 30,
    allowVeoPro: true,
    concurrency: 3,
  },
  pro: {
    planId: "pro",
    displayName: "Pro Pack",
    priceUsd: 299,
    paymentLinkId: "plink_1SNF1zDqGbi6No9vqtJXYMhQ",
    permanentCredits: 20000,
    bonusCredits: 4000,
    bonusExpiresDays: 60,
    allowVeoPro: true,
    concurrency: 5,
  },
};

export function planFromPaymentLink(paymentLinkId: string): PlanConfig | null {
  const plan = (Object.values(PLAN_CONFIGS) as PlanConfig[]).find(
    (p) => p.paymentLinkId === paymentLinkId
  );
  return plan ?? null;
}

// Legacy compatibility
export function planConfig(): Record<PlanId, PlanConfig> {
  return PLAN_CONFIGS;
}

export function resolvePlanIdFromStripePaymentLink(input: {
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
}): PlanId | null {
  if (input.paymentLinkId) {
    const plan = planFromPaymentLink(input.paymentLinkId);
    if (plan) return plan.planId;
  }
  return null;
}
