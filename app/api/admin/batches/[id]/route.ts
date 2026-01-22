import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await validateAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const batchId = params.id;
  if (!batchId) {
    return NextResponse.json({ ok: false, error: "MISSING_BATCH_ID" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 1) Batch 基本信息
  const { data: batch, error: batchError } = await client
    .from("batch_jobs")
    .select("*")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    return NextResponse.json(
      { ok: false, error: "BATCH_FETCH_FAILED", details: String(batchError) },
      { status: 500 },
    );
  }

  if (!batch) {
    return NextResponse.json({ ok: false, error: "BATCH_NOT_FOUND" }, { status: 404 });
  }

  // 2) 用户信息（企业客户）
  const { data: user } = await client
    .from("users")
    .select("id,email,name")
    .eq("id", batch.user_id)
    .maybeSingle();

  // 3) 计算退款金额
  const frozenCredits = Number(batch.frozen_credits ?? 0);
  const creditsSpent = Number(batch.credits_spent ?? 0);
  const refunded = Math.max(0, frozenCredits - creditsSpent);

  return NextResponse.json({
    ok: true,
    batch: {
      ...batch,
      refunded,
      user: user ?? null,
    },
  });
}
