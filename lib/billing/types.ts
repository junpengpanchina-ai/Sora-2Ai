export type PlanId = "starter" | "creator" | "studio" | "pro";
export type ModelId = "sora" | "veo_flash" | "veo_pro";

export type CreditWallet = {
  permanent: number;
  bonus: number;
  bonusExpiresAt?: string; // ISO date string
};

export type UsageCaps = {
  dailyRendersRemaining?: number; // for Starter anti-abuse
};

export type UserEntitlements = {
  planId: PlanId;
  wallet: CreditWallet;
  caps?: UsageCaps;
  isLoggedIn: boolean;
};

export type PricingConfig = {
  currency: "USD";
  soraCreditsPerRender: number;      // 10
  veoFlashCreditsPerRender: number;  // 50
  veoProCreditsPerRender: number;    // 250
};

