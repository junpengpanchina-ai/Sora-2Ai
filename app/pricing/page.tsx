"use client";

import { PricingPage as PricingPageComponent } from "@/components/pricing/PricingPage";
import { PRICING_CONFIG } from "@/lib/billing/config";
import type { PlanId } from "@/lib/billing/config";
export default function PricingPage() {

  const config = {
    currency: PRICING_CONFIG.currency,
    soraCreditsPerRender: PRICING_CONFIG.modelCosts.sora,
    veoFlashCreditsPerRender: PRICING_CONFIG.modelCosts.veo_fast,
    veoProCreditsPerRender: PRICING_CONFIG.modelCosts.veo_pro,
  };

  const handleCheckout = async (planId: PlanId) => {
    if (planId === "free") {
      return;
    }

    try {
      // 获取 device_id（用于风控）
      let deviceId: string | undefined;
      try {
        if (typeof window !== "undefined") {
          const { getOrCreateDeviceId } = await import("@/lib/risk/deviceId");
          deviceId = getOrCreateDeviceId();
        }
      } catch (err) {
        console.warn("Failed to get device ID:", err);
      }

      // Create Checkout Session via API (gives us full control over redirects + device_id)
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, deviceId }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
      } else {
        console.error("Failed to create checkout:", data.error);
        alert(data.error || "Failed to create checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Network error. Please try again.");
    }
  };

  return (
    <PricingPageComponent
      config={config}
      onCheckout={handleCheckout}
    />
  );
}
