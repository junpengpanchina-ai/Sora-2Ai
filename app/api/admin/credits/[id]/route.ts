import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

type CreditAdjustmentRow = Database['public']['Tables']['credit_adjustments']['Row']
type CreditAdjustmentUpdate = Database['public']['Tables']['credit_adjustments']['Update']

const ADJUSTMENT_TYPES: CreditAdjustmentRow['adjustment_type'][] = [
  'manual_increase',
  'manual_decrease',
  'recharge_correction',
  'recharge_refund',
  'consumption_refund',
  'other',
]

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const adjustmentId = params.id
    if (!adjustmentId) {
      return NextResponse.json({ error: '缺少积分调整记录ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const payload = (await request.json()) as {
      reason?: string | null
      adjustment_type?: CreditAdjustmentRow['adjustment_type']
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const updates: CreditAdjustmentUpdate = {}

    if (payload.reason !== undefined) {
      updates.reason = payload.reason ?? null
    }

    if (payload.adjustment_type !== undefined) {
      if (!ADJUSTMENT_TYPES.includes(payload.adjustment_type)) {
        return NextResponse.json({ error: '无效的调整类型' }, { status: 400 })
      }
      updates.adjustment_type = payload.adjustment_type
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '未提供有效的更新内容' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase as any)
      .from('credit_adjustments')
      .update(updates as CreditAdjustmentUpdate)
      .eq('id', adjustmentId)
      .select('*')
      .single()

    if (error) {
      console.error('更新积分调整记录失败:', error)
      return NextResponse.json(
        { error: '更新积分调整记录失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      adjustment: updated,
    })
  } catch (error) {
    console.error('更新积分调整记录失败:', error)
    return NextResponse.json(
      {
        error: '更新积分调整记录失败',
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
    const adjustmentId = params.id
    if (!adjustmentId) {
      return NextResponse.json({ error: '缺少积分调整记录ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    
    // 先检查记录是否存在
    const { data: adjustment, error: fetchError } = await supabase
      .from('credit_adjustments')
      .select('*')
      .eq('id', adjustmentId)
      .single<CreditAdjustmentRow>()

    if (fetchError || !adjustment) {
      return NextResponse.json({ error: '积分调整记录不存在' }, { status: 404 })
    }

    // 注意：删除积分调整记录不会自动恢复用户的积分
    // 如果需要恢复，应该先手动调整用户积分，再删除记录

    // 删除积分调整记录
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('credit_adjustments')
      .delete()
      .eq('id', adjustmentId)

    if (deleteError) {
      console.error('删除积分调整记录失败:', deleteError)
      return NextResponse.json(
        { error: '删除积分调整记录失败', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '积分调整记录已删除',
    })
  } catch (error) {
    console.error('删除积分调整记录失败:', error)
    return NextResponse.json(
      {
        error: '删除积分调整记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

