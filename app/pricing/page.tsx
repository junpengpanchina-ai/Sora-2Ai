"use client";

import { PricingPage as PricingPageComponent } from "@/components/pricing/PricingPage";
import { PRICING_CONFIG } from "@/lib/billing/config";
import type { PlanId } from "@/lib/billing/config";

// Stripe Payment Links (update with actual Payment Link IDs from Stripe dashboard)
const STRIPE_PAYMENT_LINKS: Record<PlanId, string> = {
  free: "",
  starter: "https://buy.stripe.com/28EbJ14jUg2L6550Ug0kE05",
  creator: "https://buy.stripe.com/dRmcN55nY4k33WXfPa0kE03",
  studio: "https://buy.stripe.com/6oU7sL17IdUD51132o0kE06",
  pro: "https://buy.stripe.com/4gMcN5eYy5o70KLauQ0kE01",
};

export default function PricingPage() {
  const config = {
    currency: PRICING_CONFIG.currency,
    soraCreditsPerRender: PRICING_CONFIG.modelCosts.sora,
    veoFlashCreditsPerRender: PRICING_CONFIG.modelCosts.veo_fast,
    veoProCreditsPerRender: PRICING_CONFIG.modelCosts.veo_pro,
  };

  return (
    <PricingPageComponent
      config={config}
      onCheckout={(planId: PlanId) => {
        // Redirect to Stripe Payment Link
        const paymentLink = STRIPE_PAYMENT_LINKS[planId];
        if (paymentLink) {
          window.location.href = paymentLink;
        } else {
          console.error("No payment link for plan:", planId);
          alert("Payment link not configured. Please contact support.");
        }
      }}
    />
  );
}
