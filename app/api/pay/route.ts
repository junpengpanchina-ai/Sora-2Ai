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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const planId = (searchParams.get("plan") || "") as keyof typeof PLAN_CONFIGS;
  const deviceId = searchParams.get("device_id") || "";
  const email = (searchParams.get("email") || "").toLowerCase();

  if (!PLAN_CONFIGS[planId]) return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
  if (!deviceId) return NextResponse.json({ error: "missing_device_id" }, { status: 400 });

  // Only guard Starter; others can go direct.
  if (planId !== "starter") {
    const paymentLinkUrl = PLAN_CONFIGS[planId].paymentLinkUrl;
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
  const paymentLink = PLAN_CONFIGS.starter.paymentLinkUrl;
  const redirectUrl = email
    ? `${paymentLink}?prefilled_email=${encodeURIComponent(email)}`
    : paymentLink;

  return NextResponse.redirect(redirectUrl, 302);
}

