import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ConsumptionRow = Database['public']['Tables']['consumption_records']['Row']
type ConsumptionUpdate = Database['public']['Tables']['consumption_records']['Update']
type AdminAdjustArgs = Database['public']['Functions']['admin_adjust_user_credits']['Args']
type AdminAdjustReturn = Database['public']['Functions']['admin_adjust_user_credits']['Returns']

type RouteParams = {
  params: {
    id: string
  }
}

export async function POST(
  request: Request,
  { params }: RouteParams
) {
  try {
    const consumptionId = params.id
    if (!consumptionId) {
      return NextResponse.json({ error: '缺少消费记录ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { data: record, error: fetchError } = await supabase
      .from('consumption_records')
      .select('*')
      .eq('id', consumptionId)
    .single<ConsumptionRow>()

    if (fetchError || !record) {
      return NextResponse.json({ error: '消费记录不存在' }, { status: 404 })
    }

    if (record.status === 'refunded') {
      return NextResponse.json({ error: '该消费记录已退款' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawAdjustment, error: adjustmentError } = await (supabase as any).rpc(
      'admin_adjust_user_credits',
      {
        p_admin_user_id: adminUser.id,
        p_user_id: record.user_id,
        p_delta: Math.abs(record.credits),
        p_reason: '管理员手动退款消费积分',
        p_adjustment_type: 'consumption_refund',
        p_related_recharge_id: null,
        p_related_consumption_id: record.id,
      } as AdminAdjustArgs
    )

    if (adjustmentError) {
      console.error('返还积分失败:', adjustmentError)
      return NextResponse.json(
        { error: '返还积分失败', details: adjustmentError.message },
        { status: 400 }
      )
    }

    const adjustment = rawAdjustment as AdminAdjustReturn | null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase as any)
      .from('consumption_records')
      .update({
        status: 'refunded',
        refunded_at: new Date().toISOString(),
      } as ConsumptionUpdate)
      .eq('id', consumptionId)
      .select('*')
      .single()

    if (updateError) {
      console.error('更新消费记录状态失败:', updateError)
      return NextResponse.json(
        { error: '更新消费记录失败', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consumption: updated as ConsumptionRow,
      adjustment,
    })
  } catch (error) {
    console.error('消费记录退款失败:', error)
    return NextResponse.json(
      {
        error: '消费记录退款失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


