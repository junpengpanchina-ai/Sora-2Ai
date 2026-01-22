import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTaskResult } from "@/lib/grsai/client";

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

function pickBaseUrl(): string | null {
  // 你说"baseUrl 不存在就轮询"，这里按常见优先级取
  const site =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);

  return site ? site.replace(/\/+$/, "") : null;
}

// ---- grsai client 动态兼容（防止方法名略有差异导致 build 挂） ----
async function grsai() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mod: any = await import("@/lib/grsai/client");
  return mod;
}

type TaskRow = {
  id: string;
  batch_job_id: string;
  batch_index: number;

  status: "pending" | "processing" | "succeeded" | "failed" | string;
  prompt: string | null;
  model: string | null;
  meta: unknown | null;

  reference_url: string | null;
  aspect_ratio: string | null;
  duration: number | null;

  grsai_task_id: string | null;
  video_url: string | null;
  error_message: string | null;
};

function isSora(model: string | null) {
  const m = (model || "").toLowerCase();
  return m.includes("sora");
}
function isVeo(model: string | null) {
  const m = (model || "").toLowerCase();
  return m.includes("veo");
}

function normalizeAspectRatio(x: string | null) {
  // 你已有格式：9:16 / 16:9；如果为空就不给
  if (!x) return null;
  if (x === "9:16" || x === "16:9" || x === "1:1") return x;
  return x;
}

// 从 reference_url 里提取 url 参数（你说 Sora-2 用这个）
function extractUrlParam(referenceUrl: string | null): string | null {
  if (!referenceUrl) return null;
  try {
    const u = new URL(referenceUrl);
    const p = u.searchParams.get("url");
    return p ? p : referenceUrl; // 没有 url 参数就当本身是 url
  } catch {
    return referenceUrl;
  }
}

async function createRemoteTask(task: TaskRow, baseUrl: string | null) {
  const mod = await grsai();

  // webhook：有 baseUrl 才启用，否则你要求 webHook = "-1"（轮询）
  const webhookUrl = baseUrl
    ? `${baseUrl}/api/video/callback?task_id=${encodeURIComponent(task.id)}`
    : "-1";

  const model = task.model || ((task.meta as { model?: string })?.model as string) || "sora-2";
  const aspectRatio = normalizeAspectRatio(task.aspect_ratio);
  const prompt = task.prompt || "";

  if (isSora(model)) {
    const reference = extractUrlParam(task.reference_url);
    const duration = task.duration === 15 ? 15 : 10; // 固定 10/15
    // 你要求：固定 size: "small"
    const createSoraVideoTask = mod.createSoraVideoTask as ((params: unknown) => Promise<unknown>) | undefined;
    if (!createSoraVideoTask) {
      return { ok: false, error: "MISSING_createSoraVideoTask" };
    }

    const res = await createSoraVideoTask({
      prompt,
      model: "sora-2",
      size: "small",
      duration,
      aspectRatio: aspectRatio ?? undefined,
      // reference：按你描述从 url 参数提取
      ...(reference ? { url: reference } : {}),
      // webhook：baseUrl 不存在则 "-1"
      webHook: webhookUrl,
      shutProgress: false,
      // 你已有 meta 里可能还有别的字段，不强行覆盖
    });

    const taskId =
      (res as { task_id?: string; id?: string; data?: { task_id?: string; id?: string } })?.task_id ||
      (res as { id?: string })?.id ||
      (res as { data?: { task_id?: string; id?: string } })?.data?.task_id ||
      (res as { data?: { id?: string } })?.data?.id ||
      null;

    if (!taskId) return { ok: false, error: "SORA_CREATE_NO_TASK_ID" };
    return { ok: true, grsai_task_id: String(taskId) };
  }

  if (isVeo(model)) {
    const createVeoVideoTask = mod.createVeoVideoTask as ((params: unknown) => Promise<unknown>) | undefined;
    if (!createVeoVideoTask) {
      return { ok: false, error: "MISSING_createVeoVideoTask" };
    }

    const meta = (task.meta || {}) as {
      firstFrameUrl?: string;
      lastFrameUrl?: string;
      urls?: string[];
      [key: string]: unknown;
    };
    // veo：firstFrameUrl/lastFrameUrl/urls
    const firstFrameUrl = meta.firstFrameUrl || null;
    const lastFrameUrl = meta.lastFrameUrl || null;
    const urls: string[] =
      Array.isArray(meta.urls) && meta.urls.length
        ? meta.urls
        : task.reference_url
          ? [task.reference_url]
          : [];

    const apiModelName = model === "veo-flash" ? "veo3.1-fast" : "veo3.1-pro";
    const res = await createVeoVideoTask({
      prompt,
      model: apiModelName,
      aspectRatio: aspectRatio ?? undefined,
      ...(firstFrameUrl ? { firstFrameUrl } : {}),
      ...(lastFrameUrl ? { lastFrameUrl } : {}),
      ...(urls.length ? { urls } : {}),
      webHook: webhookUrl,
      shutProgress: false,
    });

    const taskId =
      (res as { task_id?: string; id?: string; data?: { task_id?: string; id?: string } })?.task_id ||
      (res as { id?: string })?.id ||
      (res as { data?: { task_id?: string; id?: string } })?.data?.task_id ||
      (res as { data?: { id?: string } })?.data?.id ||
      null;

    if (!taskId) return { ok: false, error: "VEO_CREATE_NO_TASK_ID" };
    return { ok: true, grsai_task_id: String(taskId) };
  }

  // 默认按 sora 兜底（防止 model 为空）
  return { ok: false, error: `UNKNOWN_MODEL:${model}` };
}

