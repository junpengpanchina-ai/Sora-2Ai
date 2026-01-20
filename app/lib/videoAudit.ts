import { createServiceClient } from "@/lib/supabase/service";

type VideoExternalAccessLogInput = {
  video_id: string;
  user_id?: string;
  action: "play" | "share" | "embed" | "download";
  source: "internal" | "share_link" | "embed";
  policy_snapshot: unknown;
};

export async function logVideoExternalAccess(
  input: VideoExternalAccessLogInput,
): Promise<void> {
  const supabase = await createServiceClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from as any)("video_external_access_log").insert({
    video_id: input.video_id,
    user_id: input.user_id ?? null,
    action: input.action,
    source: input.source,
    policy_snapshot: input.policy_snapshot,
  });

  if (error) {
    // 日志写入失败不影响主流程，只做告警
    console.error("[video_external_access_log] insert failed", {
      error: error.message,
      video_id: input.video_id,
      action: input.action,
      source: input.source,
    });
  }
}

