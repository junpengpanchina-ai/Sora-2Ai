import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { PLAN_CONFIGS } from "@/lib/billing/planConfig";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function getIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    ""
  );
}

// Payment Link URLs (from Stripe Dashboard)
const PAYMENT_LINK_URLS: Record<keyof typeof PLAN_CONFIGS, string> = {
  starter: "https://buy.stripe.com/28EbJ14jUg2L6550Ug0kE05",
  creator: "https://buy.stripe.com/dRmcN55nY4k33WXfPa0kE03",
  studio: "https://buy.stripe.com/6oU7sL17IdUD51132o0kE06",
  pro: "https://buy.stripe.com/4gMcN5eYy5o70KLauQ0kE01",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = (searchParams.get("plan") || "") as keyof typeof PLAN_CONFIGS;
  const deviceId = searchParams.get("device_id") || "";
  const email = (searchParams.get("email") || "").toLowerCase();

  if (!PLAN_CONFIGS[planId]) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  if (!deviceId) return NextResponse.json({ error: "missing_device_id" }, { status: 400 });

  // Only guard Starter; others can go direct.
  if (planId !== "starter") {
    const paymentLinkUrl = PAYMENT_LINK_URLS[planId];
    if (email) {
      return NextResponse.redirect(`${paymentLinkUrl}?prefilled_email=${encodeURIComponent(email)}`, 302);
    }
    return NextResponse.redirect(paymentLinkUrl, 302);
  }

  const ip = getIp(req);

  // Device once
  const { count: deviceCount } = await sb
    .from("starter_purchase_guards")
    .select("*", { count: "exact", head: true })
    .eq("device_id", deviceId);

  if ((deviceCount ?? 0) >= 1) {
    return NextResponse.json({ error: "starter_device_limit" }, { status: 403 });
  }

  // IP daily cap (simple version)
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count: ipCount } = await sb
    .from("starter_purchase_guards")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .gte("created_at", since);

  if ((ipCount ?? 0) >= 3) {
    return NextResponse.json({ error: "starter_ip_limit" }, { status: 403 });
  }

  // record attempt (guard row)
  await sb.from("starter_purchase_guards").insert({
    device_id: deviceId,
    ip,
    email: email || null,
  });

  // Prefill email so webhook can match user (IMPORTANT)
  const paymentLink = PAYMENT_LINK_URLS.starter;
  const redirectUrl = email
    ? `${paymentLink}?prefilled_email=${encodeURIComponent(email)}`
    : paymentLink;

  return NextResponse.redirect(redirectUrl, 302);
}

