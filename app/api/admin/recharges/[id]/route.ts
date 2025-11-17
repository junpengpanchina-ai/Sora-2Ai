import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/admin-auth'

type RechargeRow = Database['public']['Tables']['recharge_records']['Row']
type RechargeUpdate = Database['public']['Tables']['recharge_records']['Update']

const ALLOWED_STATUS: RechargeRow['status'][] = [
  'pending',
  'completed',
  'failed',
  'cancelled',
  'refunded',
]

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const rechargeId = params.id
    if (!rechargeId) {
      return NextResponse.json({ error: '缺少充值记录ID' }, { status: 400 })
    }

    const payload = (await request.json()) as {
      status?: RechargeRow['status']
      adminNotes?: string | null
    }

    if (!payload.status && payload.adminNotes === undefined) {
      return NextResponse.json({ error: '未提供任何更新字段' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: rechargeRecord, error: fetchError } = await supabase
      .from('recharge_records')
      .select('*')
      .eq('id', rechargeId)
      .single()

    if (fetchError || !rechargeRecord) {
      return NextResponse.json({ error: '充值记录不存在' }, { status: 404 })
    }

    const updates: RechargeUpdate = {}
    let adjustmentDelta = 0
    let adjustmentType: Database['public']['Tables']['credit_adjustments']['Row']['adjustment_type'] | null = null

    if (payload.status) {
      if (!ALLOWED_STATUS.includes(payload.status)) {
        return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
      }

      if (payload.status === 'completed' && rechargeRecord.status !== 'completed') {
        adjustmentDelta = rechargeRecord.credits
        adjustmentType = 'recharge_correction'
        updates.status = 'completed'
        updates.completed_at = rechargeRecord.completed_at ?? new Date().toISOString()
      } else if (payload.status === 'refunded' && rechargeRecord.status !== 'refunded') {
        adjustmentDelta = -Math.abs(rechargeRecord.credits)
        adjustmentType = 'recharge_refund'
        updates.status = 'refunded'
      } else {
        updates.status = payload.status
        if (payload.status !== 'completed') {
          updates.completed_at = null
        }
      }
    }

    if (payload.adminNotes !== undefined) {
      updates.admin_notes = payload.adminNotes ?? null
    }

    let adjustment = null
    if (adjustmentDelta !== 0 && adjustmentType) {
      const { data: adjustmentResult, error: adjustmentError } = await supabase.rpc(
        'admin_adjust_user_credits',
        {
          p_admin_user_id: adminUser.id,
          p_user_id: rechargeRecord.user_id,
          p_delta: adjustmentDelta,
          p_reason:
            payload.adminNotes ??
            (adjustmentDelta > 0 ? '手动补发充值积分' : '手动退款扣除积分'),
          p_adjustment_type: adjustmentType,
          p_related_recharge_id: rechargeRecord.id,
          p_related_consumption_id: null,
        }
      )

      if (adjustmentError) {
        console.error('更新积分失败:', adjustmentError)
        return NextResponse.json(
          { error: '积分调整失败', details: adjustmentError.message },
          { status: 400 }
        )
      }

      adjustment = adjustmentResult
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({
        success: true,
        recharge: rechargeRecord,
        adjustment,
      })
    }

    const { data: updated, error: updateError } = await supabase
      .from('recharge_records')
      .update(updates)
      .eq('id', rechargeId)
      .select('*')
      .single()

    if (updateError) {
      console.error('更新充值记录失败:', updateError)
      return NextResponse.json(
        { error: '更新充值记录失败', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      recharge: updated,
      adjustment,
    })
  } catch (error) {
    console.error('更新充值记录失败:', error)
    return NextResponse.json(
      {
        error: '更新充值记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


