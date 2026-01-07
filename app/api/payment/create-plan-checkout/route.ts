/**
 * Create Stripe Checkout Session for pricing plans
 * 
 * This API creates a Checkout Session (instead of using Payment Links)
 * which gives us full control over success/cancel URLs
 */
import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { PRICING_CONFIG, type PlanId } from "@/lib/billing/config";

export async function POST(request: NextRequest) {
  try {
    // Log request headers for debugging
    const authHeader = request.headers.get("authorization");
    console.log("[create-plan-checkout] Request received", {
      hasAuthHeader: !!authHeader,
      authHeaderPrefix: authHeader?.substring(0, 20) || "none",
      origin: request.headers.get("origin"),
      referer: request.headers.get("referer"),
    });

    // Create Supabase client with request headers (for auth)
    const supabase = await createClient(request.headers);
    const { data: auth, error: authError } = await supabase.auth.getUser();
    
    console.log("[create-plan-checkout] Auth check", {
      hasUser: !!auth.user,
      userId: auth.user?.id,
      email: auth.user?.email,
      authError: authError?.message,
    });
    
    if (!auth.user) {
      console.error("[create-plan-checkout] Unauthorized - no user", {
        authError: authError?.message,
      });
      return NextResponse.json(
        { error: "Unauthorized, please login first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId } = body as { planId: PlanId };

    if (!planId || planId === "free") {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const plan = PRICING_CONFIG.plans[planId];
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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.ui.title,
              description: plan.ui.bullets?.join(". ") || "",
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
      metadata: {
        user_id: auth.user.id,
        plan_id: planId,
        amount_usd: plan.priceUsd.toString(),
      },
    });

    console.log("[create-plan-checkout] Checkout session created", {
      sessionId: session.id,
      checkoutUrl: session.url,
      userId: auth.user.id,
      planId,
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("[create-plan-checkout] Error:", error, {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

