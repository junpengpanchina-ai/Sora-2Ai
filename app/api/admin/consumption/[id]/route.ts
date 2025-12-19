import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ConsumptionRow = Database['public']['Tables']['consumption_records']['Row']
type ConsumptionUpdate = Database['public']['Tables']['consumption_records']['Update']

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const consumptionId = params.id
    if (!consumptionId) {
      return NextResponse.json({ error: '缺少消耗记录ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const payload = (await request.json()) as {
      description?: string | null
      status?: ConsumptionRow['status']
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const updates: ConsumptionUpdate = {}

    if (payload.description !== undefined) {
      updates.description = payload.description ?? null
    }

    if (payload.status !== undefined) {
      if (!['completed', 'refunded'].includes(payload.status)) {
        return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
      }
      updates.status = payload.status
      if (payload.status === 'refunded') {
        updates.refunded_at = new Date().toISOString()
      } else if (payload.status === 'completed') {
        updates.refunded_at = null
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '未提供有效的更新内容' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('consumption_records')
      .update(updates as ConsumptionUpdate)
      .eq('id', consumptionId)
      .select('*')
      .single()

    if (error) {
      console.error('更新消耗记录失败:', error)
      return NextResponse.json(
        { error: '更新消耗记录失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consumption: updated,
    })
  } catch (error) {
    console.error('更新消耗记录失败:', error)
    return NextResponse.json(
      {
        error: '更新消耗记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const consumptionId = params.id
    if (!consumptionId) {
      return NextResponse.json({ error: '缺少消耗记录ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    
    // 先检查记录是否存在
    const { data: record, error: fetchError } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('id', consumptionId)
      .single<ConsumptionRow>()

    if (fetchError || !record) {
      return NextResponse.json({ error: '消耗记录不存在' }, { status: 404 })
    }

    // 删除消耗记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('consumption_records')
      .delete()
      .eq('id', consumptionId)

    if (deleteError) {
      console.error('删除消耗记录失败:', deleteError)
      return NextResponse.json(
        { error: '删除消耗记录失败', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '消耗记录已删除',
    })
  } catch (error) {
    console.error('删除消耗记录失败:', error)
    return NextResponse.json(
      {
        error: '删除消耗记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

