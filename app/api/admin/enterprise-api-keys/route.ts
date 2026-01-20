import { NextResponse } from "next/server";
import { validateAdminSession } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function GET() {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("enterprise_api_keys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/enterprise-api-keys] list failed", error);
    return NextResponse.json(
      { ok: false, error: "query_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    keys: data ?? [],
  });
}

export async function POST(req: Request) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServiceClient();

  const body = (await req.json()) as {
    userId: string;
    name?: string;
    rateLimitPerMin?: number;
  };

  if (!body?.userId) {
    return NextResponse.json(
      { ok: false, error: "userId_required" },
      { status: 400 },
    );
  }

  const rateLimit = Number.isFinite(body.rateLimitPerMin)
    ? Math.max(1, Math.trunc(body.rateLimitPerMin!))
    : 60;

  // 生成 API Key（高熵随机字符串）
  const apiKey = Buffer.from(crypto.randomUUID() + crypto.randomUUID())
    .toString("base64")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 64);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)(
    "enterprise_api_keys",
  ).insert(
    {
      user_id: body.userId,
      name: body.name ?? null,
      api_key: apiKey,
      rate_limit_per_min: rateLimit,
    },
  ).select("*").single();

  if (error || !data) {
    console.error("[admin/enterprise-api-keys] create failed", error);
    return NextResponse.json(
      { ok: false, error: "create_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    key: data,
  });
}

export async function PATCH(req: Request) {
  const adminUser = await validateAdminSession();
  if (!adminUser) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const supabase = await createServiceClient();
  const body = (await req.json()) as {
    id: string;
    isActive?: boolean;
    rateLimitPerMin?: number;
  };

  if (!body?.id) {
    return NextResponse.json(
      { ok: false, error: "id_required" },
      { status: 400 },
    );
  }

  const update: Record<string, unknown> = {};
  if (typeof body.isActive === "boolean") {
    update.is_active = body.isActive;
  }
  if (Number.isFinite(body.rateLimitPerMin)) {
    update.rate_limit_per_min = Math.max(
      1,
      Math.trunc(body.rateLimitPerMin as number),
    );
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { ok: false, error: "nothing_to_update" },
      { status: 400 },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.from as any)(
    "enterprise_api_keys",
  )
    .update(update)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error || !data) {
    console.error("[admin/enterprise-api-keys] update failed", error);
    return NextResponse.json(
      { ok: false, error: "update_failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    key: data,
  });
}

