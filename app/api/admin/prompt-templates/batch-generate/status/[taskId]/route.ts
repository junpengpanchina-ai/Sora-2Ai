import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type RouteParams = { params: { taskId: string } }

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const taskId = params.taskId
    if (!taskId) {
      return NextResponse.json({ error: '缺少 taskId' }, { status: 400 })
    }

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('prompt_generation_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404 })
    }

    return NextResponse.json({ success: true, task: data })
  } catch (error) {
    console.error('[prompt-gen status] failed:', error)
    return NextResponse.json(
      { error: '获取任务状态失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

