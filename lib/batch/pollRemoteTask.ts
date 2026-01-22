/**
 * 轮询远程任务状态（精准版）
 * 从 app/api/internal/batch-worker/route.ts 提取，供复用
 */

import { getTaskResult } from "@/lib/grsai/client";

export type PollResult =
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

export async function pollRemoteTask(grsaiTaskId: string): Promise<PollResult> {
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
