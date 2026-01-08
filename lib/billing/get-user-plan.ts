import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type UserPlan = "free" | "starter" | "creator" | "studio" | "pro";

/**
 * Get user's current plan from user_entitlements or purchases
 */
export async function getUserPlan(userId: string): Promise<UserPlan> {
  // Try user_entitlements first (if exists)
  const { data: entitlements } = await supabaseAdmin
    .from("user_entitlements")
    .select("plan_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (entitlements?.plan_id) {
    return entitlements.plan_id as UserPlan;
  }

  // Fallback: check latest purchase
  const { data: latestPurchase } = await supabaseAdmin
    .from("purchases")
    .select("plan_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestPurchase?.plan_id) {
    return latestPurchase.plan_id as UserPlan;
  }

  return "free";
}

