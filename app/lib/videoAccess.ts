import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MembershipLevel = "free" | "basic" | "pro";

export type VideoExternalAccessPolicy = {
  allow_share: boolean;
  allow_embed: boolean;
  allow_download: boolean;
  download_requires_membership: MembershipLevel;
  embed_domains: string[];
  expires_at: string | null;
};

export type VideoRecord = Omit<Database["public"]["Tables"]["video_tasks"]["Row"], "status"> & {
  external_access_policy: VideoExternalAccessPolicy;
  status: "draft" | "reviewing" | "approved" | "rejected" | "blocked";
  visibility: "public" | "private" | "unlisted" | "friends_only";
};

export type VideoAccessRequest = {
  videoId: string;
  requester?: {
    userId?: string;
    role?: "user" | "admin" | "reviewer";
    membership?: MembershipLevel;
  };
  action: "play" | "share" | "embed" | "download";
  source: "internal" | "share_link" | "embed";
};

export type VideoAccessDecisionReason =
  | "NOT_FOUND"
  | "NOT_APPROVED"
  | "NO_PERMISSION"
  | "MEMBERSHIP_REQUIRED"
  | "EXPIRED";

export type VideoAccessDecision = {
  allow: boolean;
  reason?: VideoAccessDecisionReason;
  playbackUrl?: string;
  downloadUrl?: string;
  expiresAt?: string;
  policySnapshot?: VideoExternalAccessPolicy;
};

// 简单的会员等级排序，用于比较
const MEMBERSHIP_ORDER: MembershipLevel[] = ["free", "basic", "pro"];

export const MEMBERSHIP_CAPABILITIES: Record<
  MembershipLevel,
  {
    allow_download: boolean;
    allow_embed: boolean;
  }
> = {
  free: {
    allow_download: false,
    allow_embed: false,
  },
  basic: {
    allow_download: true,
    allow_embed: false,
  },
  pro: {
    allow_download: true,
    allow_embed: true,
  },
};

export async function getVideo(videoId: string): Promise<VideoRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("video_tasks")
    .select("*")
    .eq("id", videoId)
    .single();

  if (error || !data) {
    return null;
  }

  const row = data as Database["public"]["Tables"]["video_tasks"]["Row"] & {
    external_access_policy?: unknown;
  };

  // Map video_tasks.status to VideoRecord.status
  // video_tasks uses: 'pending', 'processing', 'succeeded', 'failed'
  // VideoRecord expects: 'draft', 'reviewing', 'approved', 'rejected', 'blocked'
  const statusMap: Record<string, "draft" | "reviewing" | "approved" | "rejected" | "blocked"> = {
    pending: "reviewing",
    processing: "reviewing",
    succeeded: "approved",
    failed: "rejected",
  };

  const policy: VideoExternalAccessPolicy =
    (row.external_access_policy as VideoExternalAccessPolicy) ?? {
      allow_share: true,
      allow_embed: false,
      allow_download: false,
      download_requires_membership: "basic",
      embed_domains: [],
      expires_at: null,
    };

  return {
    ...row,
    status: statusMap[row.status] ?? "reviewing",
    visibility: "public" as const, // Default to public if not stored in video_tasks
    external_access_policy: policy,
  } as VideoRecord;
}

async function generateSignedPlaybackUrl(
  video: VideoRecord,
): Promise<{ url: string; expiresAt: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_video_playback_url", {
    p_video_id: video.id,
  });

  if (error || !data || !data.url || !data.expires_at) {
    throw new Error("FAILED_TO_GENERATE_PLAYBACK_URL");
  }

  return { url: data.url as string, expiresAt: data.expires_at as string };
}

async function generateSignedDownloadUrl(
  video: VideoRecord,
): Promise<{ url: string; expiresAt: string }> {
  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("get_video_download_url", {
    p_video_id: video.id,
  });

  if (error || !data || !data.url || !data.expires_at) {
    throw new Error("FAILED_TO_GENERATE_DOWNLOAD_URL");
  }

  return { url: data.url as string, expiresAt: data.expires_at as string };
}

export async function decideVideoAccess(
  req: VideoAccessRequest,
): Promise<VideoAccessDecision> {
  const video = await getVideo(req.videoId);
  if (!video) return { allow: false, reason: "NOT_FOUND" };

  if (video.status !== "approved") {
    return { allow: false, reason: "NOT_APPROVED" };
  }

  const policy = video.external_access_policy;

  // 过期策略
  if (policy.expires_at) {
    const now = Date.now();
    const expires = Date.parse(policy.expires_at);
    if (Number.isFinite(expires) && now > expires) {
      return { allow: false, reason: "EXPIRED", policySnapshot: policy };
    }
  }

  // 下载能力：无水印文件，但必须满足策略 + 会员等级
  if (req.action === "download") {
    if (!policy.allow_download) {
      return { allow: false, reason: "NO_PERMISSION", policySnapshot: policy };
    }

    const level = req.requester?.membership ?? "free";
    if (
      MEMBERSHIP_ORDER.indexOf(level) <
      MEMBERSHIP_ORDER.indexOf(policy.download_requires_membership)
    ) {
      return {
        allow: false,
        reason: "MEMBERSHIP_REQUIRED",
        policySnapshot: policy,
      };
    }

    if (!MEMBERSHIP_CAPABILITIES[level]?.allow_download) {
      return { allow: false, reason: "NO_PERMISSION", policySnapshot: policy };
    }

    const { url, expiresAt } = await generateSignedDownloadUrl(video);
    return { allow: true, downloadUrl: url, expiresAt, policySnapshot: policy };
  }

  // 嵌入能力：需策略允许，且可在实际实现中校验 embed_domains
  if (req.action === "embed" && !policy.allow_embed) {
    return { allow: false, reason: "NO_PERMISSION", policySnapshot: policy };
  }

  // 播放/分享：这里只做“能不能看”的决策，水印与否由前端/播放器配置决定
  const { url, expiresAt } = await generateSignedPlaybackUrl(video);
  return { allow: true, playbackUrl: url, expiresAt, policySnapshot: policy };
}

