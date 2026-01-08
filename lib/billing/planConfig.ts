// lib/billing/planConfig.ts
export type PlanId = "starter" | "creator" | "studio" | "pro";

export type PlanConfig = {
  planId: PlanId;
  priceUsd: number;
  // 发币
  grant: {
    permanentCredits: number; // 永久
    bonusCredits: number;     // 限时
    bonusDaysValid: number;   // 过期天数
  };
  // Starter 限制（风控/限频）
  starterRules?: {
    allowVeoPro: boolean;
    dailySoraCap: number;
    dailyVeoFastCap: number;
    maxConcurrentJobs: number;
    onePerAccount: boolean;     // 账号一人一次
    onePerDevice: boolean;      // 设备一人一次
    onePerCardFingerprint: boolean; // 卡指纹一人一次（拿得到时）
  };
  // Stripe 映射：支持 payment link id 或 URL
  stripe: {
    paymentLinkId?: string; // plink_...
    paymentLinkUrl?: string; // https://buy.stripe.com/...
  };
};

export function planConfig(): Record<PlanId, PlanConfig> {
  return {
    starter: {
      planId: "starter",
      priceUsd: 4.9,
      grant: { permanentCredits: 0, bonusCredits: 200, bonusDaysValid: 7 },
      starterRules: {
        allowVeoPro: false,
        dailySoraCap: 6,
        dailyVeoFastCap: 1,
        maxConcurrentJobs: 1,
        onePerAccount: true,
        onePerDevice: true,
        onePerCardFingerprint: true,
      },
      stripe: {
        paymentLinkId: undefined, // TODO: 填 plink_...
        paymentLinkUrl: "https://buy.stripe.com/28EbJ14jUg2L6550Ug0kE05",
      },
    },
    creator: {
      planId: "creator",
      priceUsd: 39,
      grant: { permanentCredits: 2000, bonusCredits: 600, bonusDaysValid: 14 },
      stripe: {
        paymentLinkId: undefined, // TODO
        paymentLinkUrl: "https://buy.stripe.com/dRmcN55nY4k33WXfPa0kE03",
      },
    },
    studio: {
      planId: "studio",
      priceUsd: 99,
      grant: { permanentCredits: 6000, bonusCredits: 1500, bonusDaysValid: 30 },
      stripe: {
        paymentLinkId: undefined, // TODO
        paymentLinkUrl: "https://buy.stripe.com/6oU7sL17IdUD51132o0kE06",
      },
    },
    pro: {
      planId: "pro",
      priceUsd: 299,
      grant: { permanentCredits: 20000, bonusCredits: 4000, bonusDaysValid: 60 },
      stripe: {
        paymentLinkId: undefined, // TODO
        paymentLinkUrl: "https://buy.stripe.com/4gMcN5eYy5o70KLauQ0kE01",
      },
    },
  };
}

export function resolvePlanIdFromStripePaymentLink(input: {
  paymentLinkId?: string | null;
  paymentLinkUrl?: string | null;
}): PlanId | null {
  const cfg = planConfig();
  const byId = input.paymentLinkId?.trim();
  const byUrl = input.paymentLinkUrl?.trim();

  for (const planId of Object.keys(cfg) as PlanId[]) {
    const p = cfg[planId].stripe;
    if (byId && p.paymentLinkId && p.paymentLinkId === byId) return planId;
    if (byUrl && p.paymentLinkUrl && p.paymentLinkUrl === byUrl) return planId;
  }
  return null;
}

