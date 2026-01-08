import { createClient } from "@supabase/supabase-js";

export type ModelId = "sora" | "veo_fast" | "veo_pro";

export function supabaseServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function deductCredits(params: {
  userId: string;
  modelId: ModelId;
  cost: number;
  refId: string; // generation_id
}) {
  const sb = supabaseServerClient();
  const { data, error } = await sb.rpc("deduct_credits_from_wallet", {
    p_user_id: params.userId,
    p_model_id: params.modelId,
    p_cost: params.cost,
    p_ref_id: params.refId,
  });

  if (error) throw error;
  return data?.[0] as { permanent_spent: number; bonus_spent: number };
}

// Optional: refund (if generation fails)
export async function refundCredits(params: {
  userId: string;
  permanent: number;
  bonus: number;
  refId: string;
  reason?: string;
}) {
  const sb = supabaseServerClient();

  // Get current balances
  const { data: wallet, error: walletErr } = await sb
    .from("wallets")
    .select("permanent_credits, bonus_credits")
    .eq("user_id", params.userId)
    .single();

  if (walletErr || !wallet) throw walletErr || new Error("Wallet not found");

  // Update wallet
  const { error: upErr } = await sb
    .from("wallets")
    .update({
      permanent_credits: wallet.permanent_credits + params.permanent,
      bonus_credits: wallet.bonus_credits + params.bonus,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId);

  if (upErr) throw upErr;

  // Record in ledger
  await sb.from("wallet_ledger").insert({
    user_id: params.userId,
    delta_permanent: params.permanent,
    delta_bonus: params.bonus,
    reason: params.reason ?? "render_refund",
    ref_type: "refund",
    ref_id: params.refId,
  });
}

