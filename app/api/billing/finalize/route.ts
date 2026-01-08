/**
 * Finalize payment and add credits to wallet
 * 
 * Called from /billing/success page after Stripe Payment Link payment
 * Handles: session retrieval, pack identification, idempotency, wallet credit addition
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPlanConfig, type PlanId } from "@/lib/billing/config";

export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };
    
    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "missing_session_id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // 1) Fetch Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    if (!session || session.payment_status !== "paid") {
      return NextResponse.json(
        { ok: false, error: "not_paid" },
        { status: 400 }
      );
    }

    const amountTotal = session.amount_total ?? 0;
    const currency = session.currency?.toUpperCase();

    if (currency && currency !== "USD") {
      return NextResponse.json(
        { ok: false, error: "currency_not_usd" },
        { status: 400 }
      );
    }

    // 2) Identify plan (prefer metadata, fallback to payment_link)
    // ❌ 不使用金额兜底（容易误判）
    let itemId: string | null = null;

    // Try metadata first (from Checkout Session)
    if (session.metadata?.plan_id) {
      itemId = session.metadata.plan_id;
    }

    // Fallback to payment_link identification
    if (!itemId) {
      const paymentLinkId = typeof session.payment_link === 'string' 
        ? session.payment_link 
        : null;
      if (paymentLinkId) {
        const { planFromPaymentLink } = await import('@/lib/billing/planConfig');
        const plan = planFromPaymentLink(paymentLinkId);
        if (plan) {
          itemId = plan.planId;
        }
      }
    }

    // If still no plan identified, return error (do not use amount fallback)
    if (!itemId || !(itemId === 'starter' || itemId === 'creator' || itemId === 'studio' || itemId === 'pro' || itemId === 'veoProUpgrade')) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Cannot identify plan',
          details: 'Plan identification requires either metadata.plan_id or a valid payment_link_id. Amount-based identification is not supported.'
        },
        { status: 400 }
      );
    }

    // 3) Idempotency: check if already processed (using stripe_session_id)
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("stripe_session_id", session.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }

    // 4) Use grant_credits_for_purchase RPC (atomic + idempotent)
    // Note: This function automatically inserts into purchases table
    // We use session.id as event_id since this is a direct call (not from webhook)
    const paymentLinkId = typeof session.payment_link === 'string' 
      ? session.payment_link 
      : (session.metadata?.payment_link_id as string | undefined) || '';
    
    const email = session.customer_details?.email || session.customer_email || null;

    // @ts-expect-error - Supabase RPC type inference issue
    const { error: grantErr } = await supabase.rpc("grant_credits_for_purchase", {
      p_user_id: userId,
      p_plan_id: itemId as string,
      p_payment_link_id: paymentLinkId,
      p_stripe_event_id: `finalize_${session.id}`, // Use session.id as unique event_id
      p_stripe_session_id: session.id,
      p_stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
      p_email: email,
      p_amount_total: amountTotal,
      p_currency: session.currency || 'usd',
    });

    if (grantErr) {
      console.error("[billing/finalize] Failed to grant credits:", grantErr);
      // Note: Function is idempotent, so retries are safe
      return NextResponse.json(
        { ok: false, error: grantErr.message },
        { status: 400 }
      );
    }

    // Get plan config for response (credits already granted by RPC)
    const cfg = getPlanConfig(itemId as PlanId | "veoProUpgrade");

    return NextResponse.json({
      ok: true,
      itemId,
      email,
      credits: {
        permanent: cfg.permanent,
        bonus: cfg.bonus,
      },
    });
  } catch (error) {
    console.error("[billing/finalize] Unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

