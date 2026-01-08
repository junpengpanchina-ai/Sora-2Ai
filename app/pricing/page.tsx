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

      // ✅ Starter 走防薅接口 /api/pay
      if (planId === "starter") {
        // 获取用户邮箱
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        const email = sessionData.session?.user?.email || "";

        // 直接跳转到防薅接口，它会进行风控检查后跳转到 Payment Link
        window.location.href = `/api/pay?plan=starter&device_id=${deviceId}&email=${encodeURIComponent(email)}`;
        return;
      }

      // ✅ Creator/Studio/Pro 走正常 Checkout Session
      // 取当前 supabase access token
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        window.location.href = "/login?next=/pricing";
        return;
      }

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
