// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

type UserCreditsRow = Pick<Database['public']['Tables']['users']['Row'], 'credits'>
type RechargeSummaryRow = Pick<Database['public']['Tables']['recharge_records']['Row'], 'amount' | 'status'>
type ConsumptionSummaryRow = Pick<Database['public']['Tables']['consumption_records']['Row'], 'credits' | 'status'>

/**
 * 管理员后台 - 获取统计数据
 * 显示所有用户的汇总数据
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const supabase = await createServiceClient()

    // 获取总用户数
    const { count: totalUsers, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('获取用户数失败:', usersError)
    }

    // 获取所有用户的总积分
    const { data: allUsers, error: creditsError } = await supabase
      .from('users')
      .select('credits')

    let totalCredits = 0
    if (!creditsError && allUsers) {
      const usersWithCredits = allUsers as UserCreditsRow[]
      totalCredits = usersWithCredits.reduce((sum, userRow) => sum + (userRow.credits || 0), 0)
    }

    // 获取所有充值记录
    const { data: allRecharges, error: rechargesError } = await supabase
      .from('recharge_records')
      .select('amount, status')
      .eq('status', 'completed')

    let totalRecharges = 0
    if (!rechargesError && allRecharges) {
      const rechargeRows = allRecharges as RechargeSummaryRow[]
      totalRecharges = rechargeRows.reduce((sum, recharge) => sum + Number(recharge.amount), 0)
    }

    // 获取所有消耗记录
    const { data: allConsumption, error: consumptionError } = await supabase
      .from('consumption_records')
      .select('credits, status')
      .eq('status', 'completed')

    let totalConsumption = 0
    if (!consumptionError && allConsumption) {
      const consumptionRows = allConsumption as ConsumptionSummaryRow[]
      totalConsumption = consumptionRows.reduce((sum, record) => sum + record.credits, 0)
    }

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers || 0,
        total_credits: totalCredits,
        total_recharges: totalRecharges,
        total_consumption: totalConsumption,
      },
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    return NextResponse.json(
      {
        error: '获取统计数据失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

