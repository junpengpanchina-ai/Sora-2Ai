/**
 * Create Stripe Checkout Session for pricing plans
 * 
 * This API creates a Checkout Session (instead of using Payment Links)
 * which gives us full control over success/cancel URLs
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabase } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { PRICING_CONFIG, type PlanId } from "@/lib/billing/config";
import type Stripe from "stripe";

const supabaseAdmin = createSupabase(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

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
    const { planId, deviceId } = body as { planId: PlanId; deviceId?: string | null };

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
    // 与 /api/checkout/create、/api/pay 一致：raw IP 计数，通过后写入 starter_purchase_guards
    if (planId === "starter") {
      const requestIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip") ||
        "";

      // Check 1: User already purchased Starter
      const { data: userPurchase } = await supabaseAdmin
        .from("purchases")
        .select("id")
        .eq("user_id", auth.user.id)
        .eq("plan_id", "starter")
        .eq("status", "paid")
        .limit(1)
        .maybeSingle();

      if (userPurchase) {
        return NextResponse.json(
          {
            error: "Starter Access purchase not available",
            reason: "user_already_purchased_starter",
            details: "Starter Access is limited to one purchase per account.",
          },
          { status: 403 }
        );
      }

      // Check 2: Device already used for Starter
      if (deviceId) {
        const { data: devicePurchase } = await supabaseAdmin
          .from("starter_purchase_guards")
          .select("id")
          .eq("device_id", deviceId)
          .limit(1)
          .maybeSingle();

        if (devicePurchase) {
          return NextResponse.json(
            {
              error: "Starter Access purchase not available",
              reason: "device_already_used_for_starter",
              details: "Starter Access is limited to one purchase per device.",
            },
            { status: 403 }
          );
        }
      }

      // Check 3: 同一 IP 24h 内最多 3 次（与 /api/pay 一致：starter_purchase_guards 存 raw IP）
      if (requestIp) {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { count: ipCount } = await supabaseAdmin
          .from("starter_purchase_guards")
          .select("*", { count: "exact", head: true })
          .eq("ip", requestIp)
          .gte("created_at", twentyFourHoursAgo);

        if ((ipCount ?? 0) >= 3) {
          return NextResponse.json(
            {
              error: "Starter Access purchase not available",
              reason: "too_many_starter_purchases_from_ip",
              details: "Too many Starter purchases from this IP address in the last 24 hours.",
            },
            { status: 403 }
          );
        }
      }

      // 通过风控后写入 guard，与 /api/pay、/api/checkout/create 一致
      await supabaseAdmin.from("starter_purchase_guards").insert({
        user_id: auth.user.id,
        device_id: deviceId || null,
        ip: requestIp || null,
        email: auth.user.email || null,
      });
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

