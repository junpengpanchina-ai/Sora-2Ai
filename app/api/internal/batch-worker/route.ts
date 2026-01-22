import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createSoraVideoTask, createVeoVideoTask } from "@/lib/grsai/client";
import { pollRemoteTask } from "@/lib/batch/pollRemoteTask";
import { sendBatchWebhook } from "@/lib/batch/webhook";

export const dynamic = "force-dynamic";

function nowMs() {
  return Date.now();
}

function envInt(key: string, fallback: number) {
  const v = Number(process.env[key]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function requireWorkerSecret(req: Request) {
  const got = req.headers.get("x-worker-secret");
  const expect = process.env.INTERNAL_WORKER_SECRET;
  if (!expect)
    return { ok: false, status: 500, error: "MISSING_INTERNAL_WORKER_SECRET" };
  if (!got || got !== expect)
    return { ok: false, status: 401, error: "WORKER_UNAUTHORIZED" };
  return { ok: true as const };
}

// 失败类型枚举（用于 Admin 统计）
type FailureType =
  | "model_error" // 模型错误
  | "param_error" // 参数错误
  | "timeout" // 超时
  | "network" // 网络错误
  | "unknown"; // 未知错误

function classifyFailureType(error: string | null): FailureType {
  if (!error) return "unknown";
  const e = error.toLowerCase();
  if (e.includes("timeout") || e.includes("超时")) return "timeout";
  if (e.includes("network") || e.includes("连接") || e.includes("fetch failed"))
    return "network";
  if (e.includes("model") || e.includes("api") || e.includes("401") || e.includes("403"))
    return "model_error";
  if (e.includes("param") || e.includes("invalid") || e.includes("400")) return "param_error";
  return "unknown";
}

type BatchJobRow = {
  id: string;
  user_id: string;
  status: string;
  total_count: number;
  cost_per_video: number;
  frozen_credits: number | null;
  credits_spent: number | null;
  settlement_status: string | null;
};

type VideoTaskRow = {
  id: string;
  user_id: string;
  batch_job_id: string;
  batch_index: number | null;
  status: string;
  model: string | null;
  prompt: string | null;
  reference_url: string | null;
  aspect_ratio: string | null;
  duration: number | null;
  meta: unknown;
  grsai_task_id: string | null;
  video_url: string | null;
  error_message: string | null;
  poll_count?: number | null;
  last_poll_at?: string | null;
  failure_type?: string | null;
  updated_at?: string;
};

function pickBaseUrl(): string | null {
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  return site ? site.replace(/\/+$/, "") : null;
}

function isVeo(model: string | null) {
  const m = (model || "").toLowerCase();
  return m.includes("veo");
}

function normalizeAspectRatio(x: string | null) {
  if (!x) return null;
  if (x === "9:16" || x === "16:9" || x === "1:1") return x;
  return x;
}

function extractUrlParam(referenceUrl: string | null): string | null {
  if (!referenceUrl) return null;
  try {
    const u = new URL(referenceUrl);
    const p = u.searchParams.get("url");
    return p ? p : referenceUrl;
  } catch {
    return referenceUrl;
  }
}

async function claimQueuedBatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  limit: number,
) {
  // 先挑 queued 的 batch（不直接 update limit，因为 PostgREST 受限）
  const { data: candidates, error } = await supabase
    .from("batch_jobs")
    .select("id,user_id,status,total_count,cost_per_video,frozen_credits")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const claimed: BatchJobRow[] = [];
  for (const b of (candidates ?? []) as BatchJobRow[]) {
    // 竞争条件：只有 status=queued 的才能被抢到
    const { data: updated, error: e2 } = await supabase
      .from("batch_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", b.id)
      .eq("status", "queued")
      .select("id,user_id,status,total_count,cost_per_video,frozen_credits")
      .maybeSingle();

    if (e2) continue;
    if (updated) claimed.push(updated as BatchJobRow);
  }
  return claimed;
}

async function freezeCreditsForBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batch: BatchJobRow,
) {
  const required = Number(batch.total_count || 0) * Number(batch.cost_per_video || 0);
  // 你已经有该 RPC：freeze_credits_for_batch(p_batch_id, p_user_id, p_amount)
  const { data, error } = await supabase.rpc("freeze_credits_for_batch", {
    p_batch_id: batch.id,
    p_user_id: batch.user_id,
    p_amount: required,
  });
  if (error) throw error;
  return { required, rpc: data };
}

