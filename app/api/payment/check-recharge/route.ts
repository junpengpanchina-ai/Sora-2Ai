// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/**
 * P2 补单统一：Stripe 已 paid、本地 pending 时，统一走 grant_credits_for_purchase → wallets。
 * 不再写 users.credits。stripe_event_id 加 manual_reconcile_ 前缀，天然幂等。
 */
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { getOrCreateUser } from "@/lib/user";
import { getStripe } from "@/lib/stripe";
import { itemIdFromAmount } from "@/lib/billing/config";
import { PLAN_CONFIGS } from "@/lib/billing/planConfig";
import type { PlanId } from "@/lib/billing/planConfig";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const GRANT_PLANS: PlanId[] = ["starter", "creator", "studio", "pro"];

const supabaseAdmin = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function getWalletTotal(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("wallets")
    .select("permanent_credits, bonus_credits")
    .eq("user_id", userId)
    .maybeSingle();
  const p = Number(data?.permanent_credits ?? 0);
  const b = Number(data?.bonus_credits ?? 0);
  return { total: p + b, permanent_credits: p, bonus_credits: b };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rechargeId = searchParams.get("recharge_id");

    if (!rechargeId) {
      return NextResponse.json({ error: "Missing recharge_id parameter" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userProfile = await getOrCreateUser(supabase, user);
    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: rechargeRecord, error: rechargeError } = await supabase
      .from("recharge_records")
      .select("*")
      .eq("id", rechargeId)
      .single();

    if (rechargeError || !rechargeRecord) {
      return NextResponse.json(
        { error: "Recharge record not found", details: rechargeError?.message },
        { status: 404 }
      );
    }

    if (rechargeRecord.user_id !== userProfile.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 });
    }

    if (rechargeRecord.status === "pending" && rechargeRecord.payment_id) {
      try {
        const stripe = getStripe();

        try {
          const session = await stripe.checkout.sessions.retrieve(rechargeRecord.payment_id);

          if (session.payment_status === "paid" && rechargeRecord.status === "pending") {
            const planIdRaw =
              (session.metadata?.plan_id as string) || itemIdFromAmount(session.amount_total ?? 0);
            const planId = GRANT_PLANS.includes(planIdRaw as PlanId) ? (planIdRaw as PlanId) : null;

            if (planId) {
              const started = Date.now();
              const eventId = `manual_reconcile_${session.id}`;
              const { error: grantErr } = await supabaseAdmin.rpc("grant_credits_for_purchase", {
                p_user_id: userProfile.id,
                p_plan_id: planId,
                p_payment_link_id: PLAN_CONFIGS[planId]?.paymentLinkId ?? "",
                p_stripe_event_id: eventId,
                p_stripe_session_id: session.id,
                p_stripe_payment_intent_id:
                  typeof session.payment_intent === "string" ? session.payment_intent : null,
                p_email: session.customer_email || session.customer_details?.email || null,
                p_amount_total: session.amount_total ?? null,
                p_currency: session.currency || "usd",
              });
              const duration = Date.now() - started;

              if (grantErr) {
                console.error("[check-recharge] grant_credits_for_purchase error:", {
                  event_id: eventId,
                  session_id: session.id,
                  plan_id: planId,
                  user_id: userProfile.id,
                  rpc_error: grantErr.message,
                  duration_ms: duration,
                });
                return NextResponse.json(
                  {
                    success: false,
                    error: "Failed to grant credits",
                    details: grantErr.message,
                  },
                  { status: 500 }
                );
              }

              console.log("[check-recharge]", {
                event_id: eventId,
                session_id: session.id,
                plan_id: planId,
                user_id: userProfile.id,
                rpc_result: "ok",
                duration_ms: duration,
              });

              await supabase
                .from("recharge_records")
                .update({ status: "completed", completed_at: new Date().toISOString() })
                .eq("id", rechargeId);

              const wallet = await getWalletTotal(supabase, userProfile.id);
              return NextResponse.json({
                success: true,
                recharge_status: "completed",
                recharge_record: { ...rechargeRecord, status: "completed" },
                user_credits: wallet.total,
                permanent_credits: wallet.permanent_credits,
                bonus_credits: wallet.bonus_credits,
                payment_verified: true,
                message: "Payment verified and credits added to wallet",
              });
            }

            return NextResponse.json({
              success: true,
              recharge_status: "pending",
              recharge_record: rechargeRecord,
              need_manual_review: true,
              user_credits: (await getWalletTotal(supabase, userProfile.id)).total,
              message:
                "Payment verified in Stripe but plan could not be identified. Credits not granted. Contact support.",
            });
          }

          if (session.payment_status === "unpaid" || session.payment_status === "no_payment_required") {
            const wallet = await getWalletTotal(supabase, userProfile.id);
            return NextResponse.json({
              success: true,
              recharge_status: "pending",
              recharge_record: rechargeRecord,
              payment_status: session.payment_status,
              user_credits: wallet.total,
              message: "Payment not yet completed",
            });
          }
        } catch {
          // payment_id 可能不是 session id，走 PaymentIntents 分支
        }

        const { data: userEmail } = await supabase
          .from("users")
          .select("email")
          .eq("id", userProfile.id)
          .single();

        if (userEmail?.email) {
          const { data: list } = await stripe.paymentIntents.list({ limit: 10 });
          const matchingIntent = list?.data?.find(
            (pi) =>
              pi.amount === Math.round(Number(rechargeRecord.amount) * 100) &&
              pi.status === "succeeded" &&
              pi.created > Math.floor(new Date(rechargeRecord.created_at).getTime() / 1000) - 3600
          );

          if (matchingIntent && rechargeRecord.status === "pending") {
            const planIdRaw = itemIdFromAmount(matchingIntent.amount);
            const planId = GRANT_PLANS.includes(planIdRaw as PlanId) ? (planIdRaw as PlanId) : null;

            if (planId) {
              const started = Date.now();
              const eventId = `manual_reconcile_pi_${matchingIntent.id}`;
              const { error: grantErr } = await supabaseAdmin.rpc("grant_credits_for_purchase", {
                p_user_id: userProfile.id,
                p_plan_id: planId,
                p_payment_link_id: PLAN_CONFIGS[planId]?.paymentLinkId ?? "",
                p_stripe_event_id: eventId,
                p_stripe_session_id: null,
                p_stripe_payment_intent_id: matchingIntent.id,
                p_email: userEmail.email,
                p_amount_total: matchingIntent.amount,
                p_currency: matchingIntent.currency || "usd",
              });
              const duration = Date.now() - started;

              if (grantErr) {
                console.error("[check-recharge] grant_credits_for_purchase (pi) error:", {
                  event_id: eventId,
                  payment_intent_id: matchingIntent.id,
                  plan_id: planId,
                  user_id: userProfile.id,
                  rpc_error: grantErr.message,
                  duration_ms: duration,
                });
                return NextResponse.json(
                  { success: false, error: "Failed to grant credits", details: grantErr.message },
                  { status: 500 }
                );
              }

              console.log("[check-recharge]", {
                event_id: eventId,
                payment_intent_id: matchingIntent.id,
                plan_id: planId,
                user_id: userProfile.id,
                rpc_result: "ok",
                duration_ms: duration,
              });

              await supabase
                .from("recharge_records")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                  payment_id: matchingIntent.id,
                })
                .eq("id", rechargeId);

              const wallet = await getWalletTotal(supabase, userProfile.id);
              return NextResponse.json({
                success: true,
                recharge_status: "completed",
                recharge_record: { ...rechargeRecord, status: "completed", payment_id: matchingIntent.id },
                user_credits: wallet.total,
                permanent_credits: wallet.permanent_credits,
                bonus_credits: wallet.bonus_credits,
                payment_verified: true,
                message: "Payment verified and credits added to wallet",
              });
            }
          }
        }
      } catch (stripeError) {
        console.error("Failed to verify payment with Stripe:", stripeError);
      }
    }

    const wallet = await getWalletTotal(supabase, userProfile.id);
    return NextResponse.json({
      success: true,
      recharge_status: rechargeRecord.status,
      recharge_record: rechargeRecord,
      user_credits: wallet.total,
      permanent_credits: wallet.permanent_credits,
      bonus_credits: wallet.bonus_credits,
      payment_verified: false,
    });
  } catch (error) {
    console.error("Failed to check recharge status:", error);
    return NextResponse.json(
      {
        error: "Failed to check recharge status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
