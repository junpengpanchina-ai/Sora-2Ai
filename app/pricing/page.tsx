"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PricingPage as PricingPageComponent } from "@/components/pricing/PricingPage";
import { PRICING_CONFIG } from "@/lib/billing/config";
import type { PlanId } from "@/lib/billing/config";

function PricingPageContent() {
  const searchParams = useSearchParams();
  const fromVideo = searchParams?.get("from") === "video";
  const [pricingBucket, setPricingBucket] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    if (!fromVideo) {
      setPricingBucket("A");
      return;
    }
    let cancelled = false;
    fetch("/api/pricing-ab?from=video", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && (data.bucket === "A" || data.bucket === "B")) {
          setPricingBucket(data.bucket);
        } else {
          setPricingBucket("A");
        }
      })
      .catch(() => {
        if (!cancelled) setPricingBucket("A");
      });
    return () => {
      cancelled = true;
    };
  }, [fromVideo]);

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
        const next = fromVideo ? "/pricing?from=video" : "/pricing";
        window.location.href = `/login?next=${encodeURIComponent(next)}`;
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
      fromVideo={fromVideo}
      pricingBucket={fromVideo ? pricingBucket : "A"}
    />
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white/70">Loading…</div>}>
      <PricingPageContent />
    </Suspense>
  );
}
