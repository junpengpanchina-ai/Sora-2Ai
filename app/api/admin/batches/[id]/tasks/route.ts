import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { validateAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await validateAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const batchId = params.id;
  if (!batchId) {
    return NextResponse.json({ ok: false, error: "MISSING_BATCH_ID" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client: any = supabase;

  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 50);
  const offset = (page - 1) * limit;

  // Tasks 列表（分页）
  const { data: tasks, error: tasksError } = await client
    .from("video_tasks")
    .select(
      "id,batch_job_id,batch_index,status,model,prompt,reference_url,aspect_ratio,duration,grsai_task_id,video_url,error_message,failure_type,poll_count,created_at,updated_at",
    )
    .eq("batch_job_id", batchId)
    .order("batch_index", { ascending: true })
    .range(offset, offset + limit - 1);

  if (tasksError) {
    return NextResponse.json(
      { ok: false, error: "TASKS_FETCH_FAILED", details: String(tasksError) },
      { status: 500 },
    );
  }

  // 总数
  const { count } = await client
    .from("video_tasks")
    .select("id", { count: "exact", head: true })
    .eq("batch_job_id", batchId);

  return NextResponse.json({
    ok: true,
    tasks: tasks ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
