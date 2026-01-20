/**
 * @deprecated 已下线：请仅在 Stripe Dashboard 中配置 /api/stripe/webhook，并移除此 endpoint。
 *
 * 此路由验证签名后直接返回 200，不做任何发币或处理，避免与 /api/stripe/webhook 重复处理。
 * 若 Stripe 仍指向此处，请尽快在 Dashboard 中：
 * 1. 添加 https://<your-domain>/api/stripe/webhook
 * 2. 删除本 endpoint
 */
import { getStripe } from "@/lib/stripe";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const rawBody = await request.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[payment/webhook] STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  try {
    getStripe().webhooks.constructEvent(rawBody, sig, secret);
  } catch (err) {
    console.warn("[payment/webhook] Signature verification failed (deprecated endpoint):", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  console.warn(
    "[payment/webhook] DEPRECATED: Event received but NOT processed. " +
      "Configure /api/stripe/webhook in Stripe Dashboard and remove this endpoint."
  );

  return NextResponse.json({
    received: true,
    deprecated: true,
    message:
      "This webhook is deprecated. No credits were granted. " +
      "Add /api/stripe/webhook in Stripe Dashboard and remove this endpoint.",
  });
}
