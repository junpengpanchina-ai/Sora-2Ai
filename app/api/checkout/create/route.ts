// app/api/checkout/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_CONFIGS, type PlanId } from "@/lib/billing/planConfig";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const stripe = getStripe();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getBaseUrl(req: NextRequest) {
  // 生产推荐用 env 固定，不要信 header
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
}

// 简单的 IPv4 /24（用于 metadata 可选）
function ipToPrefix(ip?: string | null): string | null {
  if (!ip) return null;
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!m) return null;
  return `${m[1]}.${m[2]}.${m[3]}.0/24`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planId = body.planId as PlanId | undefined;
    const deviceId = (body.deviceId as string | undefined) ?? null;

    if (!planId) {
      return NextResponse.json({ error: "missing_planId" }, { status: 400 });
    }

    const cfg = PLAN_CONFIGS[planId];
    if (!cfg) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    // ✅ 从 Supabase Auth 里拿当前用户（服务端验证）
    // 前端要带 supabase access token（cookie auth 或 header）
    const authHeader = req.headers.get("authorization");
    const jwt = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!jwt) {
      return NextResponse.json({ error: "missing_auth_token" }, { status: 401 });
    }

    const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
    if (userErr || !userRes?.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const userId = userRes.user.id;

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip");
    const rawIp = ip ?? "";
    const ipPrefix = ipToPrefix(ip);

    // Starter 风控：每用户一次、每设备一次、每 IP 24h 最多 3 次，并写入 starter_purchase_guards
    if (planId === "starter") {
      const { count: userStarterCount } = await supabaseAdmin
        .from("purchases")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("plan_id", "starter")
        .eq("status", "paid");

      if ((userStarterCount ?? 0) >= 1) {
        return NextResponse.json(
          { error: "starter_user_limit", reason: "user_already_purchased_starter" },
          { status: 403 }
        );
      }

      if (deviceId) {
        const { count: deviceCount } = await supabaseAdmin
          .from("starter_purchase_guards")
          .select("*", { count: "exact", head: true })
          .eq("device_id", deviceId);
        if ((deviceCount ?? 0) >= 1) {
          return NextResponse.json(
            { error: "starter_device_limit", reason: "device_already_used_for_starter" },
            { status: 403 }
          );
        }
      }

      if (rawIp) {
        const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
        const { count: ipCount } = await supabaseAdmin
          .from("starter_purchase_guards")
          .select("*", { count: "exact", head: true })
          .eq("ip", rawIp)
          .gte("created_at", since);
        if ((ipCount ?? 0) >= 3) {
          return NextResponse.json(
            { error: "starter_ip_limit", reason: "too_many_starter_purchases_from_ip" },
            { status: 403 }
          );
        }
      }

      await supabaseAdmin.from("starter_purchase_guards").insert({
        user_id: userId,
        device_id: deviceId || null,
        ip: rawIp || null,
        email: userRes.user.email || null,
      });
    }

    const baseUrl = getBaseUrl(req);

    // ✅ 创建 Checkout Session with line_items (payment_link is not supported in sessions.create)
    // We use line_items to set the price, and metadata to pass user/plan info to webhook
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: cfg.displayName,
            },
            unit_amount: Math.round(cfg.priceUsd * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      // 让 webhook 能取到 userId（两种都写）
      client_reference_id: userId,
      metadata: {
        user_id: userId,
        plan_id: planId, // ✅ 最稳：webhook 优先用这个
        amount_usd: cfg.priceUsd.toString(),
        device_id: deviceId ?? "",
        ip_prefix: ipPrefix ?? "",
      },
      success_url: `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });

  } catch (e: unknown) {
    console.error("[checkout/create] Error:", e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: "checkout_create_failed", message }, { status: 500 });
  }
}

