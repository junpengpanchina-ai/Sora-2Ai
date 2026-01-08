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
      const { getOrCreateDeviceId } = await import("@/lib/risk/deviceId");
      const deviceId = getOrCreateDeviceId();

      // 取当前 supabase access token 和用户邮箱
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const email = data.session?.user?.email || "";

      if (!token) {
        window.location.href = "/login?next=/pricing";
        return;
      }

      // ✅ Starter 计划走 /api/pay 风控入口
      if (planId === "starter") {
        const params = new URLSearchParams({
          plan: "starter",
          device_id: deviceId,
          email: email,
        });
        window.location.href = `/api/pay?${params.toString()}`;
        return;
      }

      // ✅ Creator/Studio/Pro 走正常 Checkout Session API
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId, deviceId }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json?.error || "Checkout failed");
        return;
      }

      if (json.url) {
        window.location.href = json.url;
      } else {
        alert("Missing checkout URL");
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
