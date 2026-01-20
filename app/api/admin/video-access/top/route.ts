import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "download";
  const limit = Number(url.searchParams.get("limit") ?? "20");

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.rpc as any)("video_access_top_videos", {
    p_action: type,
    p_limit: limit,
  });

  if (error) {
    console.error("[admin/video-access/top] rpc failed", error);
    return NextResponse.json(
      { ok: false, error: "query_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    items: data ?? [],
  });
}

