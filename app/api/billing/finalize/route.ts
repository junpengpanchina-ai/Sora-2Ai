/**
 * Finalize payment and add credits to wallet
 * 
 * Called from /billing/success page after Stripe Payment Link payment
 * Handles: session retrieval, pack identification, idempotency, wallet credit addition
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { itemIdFromAmount, getPlanConfig, STRIPE_PAYMENT_LINKS, type PlanId } from "@/lib/billing/config";

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

    // 2) Identify item (prefer payment_link, fallback to amount)
    let itemId: string | null = null;

    // Try payment_link first (most reliable)
    if (session.payment_link) {
      const plinkId = String(session.payment_link);
      // Check if we have a mapping (you'll need to add actual Payment Link IDs from Stripe)
      if (STRIPE_PAYMENT_LINKS[plinkId]) {
        itemId = STRIPE_PAYMENT_LINKS[plinkId];
      }
    }

    // Fallback to amount-based identification
    if (!itemId) {
      itemId = itemIdFromAmount(amountTotal);
    }

    if (!itemId) {
      return NextResponse.json(
        { ok: false, error: `unknown_amount_total:${amountTotal}` },
        { status: 400 }
      );
    }

    // 3) Idempotency: if already applied, return ok
    const { data: existing } = await supabase
      .from("purchases")
      .select("id")
      .eq("provider", "stripe")
      .eq("provider_payment_id", session.id)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: true, alreadyApplied: true });
    }

    // 4) Record purchase
    const amountUsd = (amountTotal / 100).toFixed(2);
    const email = session.customer_details?.email ?? null;

    const { error: pErr } = await supabase.from("purchases").insert({
      user_id: userId,
      item_id: itemId,
      provider: "stripe",
      provider_payment_id: session.id,
      amount_usd: Number(amountUsd),
      status: "paid",
      // TODO: Add device_id, ip_hash, payment_fingerprint if available
    });

    if (pErr) {
      console.error("[billing/finalize] Failed to record purchase:", pErr);
      return NextResponse.json(
        { ok: false, error: pErr.message },
        { status: 400 }
      );
    }

    // 5) Get plan configuration
    const cfg = getPlanConfig(itemId as PlanId | "veoProUpgrade");

    // For veoProUpgrade, preserve existing entitlements
    if (itemId === "veoProUpgrade") {
      const { data: ent } = await supabase
        .from("user_entitlements")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (ent) {
        cfg.ent.planId = (ent.plan_id as PlanId) || "free";
        cfg.ent.veoProEnabled = ent.veo_pro_enabled || false;
        cfg.ent.priority = ent.priority_queue || false;
        cfg.ent.maxConcurrency = ent.max_concurrency || 1;
      }
    }

    // 6) Apply purchase to wallet & entitlements
    const { error: aErr } = await supabase.rpc("apply_purchase", {
      p_user_id: userId,
      p_item_id: itemId,
      p_permanent: cfg.permanent,
      p_bonus: cfg.bonus,
      p_bonus_expires_at: cfg.bonusExpiresAt,
      p_plan_id: cfg.ent.planId,
      p_veo_pro_enabled: cfg.ent.veoProEnabled,
      p_priority: cfg.ent.priority,
      p_max_concurrency: cfg.ent.maxConcurrency,
    });

    if (aErr) {
      console.error("[billing/finalize] Failed to apply purchase:", aErr);
      // Note: Purchase is already recorded, but credits not added
      // You may want to implement a retry mechanism or manual review
      return NextResponse.json(
        { ok: false, error: aErr.message },
        { status: 400 }
      );
    }

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