async function enqueueBatchTasks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  batchId: string,
  maxToStart: number,
) {
  // 把 batch 内 pending 的 video_tasks 拉出来并启动远端任务（限制并发）
  const { data: tasks, error } = await supabase
    .from("video_tasks")
    .select(
      "id,user_id,batch_job_id,batch_index,status,model,prompt,reference_url,aspect_ratio,duration,meta,grsai_task_id,video_url,error_message",
    )
    .eq("batch_job_id", batchId)
    .in("status", ["pending", "queued"])
    .order("batch_index", { ascending: true })
    .limit(maxToStart);

  if (error) throw error;

  let started = 0;
  for (const t of (tasks ?? []) as VideoTaskRow[]) {
    // 竞争条件：只有 status=pending/queued 才能进入 processing（避免重复启动）
    const { data: locked } = await supabase
      .from("video_tasks")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", t.id)
      .in("status", ["pending", "queued"])
      .select("id,model,prompt,reference_url,aspect_ratio,duration,meta")
      .maybeSingle();

    if (!locked) continue;

    try {
      // 你仓库里已经有：createSoraVideoTask / createVeoVideoTask（复用现有 grsai/client）
      let remoteTaskId: string | null = null;

      const model = (t.model || "").toLowerCase();
      const baseUrl = pickBaseUrl();
      const webhookUrl = baseUrl
        ? `${baseUrl}/api/video/callback?task_id=${encodeURIComponent(t.id)}`
        : "-1";

      const aspectRatio = normalizeAspectRatio(t.aspect_ratio);
      const prompt = t.prompt || "";

      if (isVeo(model)) {
        const meta = (t.meta || {}) as {
          firstFrameUrl?: string;
          lastFrameUrl?: string;
          urls?: string[];
        };
        const apiModelName = model === "veo-flash" ? "veo3.1-fast" : "veo3.1-pro";
        const r = await createVeoVideoTask({
          model: apiModelName,
          prompt,
          aspectRatio: (aspectRatio === "9:16" || aspectRatio === "16:9"
            ? aspectRatio
            : undefined) as "9:16" | "16:9" | undefined,
          ...(meta.firstFrameUrl ? { firstFrameUrl: meta.firstFrameUrl } : {}),
          ...(meta.lastFrameUrl ? { lastFrameUrl: meta.lastFrameUrl } : {}),
          ...(meta.urls && meta.urls.length ? { urls: meta.urls.slice(0, 3) } : {}),
          ...(t.reference_url && !meta.urls?.length
            ? { urls: [t.reference_url] }
            : {}),
          webHook: webhookUrl,
          shutProgress: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resAny = r as any;
        remoteTaskId =
          resAny?.data?.id || resAny?.id || resAny?.task_id || resAny?.data?.task_id || null;
      } else {
        // Sora 或默认
        const reference = extractUrlParam(t.reference_url);
        const duration = t.duration === 15 ? 15 : 10;
        const r = await createSoraVideoTask({
          model: "sora-2",
          prompt,
          aspectRatio: (aspectRatio === "9:16" || aspectRatio === "16:9"
            ? aspectRatio
            : undefined) as "9:16" | "16:9" | undefined,
          duration,
          size: "small",
          ...(reference ? { url: reference } : {}),
          webHook: webhookUrl,
          shutProgress: false,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const resAny = r as any;
        remoteTaskId =
          resAny?.data?.id || resAny?.id || resAny?.task_id || resAny?.data?.task_id || null;
      }

      if (!remoteTaskId) {
        await supabase
          .from("video_tasks")
          .update({
            status: "failed",
            error_message: "REMOTE_TASK_ID_MISSING",
            failure_type: "model_error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", t.id);
        continue;
      }

      await supabase
        .from("video_tasks")
        .update({
          grsai_task_id: remoteTaskId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);

      started += 1;
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || "ENQUEUE_FAILED";
      await supabase
        .from("video_tasks")
        .update({
          status: "failed",
          error_message: errorMsg,
          failure_type: classifyFailureType(errorMsg),
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
    }
  }

  return { started };
}

// 轮询退避策略：根据 progress 计算延迟
function getPollBackoffDelay(progress: number | null | undefined, pollCount: number): number {
  // progress < 100 → 延迟 5s / 15s / 30s（根据轮询次数）
  if (progress === null || progress === undefined || progress < 100) {
    if (pollCount <= 1) return 5000; // 5s
    if (pollCount <= 3) return 15000; // 15s
    return 30000; // 30s
  }
  return 0; // progress = 100，立即轮询
}

// 最大轮询次数保护（避免死任务）
function shouldPollTask(
  task: VideoTaskRow,
  maxPollCount: number,
): { should: boolean; reason?: string } {
  const pollCount = task.poll_count ?? 0;
  if (pollCount >= maxPollCount) {
    return {
      should: false,
      reason: `MAX_POLL_COUNT_REACHED:${maxPollCount}`,
    };
  }

  // 如果 last_poll_at 存在，检查退避延迟
  if (task.last_poll_at) {
    const lastPoll = new Date(task.last_poll_at).getTime();
    const now = Date.now();
    const delay = getPollBackoffDelay(null, pollCount);
    if (now - lastPoll < delay) {
      return {
        should: false,
        reason: "BACKOFF_DELAY_NOT_MET",
      };
    }
  }

  return { should: true };
}

async function pollProcessingTasks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  limit: number,
) {
  const MAX_POLL_COUNT = envInt("BATCH_MAX_POLL_COUNT", 20); // 最大轮询次数

  const { data: tasks, error } = await supabase
    .from("video_tasks")
    .select(
      "id,batch_job_id,status,grsai_task_id,video_url,error_message,poll_count,last_poll_at,failure_type",
    )
    .eq("status", "processing")
    .not("grsai_task_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  let succeeded = 0;
  let failed = 0;
  let stillProcessing = 0;
  let transientErrors = 0;
  let skippedBackoff = 0;
  let maxPollReached = 0;

  for (const t of (tasks ?? []) as VideoTaskRow[]) {
    // 最大轮询次数保护
    const pollCheck = shouldPollTask(t, MAX_POLL_COUNT);
    if (!pollCheck.should) {
      if (pollCheck.reason?.includes("MAX_POLL_COUNT")) {
        // 达到最大轮询次数，标记为失败
        await supabase
          .from("video_tasks")
          .update({
            status: "failed",
            error_message: pollCheck.reason,
            failure_type: "timeout",
            updated_at: new Date().toISOString(),
          })
          .eq("id", t.id);
        failed += 1;
        maxPollReached += 1;
      } else {
        skippedBackoff += 1;
      }
      continue;
    }

    const taskId = t.grsai_task_id!;
    const r = await pollRemoteTask(taskId);

    // 更新轮询计数和时间
    const pollCount = (t.poll_count ?? 0) + 1;
    await supabase
      .from("video_tasks")
      .update({
        poll_count: pollCount,
        last_poll_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);

    if (!r.ok) {
      // 生产级：轮询失败（网络/临时错误）不把任务置 failed，留给下轮
      transientErrors += 1;
      continue;
    }

    if (r.status === "processing") {
      stillProcessing += 1;
      continue;
    }

    if (r.status === "succeeded") {
      await supabase
        .from("video_tasks")
        .update({
          status: "succeeded",
          video_url: r.video_url ?? null,
          error_message: null,
          failure_type: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      succeeded += 1;
      continue;
    }

    if (r.status === "failed") {
      const failureType = classifyFailureType(r.error_message ?? null);
      await supabase
        .from("video_tasks")
        .update({
          status: "failed",
          error_message: r.error_message ?? "REMOTE_TASK_FAILED",
          failure_type: failureType,
          updated_at: new Date().toISOString(),
        })
        .eq("id", t.id);
      failed += 1;
      continue;
    }
  }

  return {
    scanned: (tasks ?? []).length,
    succeeded,
    failed,
    stillProcessing,
    transientErrors,
    skippedBackoff,
    maxPollReached,
  };
}

async function settleFinishedBatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  limit: number,
) {
  // 找 processing 的 batch（按时间）并逐个检查是否可结算
  const { data: batches, error } = await supabase
    .from("batch_jobs")
    .select(
      "id,user_id,status,total_count,cost_per_video,frozen_credits,credits_spent,settlement_status",
    )
    .eq("status", "processing")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  let scanned = 0;
  let settled = 0;
  let webhookSent = 0;
  let webhookFailed = 0;

  for (const b of (batches ?? []) as BatchJobRow[]) {
    scanned += 1;

    // 读取任务汇总
    const { data: tasks, error: e2 } = await supabase
      .from("video_tasks")
      .select("status")
      .eq("batch_job_id", b.id);

    if (e2) continue;

    const total = tasks?.length ?? 0;
    if (total === 0) continue;

    const success = (tasks ?? []).filter((t: unknown) => {
      const task = t as { status?: string };
      return task.status === "succeeded";
    }).length;
    const fail = (tasks ?? []).filter((t: unknown) => {
      const task = t as { status?: string };
      return task.status === "failed";
    }).length;
    const done = success + fail;

    // 未完成，不结算
    if (done < total) continue;

    // 结算（多退少不补）
    const spent = success * Number(b.cost_per_video || 0);

    // 你已经有 finalize_batch_credits(p_batch_id, p_user_id, p_spent)
    const { error: e3 } = await supabase.rpc("finalize_batch_credits", {
      p_batch_id: b.id,
      p_user_id: b.user_id,
      p_spent: spent,
    });
    if (e3) {
      // eslint-disable-next-line no-console
      console.error("[batch-worker] finalize_batch_credits failed", {
        batch_id: b.id,
        err: e3,
      });
      continue;
    }

    const finalStatus =
      success === total ? "completed" : success > 0 ? "partial" : "failed";

    // 写回 batch_jobs
    await supabase
      .from("batch_jobs")
      .update({
        status: finalStatus,
        success_count: success,
        failed_count: fail,
        credits_spent: spent,
        // settlement_status 由 RPC 内部写（你已有 pending/finalized/refunded）
        updated_at: new Date().toISOString(),
      })
      .eq("id", b.id);

    settled += 1;

    // 企业 webhook（生产级：失败不影响结算；重试由 sendBatchWebhook 内部做）
    try {
      const ok = await sendBatchWebhook(supabase, {
        batch_id: b.id,
        user_id: b.user_id,
        status: finalStatus,
        total_count: total,
        success_count: success,
        failed_count: fail,
        credits_spent: spent,
      });
      if (ok) webhookSent += 1;
      else webhookFailed += 1;
    } catch {
      webhookFailed += 1;
    }
  }

  return {
    scanned,
    settled,
    webhook_sent: webhookSent,
    webhook_failed: webhookFailed,
  };
}

export async function POST(req: Request) {
  const auth = requireWorkerSecret(req);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const t0 = nowMs();
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  // 生产级参数（可通过 env 调）
  const MAX_CLAIM = envInt("BATCH_WORKER_MAX_CLAIM", 5);
  const MAX_START_TASKS_PER_BATCH = envInt("BATCH_WORKER_MAX_START_TASKS_PER_BATCH", 10);
  const MAX_POLL = envInt("BATCH_WORKER_MAX_POLL", 25);
  const MAX_SETTLE = envInt("BATCH_WORKER_MAX_SETTLE", 10);

  let claimed = 0;
  let frozen = 0;
  let tasksStarted = 0;

  // 1) Dispatch: claim queued → processing，freeze credits，并启动 pending tasks
  try {
    const claimedBatches = await claimQueuedBatches(client, MAX_CLAIM);
    claimed = claimedBatches.length;

    for (const b of claimedBatches) {
      try {
        const { required, rpc } = await freezeCreditsForBatch(client, b);
        // 如果 RPC already=true 也算 frozen 成功（预扣幂等）
        frozen += 1;

        // 启动任务（只启动一部分，避免瞬间打爆下游）
        const enq = await enqueueBatchTasks(client, b.id, MAX_START_TASKS_PER_BATCH);
        tasksStarted += enq.started;

        // eslint-disable-next-line no-console
        console.log("[batch-worker][dispatch]", {
          batch_id: b.id,
          required,
          freeze_rpc: rpc ?? null,
          started: enq.started,
        });
      } catch (err: unknown) {
        // freeze 失败：把 batch 标为 failed（避免卡 processing）
        // eslint-disable-next-line no-console
        console.error("[batch-worker][dispatch] freeze/enqueue failed", {
          batch_id: b.id,
          err,
        });
        await client
          .from("batch_jobs")
          .update({
            status: "failed",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            last_error: (err as { message?: string })?.message || "FREEZE_OR_ENQUEUE_FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", b.id);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[batch-worker] dispatch phase error", err);
  }

  // 2) Poll: 更新 processing tasks（不把 transient poll error 标 failed）
  let poll = {
    scanned: 0,
    succeeded: 0,
    failed: 0,
    stillProcessing: 0,
    transientErrors: 0,
    skippedBackoff: 0,
    maxPollReached: 0,
  };
  try {
    poll = await pollProcessingTasks(client, MAX_POLL);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[batch-worker] poll phase error", err);
  }

  // 3) Settle: 全完成 batch 结算+退款，并 webhook 通知
  let settle = { scanned: 0, settled: 0, webhook_sent: 0, webhook_failed: 0 };
  try {
    settle = await settleFinishedBatches(client, MAX_SETTLE);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[batch-worker] settle phase error", err);
  }

  const duration_ms = nowMs() - t0;

  return NextResponse.json({
    ok: true,
    dispatch: { claimed, frozen, tasks_started: tasksStarted },
    poll,
    settle,
    duration_ms,
  });
}
