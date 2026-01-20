import { NextResponse } from "next/server";
import {
  decideVideoAccess,
  type MembershipLevel,
} from "@/app/lib/videoAccess";
import { logVideoExternalAccess } from "@/app/lib/videoAudit";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function getMembershipLevel(userId: string | null): Promise<MembershipLevel> {
  if (!userId) return "free";
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
    console.error("[videos/:id/embed] getMembershipLevel failed", e);
    return "free";
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const referer = req.headers.get("referer") ?? "";
    const host = referer ? new URL(referer).hostname : null;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const membership = await getMembershipLevel(user?.id ?? null);

    const decision = await decideVideoAccess({
      videoId: params.id,
      requester: user
        ? {
            userId: user.id,
            membership,
          }
        : undefined,
      action: "embed",
      source: "embed",
    });

    if (!decision.allow || !decision.playbackUrl) {
      return NextResponse.json(
        { ok: false, reason: decision.reason ?? "NO_PERMISSION" },
        { status: 403 },
      );
    }

    await logVideoExternalAccess({
      video_id: params.id,
      user_id: user?.id ?? undefined,
      action: "embed",
      source: "embed",
      policy_snapshot: {
        ...(decision.policySnapshot ?? null),
        referer_host: host,
      },
    });

    return NextResponse.json({
      ok: true,
      embedUrl: decision.playbackUrl,
      expiresAt: decision.expiresAt,
    });
  } catch (error) {
    console.error("[videos/:id/embed] unexpected error", error);
    return NextResponse.json(
      { ok: false, reason: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