// 轮询：精准版，直接使用 getTaskResult，严格按 GrsaiResultResponse 结构解包
type PollResult =
  | {
      ok: true;
      status: "processing" | "succeeded" | "failed";
      progress?: number;
      video_url?: string | null;
      error_message?: string | null;
    }
  | {
      ok: false;
      error: string;
    };

async function pollRemoteTask(grsaiTaskId: string): Promise<PollResult> {
  try {
    const res = await getTaskResult(grsaiTaskId);

    if (!res || typeof res.code !== "number") {
      return { ok: false, error: "INVALID_RESPONSE" };
    }

    // Grsai 业务错误（code != 0）
    if (res.code !== 0) {
      return {
        ok: true,
        status: "failed",
        error_message: res.msg || "REMOTE_ERROR",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = res.data as any;
    const status = data?.status;
    const progress = data?.progress ?? null;

    // ========= 成功 =========
    if (status === "succeeded" || status === "success") {
      // Sora: results[0].url
      if (Array.isArray(data.results) && data.results[0]?.url) {
        return {
          ok: true,
          status: "succeeded",
          progress,
          video_url: data.results[0].url,
        };
      }

      // Veo: data.url
      if (data.url) {
        return {
          ok: true,
          status: "succeeded",
          progress,
          video_url: data.url,
        };
      }

      // 理论不该发生：成功但无 url
      return {
        ok: true,
        status: "failed",
        error_message: "SUCCEEDED_WITHOUT_VIDEO_URL",
      };
    }

    // ========= 失败 =========
    if (status === "failed" || status === "error") {
      return {
        ok: true,
        status: "failed",
        error_message:
          data.failure_reason || data.error || "REMOTE_TASK_FAILED",
      };
    }

    // ========= 进行中 =========
    return {
      ok: true,
      status: "processing",
      progress,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      error: (err as { message?: string })?.message || "POLL_EXCEPTION",
    };
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

  const baseUrl = pickBaseUrl();

  // 1) claim queued -> processing（你已有 rpc）
  const { data: claimed, error: claimErr } = await client.rpc("claim_batch_jobs", {
    p_limit: CLAIM_LIMIT,
  });

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const batches: any[] = Array.isArray(claimed) ? claimed : [];

  let frozenOk = 0;
  let createdRemote = 0;
  let polled = 0;
  let settled = 0;

  for (const b of batches) {
    const batchId = String(b.id);
    const userId = String(b.user_id);
    const totalCount = Number(b.total_count ?? 0);
    const costPerVideo = Number(b.cost_per_video ?? 10);
    const required = totalCount * costPerVideo;

    // 2) freeze upfront（等价冻结）
    const { data: freezeRes, error: freezeErr } = await client.rpc(
      "freeze_credits_for_batch",
      { p_batch_id: batchId, p_user_id: userId, p_amount: required },
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

    // 3) load tasks
    const { data: tasks, error: taskErr } = await client
      .from("video_tasks")
      .select(
        "id,batch_job_id,batch_index,status,prompt,model,meta,reference_url,aspect_ratio,duration,grsai_task_id,video_url,error_message",
      )
      .eq("batch_job_id", batchId)
      .order("batch_index", { ascending: true });

    if (taskErr) {
      // 查不了任务，直接结算全退（spent=0）
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
      settled += 1;
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskList: TaskRow[] = (tasks || []) as any;

    // 4) A) 先把 pending 且没有 grsai_task_id 的任务发起创建（并发）
    const toCreate = taskList.filter(
      (t) => (t.status === "pending" || t.status === "queued") && !t.grsai_task_id,
    );

    let idx = 0;
    async function creator() {
      while (idx < toCreate.length) {
        const t = toCreate[idx++];

        // 乐观置 processing（你字段支持）
        await client
          .from("video_tasks")
          .update({ status: "processing", updated_at: nowIso() })
          .eq("id", t.id);

        const r = await createRemoteTask(t, baseUrl);

        if (r.ok) {
          await client
            .from("video_tasks")
            .update({
              grsai_task_id: r.grsai_task_id,
              // 继续 processing，等待 webhook/轮询把它改成 succeeded/failed
              status: "processing",
              error_message: null,
              updated_at: nowIso(),
            })
            .eq("id", t.id);
          createdRemote += 1;
        } else {
          await client
            .from("video_tasks")
            .update({
              status: "failed",
              error_message: String(r.error ?? "CREATE_TASK_FAILED").slice(0, 800),
              updated_at: nowIso(),
            })
            .eq("id", t.id);
        }
      }
    }

    await Promise.all(
      Array.from({ length: Math.max(1, TASK_CONCURRENCY) }, () => creator()),
    );

    // 5) B) 如果没有 baseUrl（webHook=-1），就对 processing 且有 grsai_task_id 的任务轮询一次
    if (!baseUrl) {
      const toPoll = taskList.filter(
        (t) => t.status === "processing" && !!t.grsai_task_id,
      );
      for (const t of toPoll) {
        const result = await pollRemoteTask(String(t.grsai_task_id));
        polled += 1;

        // 网络/异常，不动任务，留给下次轮询
        if (!result.ok) {
          continue;
        }

        // 进行中，不更新 status，只记录 progress（可选）
        if (result.status === "processing") {
          // 可选：更新 progress 字段（如果你表有）
          // await client.from("video_tasks").update({ progress: result.progress ?? 0 }).eq("id", t.id);
          continue;
        }

        // 成功，更新 video_url 和 status
        if (result.status === "succeeded") {
          await client
            .from("video_tasks")
            .update({
              status: "succeeded",
              video_url: result.video_url ?? null,
              error_message: null,
              updated_at: nowIso(),
            })
            .eq("id", t.id);
          continue;
        }

        // 失败，更新 error_message 和 status
        if (result.status === "failed") {
          await client
            .from("video_tasks")
            .update({
              status: "failed",
              error_message: String(result.error_message ?? "REMOTE_FAILED").slice(0, 800),
              updated_at: nowIso(),
            })
            .eq("id", t.id);
          continue;
        }
      }
    }

    // 6) settle：只有当全部任务都进入 succeeded/failed 才结算退款
    const { data: finalTasks, error: finalErr } = await client
      .from("video_tasks")
      .select("status")
      .eq("batch_job_id", batchId);

    if (finalErr) continue;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finals: any[] = Array.isArray(finalTasks) ? finalTasks : [];
    const succ = finals.filter((x) => String(x.status) === "succeeded").length;
    const fail = finals.filter((x) => String(x.status) === "failed").length;

    if (succ + fail !== totalCount) {
      // 还有 processing/pending，留给下一轮 worker
      continue;
    }

    const spent = succ * costPerVideo;

    await client.rpc("finalize_batch_credits", {
      p_batch_id: batchId,
      p_user_id: userId,
      p_spent: spent,
    });

    const batchStatus = succ === 0 ? "failed" : fail > 0 ? "partial" : "completed";
    const settlementStatus = spent < required ? "refunded" : "finalized";

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

    settled += 1;
  }

  return NextResponse.json({
    ok: true,
    dispatch: {
      claimed: batches.length,
      frozen: frozenOk,
      created_remote: createdRemote,
      polled,
    },
    settle: { settled_batches: settled },
    duration_ms: Date.now() - started,
    base_url_mode: baseUrl ? "webhook" : "polling",
  });
}
