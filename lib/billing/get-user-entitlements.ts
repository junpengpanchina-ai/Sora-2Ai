/**
 * Get User Entitlements
 * 
 * Fetches user entitlements from database (plan, Veo Pro access, etc.)
 */

import { createClient } from "@/lib/supabase/server";

export type UserEntitlements = {
  planId: "free" | "starter" | "creator" | "studio" | "pro";
  veoProEnabled: boolean;
  priorityQueue: boolean;
  maxConcurrency: number;
};

/**
 * Get user entitlements (server-side)
 */
export async function getUserEntitlements(userId: string): Promise<UserEntitlements | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("user_entitlements")
    .select("plan_id, veo_pro_enabled, priority_queue, max_concurrency")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    // Return default free plan if not found
    return {
      planId: "free",
      veoProEnabled: false,
      priorityQueue: false,
      maxConcurrency: 1,
    };
  }

  return {
    planId: (data.plan_id as UserEntitlements["planId"]) || "free",
    veoProEnabled: data.veo_pro_enabled || false,
    priorityQueue: data.priority_queue || false,
    maxConcurrency: data.max_concurrency || 1,
  };
}

