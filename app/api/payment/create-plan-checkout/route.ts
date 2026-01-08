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
import type Stripe from "stripe";

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

    // Risk control: Check if user can purchase Starter (anti-abuse)
    if (planId === "starter") {
      
      // Extract IP and calculate prefix
      const requestIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                       request.headers.get("x-real-ip") ||
                       request.headers.get("cf-connecting-ip") ||
                       null;
      
      let ipPrefix: string | null = null;
      if (requestIp) {
        const ipv4Match = requestIp.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
          ipPrefix = `${ipv4Match[1]}.${ipv4Match[2]}.${ipv4Match[3]}.0/24`;
        }
      }

      // Check if user can purchase Starter
      const { data: canPurchase, error: riskErr } = await supabase.rpc("can_purchase_starter", {
        p_user_id: auth.user.id,
        p_device_id: deviceId,
        p_ip_prefix: ipPrefix,
        p_payment_fingerprint: null, // Will be set in webhook
      });

      if (riskErr) {
        console.error("[create-plan-checkout] Risk check error:", riskErr);
        // Don't block, but log the error
      } else if (canPurchase && !canPurchase.can_purchase) {
        console.warn("[create-plan-checkout] Starter purchase blocked:", canPurchase.reason);
        return NextResponse.json(
          {
            error: "Starter Access purchase not available",
            reason: canPurchase.reason,
            details: "Starter Access is limited to one purchase per account, device, or payment method.",
          },
          { status: 403 }
        );
      }
    }

    // Get base URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000";

    // Create Stripe Checkout Session
    let stripe;
    try {
      stripe = getStripe();
      console.log("[create-plan-checkout] Stripe client initialized");
    } catch (stripeError) {
      console.error("[create-plan-checkout] Failed to initialize Stripe:", stripeError);
      return NextResponse.json(
        {
          error: "Stripe configuration error",
          details: stripeError instanceof Error ? stripeError.message : "Failed to initialize Stripe client",
        },
        { status: 500 }
      );
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
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
    };

    console.log("[create-plan-checkout] Creating Stripe session", {
      planId,
      amount: plan.priceUsd,
      baseUrl,
      customerEmail: auth.user.email,
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionConfig);
    } catch (stripeError) {
      const error = stripeError as { message?: string; type?: string; code?: string; statusCode?: number; raw?: unknown };
      console.error("[create-plan-checkout] Stripe API error:", {
        error: stripeError,
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        raw: error.raw,
      });
      return NextResponse.json(
        {
          error: "Failed to create checkout session",
          details: error.message || "Stripe API error",
          stripeErrorType: error.type,
          stripeErrorCode: error.code,
        },
        { status: 500 }
      );
    }

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

