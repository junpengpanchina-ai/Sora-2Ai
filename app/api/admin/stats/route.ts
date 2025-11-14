import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 管理员后台 - 获取统计数据
 * 显示所有用户的汇总数据
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // 验证用户身份（简单验证，生产环境可以添加更严格的权限控制）
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

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
      totalCredits = allUsers.reduce((sum, u) => sum + (u.credits || 0), 0)
    }

    // 获取所有充值记录
    const { data: allRecharges, error: rechargesError } = await supabase
      .from('recharge_records')
      .select('amount, status')
      .eq('status', 'completed')

    let totalRecharges = 0
    if (!rechargesError && allRecharges) {
      totalRecharges = allRecharges.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0)
    }

    // 获取所有消耗记录
    const { data: allConsumption, error: consumptionError } = await supabase
      .from('consumption_records')
      .select('credits, status')
      .eq('status', 'completed')

    let totalConsumption = 0
    if (!consumptionError && allConsumption) {
      totalConsumption = allConsumption.reduce((sum, c) => sum + c.credits, 0)
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

