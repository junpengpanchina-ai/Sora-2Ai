import { createClient } from "@supabase/supabase-js";
import { creditsCost, ModelId } from "./cost";
import { planConfig } from "./planConfig";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function chargeForRender(input: {
  userId: string;
  model: ModelId;
  jobId: string; // ref_id
  planId?: string; // entitlement
}) {
  const cost = creditsCost(input.model);

  // 1) Starter 限制：禁止 veo_pro
  if ((input.planId ?? "") === "starter" && input.model === "veo_pro") {
    throw new Error("starter_veo_pro_locked");
  }

  // 2) Starter 限频：按 usage_daily
  if ((input.planId ?? "") === "starter") {
    const starterConfig = planConfig().starter;
    const dailyCaps = starterConfig.dailyCaps;
    if (!dailyCaps) {
      throw new Error("starter_daily_caps_not_configured");
    }
    const day = today();

    const { data: row } = await supabaseAdmin
      .from("usage_daily")
      .select("*")
      .eq("user_id", input.userId)
      .eq("day", day)
      .maybeSingle();

    const soraCount = row?.sora_count ?? 0;
    const fastCount = row?.veo_fast_count ?? 0;

    if (input.model === "sora" && dailyCaps.sora && soraCount >= dailyCaps.sora) {
      throw new Error("starter_daily_sora_cap");
    }
    if (input.model === "veo_fast" && dailyCaps.veo_fast && fastCount >= dailyCaps.veo_fast) {
      throw new Error("starter_daily_veo_fast_cap");
    }
  }

  // 3) 扣币（SQL 强一致）
  const { error: deductErr } = await supabaseAdmin.rpc("deduct_credits_from_wallet", {
    p_user_id: input.userId,
    p_cost: cost,
    p_reason: `render_${input.model}`,
    p_ref_type: "render",
    p_ref_id: input.jobId,
  });

  if (deductErr) {
    if (deductErr.message?.includes("insufficient_credits")) {
      throw new Error("insufficient_credits");
    }
    throw new Error(`deduct_failed:${deductErr.message}`);
  }

  // 4) 记录 usage_daily（可选功能，失败不影响主流程）
  // ⚠️ 如果 increment_usage_daily 函数不存在，不会导致 500 错误
  try {
    const day = today();
    const { error: usageErr } = await supabaseAdmin.rpc("increment_usage_daily", {
      p_user_id: input.userId,
      p_day: day,
      p_model: input.model,
    });

    if (usageErr) {
      // 函数不存在或表不存在时，只记录警告，不抛错
      console.warn("[charge] Failed to increment usage (non-critical):", usageErr.message);
      // 扣币已成功，usage 记录失败不影响主流程
    }
  } catch (usageError) {
    // 捕获任何意外错误（如函数不存在导致的异常）
    console.warn("[charge] Usage tracking error (non-critical):", usageError);
    // 不抛错，确保扣币成功的情况下不会因为 usage 记录失败而失败
  }

  return { ok: true, cost };
}

