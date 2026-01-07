/**
 * Start render: Check Starter daily caps + deduct credits
 * 
 * Called before video generation to:
 * 1. Check Starter daily limits (if applicable)
 * 2. Deduct credits (bonus first)
 * 3. Return wallet status
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRICING_CONFIG } from "@/lib/billing/config";

type Body = {
  modelId: "sora" | "veo_fast" | "veo_pro";
  deviceId?: string;
  ipHash?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const supabase = await createClient();

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const modelId = body.modelId;
    const cost = PRICING_CONFIG.modelCosts[modelId];
    
    if (!cost) {
      return NextResponse.json(
        { ok: false, error: "unknown_model" },
        { status: 400 }
      );
    }

    // 1) Check starter daily caps / lock veo_pro on starter
    const capParams = {
      p_user_id: userId,
      p_model: modelId,
      p_device_id: body.deviceId ?? "",
      p_ip_hash: body.ipHash ?? "",
    };
    const rpcResult = await supabase.rpc(
      "check_and_increment_daily_usage",
      capParams as never
    ) as { data: Array<{ ok: boolean; error?: string }> | null; error: Error | null };
    const capRes = rpcResult.data;
    const capErr = rpcResult.error;

    if (capErr) {
      console.error("[render/start] Daily usage check error:", capErr);
      return NextResponse.json(
        { ok: false, error: capErr.message },
        { status: 400 }
      );
    }

    if (capRes && capRes[0] && capRes[0].ok === false) {
      return NextResponse.json(
        { ok: false, error: capRes[0].error },
        { status: 429 }
      );
    }

    // 2) Deduct credits (bonus first)
    const deductParams = {
      p_user_id: userId,
      p_cost: cost,
    };
    const deductResult = await supabase.rpc("deduct_credits", deductParams as never) as {
      data: Array<{ ok: boolean; error?: string; permanent_credits?: number; bonus_credits?: number }> | null;
      error: Error | null;
    };
    const dRes = deductResult.data;
    const dErr = deductResult.error;

    if (dErr) {
      console.error("[render/start] Credit deduction error:", dErr);
      return NextResponse.json(
        { ok: false, error: dErr.message },
        { status: 400 }
      );
    }

    if (dRes && dRes[0] && dRes[0].ok === false) {
      return NextResponse.json(
        { ok: false, error: dRes[0].error },
        { status: 402 }
      );
    }

    return NextResponse.json({
      ok: true,
      cost,
      wallet: dRes?.[0] ?? null,
    });
  } catch (error) {
    console.error("[render/start] Unexpected error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

