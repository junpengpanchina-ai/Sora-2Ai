// app/api/checkout/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { planConfig, type PlanId } from "@/lib/billing/planConfig";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const stripe = getStripe();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getBaseUrl(req: NextRequest) {
  // 生产推荐用 env 固定，不要信 header
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

// 简单的 IPv4 /24（用于风控可选）
function ipToPrefix(ip?: string | null): string | null {
  if (!ip) return null;
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return `${m[1]}.${m[2]}.${m[3]}.0/24`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planId = body.planId as PlanId | undefined;
    const deviceId = (body.deviceId as string | undefined) ?? null;

    if (!planId) {
      return NextResponse.json({ error: "missing_planId" }, { status: 400 });
    }

    const cfg = planConfig()[planId];
    if (!cfg?.stripe?.paymentLinkUrl) {
      return NextResponse.json({ error: "missing_payment_link_url" }, { status: 400 });
    }

    // ✅ 从 Supabase Auth 里拿当前用户（服务端验证）
    // 前端要带 supabase access token（cookie auth 或 header）
    const authHeader = req.headers.get("authorization");
    const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!jwt) {
      return NextResponse.json({ error: "missing_auth_token" }, { status: 401 });
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = userRes.user.id;

    // 你也可以把 IP prefix 记到 purchases（可选）
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip");
    const ipPrefix = ipToPrefix(ip);

    const baseUrl = getBaseUrl(req);

    // ✅ 用 Payment Link 创建 Checkout Session（关键！）
    // 注意：payment_link 必须是 plink_... ID
    // 但你现在只有 buy.stripe.com 链接，所以我们这里用 "url -> 查 Stripe API" 的方式会麻烦。
    // 最稳的方式：你在 planConfig() 里补齐 paymentLinkId: "plink_..."
    // 先给你双方案：
    // A) 你填 plink_...（推荐）
    // B) 暂时先用 "mode: payment + line_items" 不依赖 plink（也能跑）

    if (cfg.stripe.paymentLinkId) {
      // ✅ 方案 A：推荐（最干净）
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_link: cfg.stripe.paymentLinkId,
        // 让 webhook 能取到 userId（两种都写）
        client_reference_id: userId,
        metadata: {
          user_id: userId,
          plan_id: planId,
          device_id: deviceId ?? "",
          payment_link_url: cfg.stripe.paymentLinkUrl ?? "",
          ip_prefix: ipPrefix ?? "",
        },
        success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/pricing?canceled=1`,
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url });
    }

    // ✅ 方案 B：临时兜底（不依赖 plink_...）
    // 你需要在 Stripe 后台有对应的 Price ID（price_...）
    // 如果你还没有 price_...，我建议你尽快把 plink_... 给我，走方案 A。
    const priceId = process.env[`STRIPE_PRICE_${planId.toUpperCase()}` as any] as string | undefined;
    if (!priceId) {
      return NextResponse.json(
        { error: "missing_plink_or_price", hint: "Set planConfig().stripe.paymentLinkId or env STRIPE_PRICE_STARTER/CREATOR/STUDIO/PRO" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan_id: planId,
        device_id: deviceId ?? "",
        payment_link_url: cfg.stripe.paymentLinkUrl ?? "",
        ip_prefix: ipPrefix ?? "",
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    console.error("[checkout/create] Error:", e);
    return NextResponse.json({ error: "checkout_create_failed", message: e?.message }, { status: 500 });
  }
}

