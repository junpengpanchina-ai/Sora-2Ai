/**
 * Create Stripe Checkout Session with user_id and device_id
 * 
 * This replaces direct Payment Link usage to ensure we capture
 * user_id and device_id for anti-abuse tracking
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { planConfig, type PlanId } from "@/lib/billing/planConfig";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client with request headers (for auth)
    const supabase = await createClient(request.headers);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    if (!auth.user) {
      return NextResponse.json(
        { error: "Unauthorized, please login first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, deviceId } = body as { planId: PlanId; deviceId?: string };

    if (!planId || !["starter", "creator", "studio", "pro"].includes(planId)) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const plan = planConfig()[planId];
    if (!plan) {
      return NextResponse.json(
        { error: "Plan not found" },
        { status: 404 }
      );
    }

    // Get base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    const stripe = getStripe();

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.planId === "starter" ? "Starter Access (7 days)" : `${plan.planId.charAt(0).toUpperCase() + plan.planId.slice(1)} Pack`,
              description: plan.planId === "starter" 
                ? "Includes bonus credits for 7 days"
                : `${plan.grant.permanentCredits} permanent + ${plan.grant.bonusCredits} bonus credits`,
            },
            unit_amount: Math.round(plan.priceUsd * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      customer_email: auth.user.email || undefined,
      // 关键：把 user_id 和 device_id 写进去
      client_reference_id: auth.user.id,
      metadata: {
        user_id: auth.user.id,
        plan_id: planId,
        amount_usd: plan.priceUsd.toString(),
        device_id: deviceId || "",
        payment_link_url: plan.stripe.paymentLinkUrl || "",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("[checkout/create] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

