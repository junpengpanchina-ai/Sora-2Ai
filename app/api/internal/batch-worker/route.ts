import { NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function mustWorkerAuth(req: Request): boolean {
  const secret = process.env.INTERNAL_WORKER_SECRET;
  if (!secret) return false;
  const got = req.headers.get("x-worker-secret");
  return !!got && got === secret;
}

function nowIso() {
  return new Date().toISOString();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function signWebhook(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function postWebhook(
  url: string,
  payload: unknown,
  secret?: string | null,
) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-webhook-timestamp": String(Date.now()),
  };
  if (secret) headers["x-webhook-signature"] = signWebhook(body, secret);

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: ctrl.signal,
    });
    return { ok: res.ok, status: res.status };
  } catch (e: unknown) {
    return {
      ok: false,
      status: 0,
      error: String((e as { message?: string })?.message ?? e),
    };
  } finally {
    clearTimeout(t);
  }
}

function isRetryableError(msg: string) {
  const m = msg.toLowerCase();
  return (
    m.includes("timeout") ||
    m.includes("temporarily") ||
    m.includes("rate") ||
    m.includes("429") ||
    m.includes("503") ||
    m.includes("network") ||
    m.includes("retryable")
  );
}

// 这里是"最小可运行"的关键：你把真实生成逻辑接进来即可
// 默认实现：如果你没接生成，则直接失败（但会走退款，账不炸）
async function runOneTask(_task: unknown) {
  const endpoint = process.env.INTERNAL_GENERATE_ENDPOINT; // 例如 https://xxx/api/internal/generate
  const secret = process.env.INTERNAL_GENERATE_SECRET;

  if (!endpoint) {
    return { ok: false, error: "NO_GENERATE_ENDPOINT_CONFIGURED" };
  }

  const task = _task as {
    id: string;
    prompt?: string | null;
    model?: string | null;
    meta?: unknown;
  };

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-internal-secret": secret } : {}),
      },
      body: JSON.stringify({
        task_id: task.id,
        prompt: task.prompt,
        model: task.model ?? null,
        meta: task.meta ?? null,
      }),
      signal: ctrl.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, error: `GENERATOR_HTTP_${res.status}:${txt}` };
    }
    const data = await res.json().catch(() => ({}));
    const videoUrl = data?.video_url || data?.url || null;
    if (!videoUrl) return { ok: false, error: "GENERATOR_NO_VIDEO_URL" };

    return { ok: true, video_url: String(videoUrl) };
  } catch (e: unknown) {
    return { ok: false, error: String((e as { message?: string })?.message ?? e) };
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: Request) {
  if (!mustWorkerAuth(req)) {
    return NextResponse.json(
      { ok: false, error: "UNAUTHORIZED" },
      { status: 401 },
    );
  }

  const started = Date.now();
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  const CLAIM_LIMIT = Number(process.env.BATCH_CLAIM_LIMIT ?? 5) || 5;
  const TASK_CONCURRENCY = Number(process.env.BATCH_TASK_CONCURRENCY ?? 3) || 3;
  const MAX_TASK_RETRIES = Number(process.env.MAX_TASK_RETRIES ?? 2) || 2;

  // 1) claim queued batches -> processing
  const { data: claimed, error: claimErr } = await client.rpc(
    "claim_batch_jobs",
    {
      p_limit: CLAIM_LIMIT,
    },
  );

  if (claimErr) {
    return NextResponse.json(
      {
        ok: false,
        error: "CLAIM_FAILED",
        details: String(claimErr.message ?? claimErr),
      },
      { status: 500 },
    );
  }

  const batches: unknown[] = Array.isArray(claimed) ? claimed : [];
  let frozenOk = 0;
  let processedTasks = 0;
  let settledBatches = 0;
  let webhookSent = 0;

  // 2) dispatch loop
  for (const b of batches) {
    const batch = b as {
      id: string;
      user_id: string;
      total_count?: number | null;
      cost_per_video?: number | null;
      webhook_url?: string | null;
      webhook_secret?: string | null;
    };
    const batchId = String(batch.id);
    const userId = String(batch.user_id);
    const totalCount = Number(batch.total_count ?? 0);
    const costPerVideo = Number(batch.cost_per_video ?? 10);
    const required = totalCount * costPerVideo;

    // 2.1 freeze upfront（等价冻结）
    const { data: freezeRes, error: freezeErr } = await client.rpc(
      "freeze_credits_for_batch",
      {
        p_batch_id: batchId,
        p_user_id: userId,
        p_amount: required,
      },
    );

    if (freezeErr || !freezeRes?.ok) {
      await client
        .from("batch_jobs")
        .update({
          status: "failed",
          failed_count: totalCount,
          credits_spent: 0,
          settlement_status: "finalized",
          completed_at: nowIso(),
        })
        .eq("id", batchId);

      continue;
    }
    frozenOk += 1;

    // 2.2 load tasks
    const { data: tasks, error: taskErr } = await client
      .from("video_tasks")
      .select(
        "id,batch_index,status,prompt,model,meta,video_url,error_message",
      )
      .eq("batch_job_id", batchId)
      .order("batch_index", { ascending: true });

    if (taskErr) {
      // 任务都处理不了 → 直接结算全退（spent=0）
      await client.rpc("finalize_batch_credits", {
        p_batch_id: batchId,
        p_user_id: userId,
        p_spent: 0,
      });

      await client
        .from("batch_jobs")
        .update({
          status: "failed",
          success_count: 0,
          failed_count: totalCount,
          credits_spent: 0,
          settlement_status: "refunded",
          completed_at: nowIso(),
        })
        .eq("id", batchId);

      continue;
    }

    const taskList: unknown[] = Array.isArray(tasks) ? tasks : [];

    // 2.3 并发处理 queued/processing 的任务（最小：只处理 queued）
    const queue = taskList.filter(
      (t) => String((t as { status?: string }).status) === "queued",
    );

    let idx = 0;
    async function workerOne() {
      while (idx < queue.length) {
        const t = queue[idx++] as {
          id: string;
          prompt?: string | null;
          model?: string | null;
          meta?: unknown;
        };
        const taskId = String(t.id);

        // 标记 processing（如果你表没有这个状态，也不会影响；你可以只用 queued/succeeded/failed）
        await client
          .from("video_tasks")
          .update({ status: "processing", updated_at: nowIso() })
          .eq("id", taskId);

        let lastErr = "";
        let ok = false;
        let videoUrl: string | null = null;

        for (let attempt = 0; attempt <= MAX_TASK_RETRIES; attempt++) {
          const r = await runOneTask(t);
          if (r.ok) {
            ok = true;
            videoUrl = r.video_url ?? null;
            break;
          }
          lastErr = String(r.error ?? "UNKNOWN_ERROR");
          if (!isRetryableError(lastErr) || attempt === MAX_TASK_RETRIES) break;
          await sleep(800 * (attempt + 1));
        }

        if (ok && videoUrl) {
          await client
            .from("video_tasks")
            .update({
              status: "succeeded",
              video_url: videoUrl,
              error_message: null,
              updated_at: nowIso(),
            })
            .eq("id", taskId);
        } else {
          await client
            .from("video_tasks")
            .update({
              status: "failed",
              error_message: lastErr.slice(0, 800),
              updated_at: nowIso(),
            })
            .eq("id", taskId);
        }

        processedTasks += 1;
      }
    }

    const workers = Array.from({ length: Math.max(1, TASK_CONCURRENCY) }, () =>
      workerOne(),
    );
    await Promise.all(workers);

    // 2.4 settle if all done（succeeded/failed）
    const { data: finalTasks, error: finalErr } = await client
      .from("video_tasks")
      .select("status")
      .eq("batch_job_id", batchId);

    if (finalErr) continue;

    const finals: unknown[] = Array.isArray(finalTasks) ? finalTasks : [];
    const succ = finals.filter(
      (x) => String((x as { status?: string }).status) === "succeeded",
    ).length;
    const fail = finals.filter(
      (x) => String((x as { status?: string }).status) === "failed",
    ).length;

    if (succ + fail !== totalCount) {
      // 还有任务没结束（例如你后面引入异步 render）：保留 processing，等下一次 worker
      continue;
    }

    const spent = succ * costPerVideo;

    const { data: settleRes } = await client.rpc("finalize_batch_credits", {
      p_batch_id: batchId,
      p_user_id: userId,
      p_spent: spent,
    });

    const settlementStatus =
      settleRes?.already === true
        ? "finalized"
        : spent < required
          ? "refunded"
          : "finalized";

    const batchStatus =
      succ === 0 ? "failed" : fail > 0 ? "partial" : "completed";

    await client
      .from("batch_jobs")
      .update({
        status: batchStatus,
        success_count: succ,
        failed_count: fail,
        credits_spent: spent,
        settlement_status: settlementStatus,
        completed_at: nowIso(),
      })
      .eq("id", batchId);

    settledBatches += 1;

    // 2.5 webhook notify（如果 enterprise_api_keys 上有 webhook_url / secret）
    const webhookUrl = batch.webhook_url ?? null;
    const webhookSecret = batch.webhook_secret ?? null;

    // 如果 claim_batch_jobs 返回不带 webhook 字段，我们补查 enterprise key（最稳）
    let finalWebhookUrl = webhookUrl;
    let finalWebhookSecret = webhookSecret;

    if (!finalWebhookUrl) {
      const { data: k } = await client
        .from("enterprise_api_keys")
        .select("webhook_url,webhook_secret")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      finalWebhookUrl = (k as { webhook_url?: string | null })?.webhook_url ?? null;
      finalWebhookSecret =
        (k as { webhook_secret?: string | null })?.webhook_secret ?? null;
    }

    if (finalWebhookUrl) {
      const payload = {
        type: "batch.completed",
        batch_id: batchId,
        status: batchStatus,
        total_count: totalCount,
        success_count: succ,
        failed_count: fail,
        cost_per_video: costPerVideo,
        frozen_credits: required,
        credits_spent: spent,
        settlement_status: settlementStatus,
        ts: Date.now(),
      };
      const r = await postWebhook(finalWebhookUrl, payload, finalWebhookSecret);
      if (r.ok) webhookSent += 1;
    }
  }

  const durationMs = Date.now() - started;

  return NextResponse.json({
    ok: true,
    dispatch: {
      claimed: batches.length,
      frozen: frozenOk,
      processed_tasks: processedTasks,
    },
    settle: { settled_batches: settledBatches, webhook_sent: webhookSent },
    duration_ms: durationMs,
  });
}
