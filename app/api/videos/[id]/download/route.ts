import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  decideVideoAccess,
  type MembershipLevel,
} from "@/app/lib/videoAccess";
import { logVideoExternalAccess } from "@/app/lib/videoAudit";

export const dynamic = "force-dynamic";

type DownloadStats = {
  videoToday: number;
  userToday: number;
};

const DOWNLOAD_LIMITS: Record<
  MembershipLevel,
  { per_video_per_day: number; per_user_per_day: number }
> = {
  free: {
    per_video_per_day: 0,
    per_user_per_day: 0,
  },
  basic: {
    per_video_per_day: 5,
    per_user_per_day: 20,
  },
  pro: {
    per_video_per_day: 50,
    per_user_per_day: 200,
  },
};

async function getMembershipLevel(userId: string): Promise<MembershipLevel> {
  try {
    const { getUserEntitlements } = await import(
      "@/lib/billing/get-user-entitlements"
    );
    const entitlements = await getUserEntitlements(userId);
    if (!entitlements) return "free";
    if (entitlements.planId === "studio" || entitlements.planId === "pro") {
      return "pro";
    }
    if (entitlements.planId === "starter" || entitlements.planId === "creator") {
      return "basic";
    }
    return "free";
  } catch (e) {
    console.error("[videos/:id/download] getMembershipLevel failed", e);
    return "free";
  }
}

async function getDownloadStats(
  userId: string,
  videoId: string,
): Promise<DownloadStats> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)(
    "video_download_stats_today",
    { p_user_id: userId, p_video_id: videoId },
  );

  if (error || !data) {
    console.error("[videos/:id/download] video_download_stats_today failed", error);
    return { videoToday: 0, userToday: 0 };
  }

  return {
    videoToday: (data.video_today as number) ?? 0,
    userToday: (data.user_today as number) ?? 0,
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { ok: false, reason: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const membership = await getMembershipLevel(user.id);
    const limits = DOWNLOAD_LIMITS[membership];

    if (limits.per_user_per_day === 0) {
      return NextResponse.json(
        {
          ok: false,
          reason: "DOWNLOAD_LIMIT_REACHED",
          message:
            "Your current plan does not support direct downloads. Please upgrade to unlock downloads.",
        },
        { status: 403 },
      );
    }

    const stats = await getDownloadStats(user.id, params.id);

    if (stats.videoToday >= limits.per_video_per_day) {
      return NextResponse.json(
        {
          ok: false,
          reason: "DOWNLOAD_LIMIT_REACHED",
          message:
            "This video has reached its download limit for today. Try again tomorrow or upgrade your plan.",
        },
        { status: 429 },
      );
    }

    if (stats.userToday >= limits.per_user_per_day) {
      return NextResponse.json(
        {
          ok: false,
          reason: "DOWNLOAD_LIMIT_REACHED",
          message:
            "You have reached your total download limit for today. Try again tomorrow or upgrade your plan.",
        },
        { status: 429 },
      );
    }

    const decision = await decideVideoAccess({
      videoId: params.id,
      requester: {
        userId: user.id,
        membership,
      },
      action: "download",
      source: "internal",
    });

    if (!decision.allow || !decision.downloadUrl) {
      return NextResponse.json(
        { ok: false, reason: decision.reason ?? "NO_PERMISSION" },
        { status: 403 },
      );
    }

    await logVideoExternalAccess({
      video_id: params.id,
      user_id: user.id,
      action: "download",
      source: "internal",
      policy_snapshot: decision.policySnapshot ?? null,
    });

    return NextResponse.json({
      ok: true,
      downloadUrl: decision.downloadUrl,
      expiresAt: decision.expiresAt,
    });
  } catch (error) {
    console.error("[videos/:id/download] unexpected error", error);
    return NextResponse.json(
      { ok: false, reason: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

