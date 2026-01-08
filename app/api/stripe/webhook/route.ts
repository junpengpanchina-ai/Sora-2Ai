import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { planFromPaymentLink, PLAN_CONFIGS } from "@/lib/billing/planConfig";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs"; // IMPORTANT for Stripe webhook

const stripe = getStripe();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function getSignature(req: Request) {
  return req.headers.get("stripe-signature");
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  // Try profiles table first
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!error && data?.id) return data.id;

  // Fallback: try users table (if you have one)
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  return userData?.id ?? null;
}

export async function POST(req: Request) {
  const sig = getSignature(req);
  if (!sig) return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  // We grant credits only when payment is confirmed.
  const eligibleTypes = new Set([
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ]);

  if (!eligibleTypes.has(event.type)) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // ✅ 优先用 metadata.plan_id（最稳）
  const planIdFromMetadata = session.metadata?.plan_id as keyof typeof PLAN_CONFIGS | undefined;
  let plan = planIdFromMetadata ? PLAN_CONFIGS[planIdFromMetadata] : null;

  // 回退：从 payment_link 识别
  if (!plan) {
    const paymentLinkId = typeof session.payment_link === "string" ? session.payment_link : null;
    if (paymentLinkId) {
      plan = planFromPaymentLink(paymentLinkId);
    }
  }

  if (!plan) {
    return NextResponse.json({ error: `Unknown plan (metadata.plan_id=${planIdFromMetadata}, payment_link=${session.payment_link})` }, { status: 400 });
  }

  // Identify user:
  // 1) Prefer client_reference_id if you can pass it (best).
  // 2) Else try session.metadata.user_id
  // 3) Else fallback to email match (requires profiles.email)
  const email = (session.customer_details?.email || session.customer_email || "").toLowerCase();
  const userId =
    (session.client_reference_id as string | null) ||
    (session.metadata?.user_id as string | undefined) ||
    (email ? await findUserIdByEmail(email) : null);

  if (!userId) {
    // Fallback: store pending grant so user can claim later.
    await supabaseAdmin.from("pending_credit_grants").insert({
      stripe_event_id: event.id,
      stripe_session_id: session.id,
      payment_link_id: plan.paymentLinkId,
      email,
      plan_id: plan.planId,
      amount_total: session.amount_total ?? null,
      currency: session.currency ?? "usd",
    });
    return NextResponse.json({ ok: true, pending: true });
  }

  // Atomic + idempotent credit grant in DB
  const paymentLinkId = typeof session.payment_link === "string" ? session.payment_link : plan.paymentLinkId;
  const { error: grantErr } = await supabaseAdmin.rpc("grant_credits_for_purchase", {
    p_user_id: userId,
    p_plan_id: plan.planId,
    p_payment_link_id: paymentLinkId,
    p_stripe_event_id: event.id,
    p_stripe_session_id: session.id,
    p_stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null,
    p_email: email || null,
    p_amount_total: session.amount_total ?? null,
    p_currency: session.currency ?? "usd",
  });

  if (grantErr) {
    // If duplicates happen, function should swallow via ON CONFLICT (idempotent)
    console.error("[webhook] grant_credits_for_purchase error:", grantErr);
    return NextResponse.json({ error: grantErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
