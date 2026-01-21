import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function isWorkerAuthorized(req: Request): boolean {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (!secret) return false;

  const headerSecret = req.headers.get("x-worker-secret");
  const query = new URL(req.url).searchParams.get("secret");

  return headerSecret === secret || query === secret;
}

type BatchJobRow = {
  id: string;
  user_id: string;
  status: string;
  total_count: number | null;
  success_count: number | null;
  failed_count: number | null;
  cost_per_video: number;
  frozen_credits: number | null;
};

async function dispatchJobs(client: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = client as any;

  // 1) 领取一批 queued → processing 的 batch_jobs
  const { data: jobs, error: claimError } = await supabase.rpc(
    "claim_batch_jobs",
    { p_limit: 5 },
  );

  if (claimError) {
    throw new Error(`claim_batch_jobs failed: ${claimError.message}`);
  }

  const claimed: BatchJobRow[] = (jobs ?? []) as BatchJobRow[];
  if (!claimed.length) {
    return { claimed: 0, frozen: 0 };
  }

  let frozenCount = 0;

  for (const job of claimed) {
    const totalCount = Number(job.total_count ?? 0);
    if (!Number.isFinite(totalCount) || totalCount <= 0) continue;

    const costPerVideo = Number(job.cost_per_video ?? 0);
    if (!Number.isFinite(costPerVideo) || costPerVideo <= 0) continue;

    const estimated = totalCount * costPerVideo;
    const alreadyFrozen = Number(job.frozen_credits ?? 0);

    if (alreadyFrozen >= estimated) {
      continue;
    }

    const { data: freezeRes, error: freezeError } = await supabase.rpc(
      "freeze_credits_for_batch",
      {
        p_batch_id: job.id,
        p_user_id: job.user_id,
        p_amount: estimated,
      },
    );

    if (freezeError) {
      // 冻结失败：标记为 failed，避免无限重试
      // 不抛出异常，防止影响其他 job
      // eslint-disable-next-line no-console
      console.error("[batch-worker] freeze_credits_for_batch failed", {
        batch_id: job.id,
        error: freezeError.message,
      });
      // best-effort 更新状态
      // eslint-disable-next-line no-await-in-loop
      await supabase
        .from("batch_jobs")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      continue;
    }

    const ok = !!freezeRes?.ok;
    const successFlag =
      typeof freezeRes?.ok === "boolean" ? freezeRes.ok : ok;

    if (!successFlag) {
      // eslint-disable-next-line no-console
      console.error("[batch-worker] freeze_credits_for_batch not ok", {
        batch_id: job.id,
        response: freezeRes,
      });
      // eslint-disable-next-line no-await-in-loop
      await supabase
        .from("batch_jobs")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      continue;
    }

    frozenCount += 1;
  }

  return { claimed: claimed.length, frozen: frozenCount };
}

async function settleJobs(client: unknown) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = client as any;

  // 仅扫描 processing 状态的 batch_jobs
  const { data: running, error: scanError } = await supabase
    .from("batch_jobs")
    .select(
      "id, user_id, status, total_count, success_count, failed_count, cost_per_video, frozen_credits",
    )
    .eq("status", "processing")
    .order("created_at", { ascending: true })
    .limit(10);

  if (scanError) {
    throw new Error(`scan running batch_jobs failed: ${scanError.message}`);
  }

  const jobs: BatchJobRow[] = (running ?? []) as BatchJobRow[];
  if (!jobs.length) {
    return { scanned: 0, settled: 0 };
  }

  let settled = 0;

  for (const job of jobs) {
    // 获取该 batch 的所有 video_tasks 状态
    const { data: tasks, error: taskError } = await supabase
      .from("video_tasks")
      .select("status")
      .eq("batch_job_id", job.id);

    if (taskError) {
      // eslint-disable-next-line no-console
      console.error("[batch-worker] load video_tasks failed", {
        batch_id: job.id,
        error: taskError.message,
      });
      continue;
    }

    const rows: { status: string }[] = (tasks ?? []) as { status: string }[];
    if (!rows.length) {
      // 没有子任务，直接标记为 failed 并跳过
      // eslint-disable-next-line no-await-in-loop
      await supabase
        .from("batch_jobs")
        .update({
          status: "failed",
          success_count: 0,
          failed_count: 0,
          updated_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      settled += 1;
      continue;
    }

    const total = rows.length;
    const succeeded = rows.filter((t) => t.status === "succeeded").length;
    const failed = rows.filter((t) => t.status === "failed").length;
    const done = succeeded + failed;

    // 还有未完成任务，暂不结算
    if (done < total) continue;

    const costPerVideo = Number(job.cost_per_video ?? 0);
    const spent = succeeded * (Number.isFinite(costPerVideo) ? costPerVideo : 0);

    const { error: finalizeError } = await supabase.rpc(
      "finalize_batch_credits",
      {
        p_batch_id: job.id,
        p_user_id: job.user_id,
        p_spent: spent,
      },
    );

    if (finalizeError) {
      // eslint-disable-next-line no-console
      console.error("[batch-worker] finalize_batch_credits failed", {
        batch_id: job.id,
        error: finalizeError.message,
      });
      continue;
    }

    const newStatus =
      succeeded === 0 && failed > 0
        ? "failed"
        : failed > 0 && succeeded > 0
          ? "partial"
          : "completed";

    // eslint-disable-next-line no-await-in-loop
    await supabase
      .from("batch_jobs")
      .update({
        status: newStatus,
        success_count: succeeded,
        failed_count: failed,
        credits_spent: spent,
        updated_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    settled += 1;
  }

  return { scanned: jobs.length, settled };
}

export async function POST(req: Request) {
  if (!isWorkerAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "WORKER_UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const supabase = await createServiceClient();
  const start = Date.now();

  try {
    const [dispatchResult, settleResult] = await Promise.all([
      dispatchJobs(supabase),
      settleJobs(supabase),
    ]);

    const durationMs = Date.now() - start;

    return NextResponse.json({
      ok: true,
      dispatch: dispatchResult,
      settle: settleResult,
      duration_ms: durationMs,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[batch-worker] unexpected error", error);
    const durationMs = Date.now() - start;

    return NextResponse.json(
      {
        ok: false,
        error: "WORKER_FAILED",
        message: error instanceof Error ? error.message : String(error),
        duration_ms: durationMs,
      },
      { status: 500 },
    );
  }
}

