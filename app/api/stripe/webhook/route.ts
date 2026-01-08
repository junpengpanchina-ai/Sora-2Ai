import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { planConfig, resolvePlanIdFromStripePaymentLink, type PlanId } from "@/lib/billing/planConfig";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs"; // webhook 需要 nodejs
export const dynamic = "force-dynamic";

const stripe = getStripe();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 读取 raw body（NextRequest 可用 arrayBuffer）
async function readRawBody(req: NextRequest) {
  const buf = Buffer.from(await req.arrayBuffer());
  return buf;
}

// 把 IP 映射成 /24（IPv4 简化版）
function ipToPrefix(ip?: string | null): string | null {
  if (!ip) return null;
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return `${m[1]}.${m[2]}.${m[3]}.0/24`;
}

async function isStarterAllowed(input: {
  userId: string;
  deviceId?: string | null;
  ipPrefix?: string | null;
  cardFingerprint?: string | null;
}) {
  // 1) 同账号一次
  const { data: userStarter } = await supabaseAdmin
    .from("purchases")
    .select("id")
    .eq("user_id", input.userId)
    .eq("plan_id", "starter")
    .limit(1);

  if (userStarter?.length) return { ok: false, reason: "starter_one_per_account" as const };

  // 2) 同设备一次
  if (input.deviceId) {
    const { data: devStarter } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("plan_id", "starter")
      .eq("device_id", input.deviceId)
      .limit(1);

    if (devStarter?.length) return { ok: false, reason: "starter_one_per_device" as const };
  }

  // 3) 同卡指纹一次（拿得到才做）
  if (input.cardFingerprint) {
    const { data: fpStarter } = await supabaseAdmin
      .from("purchases")
      .select("id")
      .eq("plan_id", "starter")
      .eq("card_fingerprint", input.cardFingerprint)
      .limit(1);

    if (fpStarter?.length) return { ok: false, reason: "starter_one_per_card" as const };
  }

  // 4) IP /24 日阈值（软限制）
  if (input.ipPrefix) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: ipToday } = await supabaseAdmin
      .from("purchases")
      .select("id, created_at")
      .eq("plan_id", "starter")
      .eq("ip_prefix", input.ipPrefix);

    const countToday = (ipToday ?? []).filter((r) => (r.created_at ?? "").startsWith(today)).length;
    if (countToday >= 3) return { ok: false, reason: "starter_ip_daily_cap" as const };
  }

  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await readRawBody(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: "bad_signature", message: err?.message }, { status: 400 });
  }

  // 只处理成功付款（Payment Links -> Checkout Session）
  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // ✅ 优先用 metadata.plan_id（最稳），其次再用 payment_link 映射
  const paymentLinkId = (session.payment_link as string | null) ?? null;
  const paymentLinkUrl = (session.metadata?.payment_link_url as string | undefined) ?? null;

  const planId =
    (session.metadata?.plan_id as PlanId | undefined) ??
    resolvePlanIdFromStripePaymentLink({ paymentLinkId, paymentLinkUrl }) ??
    null;

  if (!planId) {
    return NextResponse.json({ error: "unknown_plan", paymentLinkId, paymentLinkUrl }, { status: 400 });
  }

  // ✅ 优先用 metadata.user_id，回退到 client_reference_id
  const userId =
    (session.metadata?.user_id as string | undefined) ??
    (session.client_reference_id as string | undefined);

  if (!userId) {
    return NextResponse.json({ error: "missing_user_id" }, { status: 400 });
  }

  const plan = cfg[planId];

  // —— 幂等：先插入 purchase（stripe_event_id unique）——
  // 同时补充 device_id / ip_prefix / card_fingerprint（尽力拿）
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip");
  const ipPrefix = ipToPrefix(ip);

  // ✅ deviceId 直接取 metadata（最稳）
  const deviceId = (session.metadata?.device_id as string | undefined) ?? null;

  // card fingerprint：checkout session 里拿不到，需 retrieve payment_intent expand
  let cardFingerprint: string | null = null;
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ["payment_method"],
      });

      const pm = pi.payment_method as Stripe.PaymentMethod | null;
      const fp = pm?.card?.fingerprint;
      if (fp) cardFingerprint = fp;
    } catch (err) {
      console.warn("[webhook] Failed to retrieve payment method:", err);
    }
  }

  // Starter 额外校验（强烈建议）
  if (planId === "starter") {
    const allow = await isStarterAllowed({ userId, deviceId, ipPrefix, cardFingerprint });
    if (!allow.ok) {
      // 记录风险事件（可选）
      await supabaseAdmin.from("risk_events").insert({
        user_id: userId,
        device_id: deviceId,
        ip_prefix: ipPrefix,
        event: "starter_purchase_blocked",
        meta: { reason: allow.reason, stripeEventId: event.id },
      });

      // 这里有两种策略：
      // A) 直接不发币，但 purchase 也不落库（用户会投诉）
      // B) 落库并发 0 币 + 触发人工处理（更稳）
      // 我建议：先落库 status='blocked'，并发 0 币。
      await supabaseAdmin.from("purchases").insert({
        user_id: userId,
        plan_id: "starter",
        amount_usd: Number(session.amount_total ?? 0) / 100,
        currency: session.currency ?? "usd",
        stripe_event_id: event.id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: paymentIntentId,
        stripe_payment_link_id: paymentLinkId,
        stripe_payment_link_url: paymentLinkUrl ?? plan.stripe.paymentLinkUrl ?? null,
        device_id: deviceId,
        ip_prefix: ipPrefix,
        card_fingerprint: cardFingerprint,
        status: "blocked",
      }).catch(() => null);

      return NextResponse.json({ received: true, blocked: allow.reason });
    }
  }

  // 插 purchase（幂等关键：unique stripe_event_id / session_id / payment_intent_id）
  const insertRes = await supabaseAdmin.from("purchases").insert({
    user_id: userId,
    plan_id: planId,
    amount_usd: Number(session.amount_total ?? 0) / 100,
    currency: session.currency ?? "usd",
    stripe_event_id: event.id,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId,
    stripe_payment_link_id: paymentLinkId,
    stripe_payment_link_url: paymentLinkUrl ?? plan.stripe.paymentLinkUrl ?? null,
    device_id: deviceId,
    ip_prefix: ipPrefix,
    card_fingerprint: cardFingerprint,
    status: "completed",
  }).select("id").single();

  // 如果插入失败（大概率是幂等冲突），直接返回 OK
  if (insertRes.error) {
    // 典型：duplicate key => webhook 重放，直接忽略
    console.log("[webhook] Purchase already exists (idempotent):", insertRes.error.message);
    return NextResponse.json({ received: true, idempotent: true });
  }

  // 发币：调用 SQL 函数 grant_credits
  const refId = paymentIntentId ?? session.id;
  const { error: grantErr } = await supabaseAdmin.rpc("grant_credits", {
    p_user_id: userId,
    p_permanent: plan.grant.permanentCredits,
    p_bonus: plan.grant.bonusCredits,
    p_bonus_days: plan.grant.bonusDaysValid,
    p_reason: `purchase_${planId}`,
    p_ref_type: "stripe",
    p_ref_id: refId,
  });

  if (grantErr) {
    // 关键：如果发币失败要能重试（你可以让运维重放 webhook）
    console.error("[webhook] Failed to grant credits:", grantErr);
    return NextResponse.json({ error: "grant_failed", details: grantErr.message }, { status: 500 });
  }

  // 记录设备（可选）
  if (deviceId) {
    await supabaseAdmin.from("user_devices").upsert({
      user_id: userId,
      device_id: deviceId,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: "user_id,device_id" }).catch(() => null);
  }

  return NextResponse.json({ received: true });
}

