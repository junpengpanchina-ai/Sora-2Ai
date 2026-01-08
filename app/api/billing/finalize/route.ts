/**
 * Check payment status and wallet balance (READ-ONLY)
 * 
 * ⚠️ IMPORTANT: This endpoint does NOT grant credits.
 * Credits are granted ONLY by Stripe Webhook (/api/payment/webhook or /api/stripe/webhook).
 * 
 * Called from /billing/success page to check payment status.
 * Returns payment status and current wallet balance.
 */
import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { sessionId } = (await req.json()) as { sessionId?: string };
    
    if (!sessionId) {
      return NextResponse.json(
        { status: "not_found", error: "missing_session_id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { status: "not_found", error: "unauthorized" },
        { status: 401 }
      );
    }

    // 1) Fetch Stripe session
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer_details"],
    });

    if (!session) {
      return NextResponse.json({
        status: "not_found",
        error: "Session not found",
      });
    }

    // 2) Check payment status
    const paymentStatus = session.payment_status;
    if (paymentStatus === "paid") {
      // 3) Check if credits were already granted (by webhook)
      const { data: purchase } = await supabase
        .from("purchases")
        .select("plan_id, created_at")
        .eq("stripe_session_id", session.id)
        .limit(1)
        .maybeSingle();

      const purchaseData = purchase as { plan_id: string; created_at: string } | null;

      // 4) Get current wallet balance
      const { data: wallet } = await supabase
        .from("wallets")
        .select("permanent_credits, bonus_credits, bonus_expires_at")
        .eq("user_id", userId)
        .single();

      const walletData = wallet as { permanent_credits: number; bonus_credits: number; bonus_expires_at: string | null } | null;

      return NextResponse.json({
        status: "paid",
        wallet: walletData ? {
          permanentCredits: walletData.permanent_credits,
          bonusCredits: walletData.bonus_credits,
          bonusExpiresAt: walletData.bonus_expires_at,
        } : null,
        purchaseApplied: !!purchaseData,
        purchasePlanId: purchaseData?.plan_id || null,
      });
    } else if (paymentStatus === "unpaid" || paymentStatus === "no_payment_required") {
      return NextResponse.json({
        status: "pending",
        paymentStatus,
      });
    } else {
      return NextResponse.json({
        status: "not_found",
        paymentStatus,
      });
    }
  } catch (error) {
    console.error("[billing/finalize] Unexpected error:", error);
    return NextResponse.json(
      {
        status: "not_found",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

