import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateOrigin } from "@/lib/csrf";
import { getCreditsForModel, type ModelType } from "@/lib/credits";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Request validation schema
const batchRequestSchema = z.object({
  prompts: z.array(z.string().min(5)).min(1).max(100),
  model: z.enum(["sora-2", "veo-flash", "veo-pro"]).default("sora-2"),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  duration: z.enum(["5", "10"]).default("5"),
});

function jsonResponse<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...init?.headers,
    },
  });
}

export async function POST(request: NextRequest) {
  // CSRF validation
  if (!validateOrigin(request)) {
    return jsonResponse({ error: "Invalid origin" }, { status: 403 });
  }

  try {
    // Authenticate user
    const supabase = await createClient(request.headers);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return jsonResponse(
        { error: "Unauthorized, please login first" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const parsed = batchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { prompts, model, aspectRatio, duration } = parsed.data;
    const totalCount = prompts.length;
    const costPerVideo = getCreditsForModel(model as ModelType);
    const requiredCredits = totalCount * costPerVideo;

    // Use service client for database operations
    const serviceClient = await createServiceClient();

    // Check user credits balance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: wallet, error: walletError } = await (serviceClient as any)
      .from("credit_wallet")
      .select("permanent_credits, bonus_credits")
      .eq("user_id", user.id)
      .single();

    if (walletError || !wallet) {
      return jsonResponse(
        { error: "Failed to get wallet balance" },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walletData = wallet as any;
    const availableCredits = (walletData.permanent_credits || 0) + (walletData.bonus_credits || 0);

    if (availableCredits < requiredCredits) {
      return jsonResponse(
        {
          error: "INSUFFICIENT_CREDITS",
          message: "Insufficient credits.",
          required: requiredCredits,
          available: availableCredits,
        },
        { status: 402 }
      );
    }

    // Create batch job
    const batchId = randomUUID();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: batchError } = await (serviceClient as any).from("batch_jobs").insert({
      id: batchId,
      user_id: user.id,
      status: "queued",
      total_count: totalCount,
      success_count: 0,
      failed_count: 0,
      cost_per_video: costPerVideo,
      frozen_credits: requiredCredits,
      credits_spent: 0,
      settlement_status: "pending",
    });

    if (batchError) {
      console.error("[batch/create] Failed to create batch job:", batchError);
      return jsonResponse(
        { error: "Failed to create batch job" },
        { status: 500 }
      );
    }

    // Freeze credits (deduct from wallet, record in ledger)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: freezeError } = await (serviceClient as any).rpc(
      "freeze_credits_for_batch",
      {
        p_user_id: user.id,
        p_batch_id: batchId,
        p_amount: requiredCredits,
      }
    );

    if (freezeError) {
      console.error("[batch/create] Failed to freeze credits:", freezeError);
      // Rollback batch job
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any).from("batch_jobs").delete().eq("id", batchId);
      return jsonResponse(
        { error: "Failed to freeze credits" },
        { status: 500 }
      );
    }

    // Create video tasks for each prompt
    const tasks = prompts.map((prompt, index) => ({
      id: randomUUID(),
      user_id: user.id,
      batch_job_id: batchId,
      prompt,
      model,
      aspect_ratio: aspectRatio,
      duration: parseInt(duration),
      status: "pending",
      index_in_batch: index,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: tasksError } = await (serviceClient as any)
      .from("video_tasks")
      .insert(tasks);

    if (tasksError) {
      console.error("[batch/create] Failed to create tasks:", tasksError);
      // Refund credits and delete batch
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any).rpc("refund_frozen_credits", {
        p_user_id: user.id,
        p_batch_id: batchId,
        p_amount: requiredCredits,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any).from("batch_jobs").delete().eq("id", batchId);
      return jsonResponse(
        { error: "Failed to create video tasks" },
        { status: 500 }
      );
    }

    // Update batch status to queued (ready for worker)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any)
      .from("batch_jobs")
      .update({ status: "queued" })
      .eq("id", batchId);

    return jsonResponse({
      ok: true,
      batch_id: batchId,
      total_count: totalCount,
      cost_per_video: costPerVideo,
      credits_frozen: requiredCredits,
      credits_remaining: availableCredits - requiredCredits,
      message: `Batch created. Total: ${totalCount} videos.`,
    });
  } catch (error) {
    console.error("[batch/create] Unexpected error:", error);
    return jsonResponse(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Check batch status
export async function GET(request: NextRequest) {
  const supabase = await createClient(request.headers);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const batchId = searchParams.get("batch_id");

  if (!batchId) {
    // Return user's recent batches
    const serviceClient = await createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: batches, error } = await (serviceClient as any)
      .from("batch_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return jsonResponse({ error: "Failed to fetch batches" }, { status: 500 });
    }

    return jsonResponse({ batches });
  }

  // Return specific batch with tasks
  const serviceClient = await createServiceClient();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: batch, error: batchError } = await (serviceClient as any)
    .from("batch_jobs")
    .select("*")
    .eq("id", batchId)
    .eq("user_id", user.id)
    .single();

  if (batchError || !batch) {
    return jsonResponse({ error: "Batch not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tasks, error: tasksError } = await (serviceClient as any)
    .from("video_tasks")
    .select("id, prompt, status, video_url, error, created_at, updated_at")
    .eq("batch_job_id", batchId)
    .order("index_in_batch", { ascending: true });

  if (tasksError) {
    return jsonResponse({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  return jsonResponse({
    batch: {
      id: batch.id,
      status: batch.status,
      total_count: batch.total_count,
      success_count: batch.success_count,
      failed_count: batch.failed_count,
      cost_per_video: batch.cost_per_video,
      credits_frozen: batch.frozen_credits,
      credits_spent: batch.credits_spent,
      created_at: batch.created_at,
      completed_at: batch.completed_at,
    },
    tasks,
  });
}
