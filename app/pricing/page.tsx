"use client";

import { PricingPage as PricingPageComponent } from "@/components/pricing/PricingPage";
import type { PricingConfig } from "@/lib/billing/types";

export default function PricingPage() {
  const config: PricingConfig = {
    currency: "USD",
    soraCreditsPerRender: 10,
    veoFlashCreditsPerRender: 50,
    veoProCreditsPerRender: 250,
  };

  return (
    <PricingPageComponent
      config={config}
      onCheckout={(planId) => {
        // Redirect to your checkout
        // You can integrate with Stripe / Paddle / LemonSqueezy here
        window.location.href = `/checkout?plan=${planId}`;
      }}
    />
  );
}
