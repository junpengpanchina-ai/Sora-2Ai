import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type CreditAdjustmentRow = Database['public']['Tables']['credit_adjustments']['Row']

const ADJUSTMENT_TYPES: CreditAdjustmentRow['adjustment_type'][] = [
  'manual_increase',
  'manual_decrease',
  'recharge_correction',
  'recharge_refund',
  'consumption_refund',
  'other',
]

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200)
    const userIdFilter = searchParams.get('userId')

    let query = supabase
      .from('credit_adjustments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userIdFilter) {
      query = query.eq('user_id', userIdFilter)
    }

    const { data: adjustments, error } = await query

    if (error) {
      console.error('获取积分调整记录失败:', error)
      return NextResponse.json(
        { error: '获取积分调整记录失败', details: error.message },
        { status: 500 }
      )
    }

    const rows = (adjustments ?? []) as CreditAdjustmentRow[]
    const userIds = new Set<string>()
    rows.forEach((row) => {
      userIds.add(row.user_id)
      if (row.admin_user_id) {
        userIds.add(row.admin_user_id)
      }
    })

    // Get user info and wallet balances
    const usersResult = userIds.size
      ? await supabase
          .from('users')
          .select('id, email, name')
          .in('id', Array.from(userIds))
      : { data: null, error: null }

    if (usersResult.error) {
      console.error('获取用户信息失败:', usersResult.error)
    }

    // Get wallet balances (using credit_wallet table)
    const walletsResult = userIds.size
      ? await supabase
          .from('credit_wallet')
          .select('user_id, permanent_credits, bonus_credits, bonus_expires_at')
          .in('user_id', Array.from(userIds))
      : { data: null, error: null }

    if (walletsResult.error) {
      console.error('获取钱包信息失败:', walletsResult.error)
    }

    const users = usersResult.data as Array<{ id: string; email: string; name: string | null }> | null
    const wallets = walletsResult.data as Array<{
      user_id: string;
      permanent_credits: number;
      bonus_credits: number;
      bonus_expires_at: string | null;
    }> | null

    const userMap = new Map<string, { id: string; email: string; name: string | null }>()
    if (users) {
      users.forEach((u) => {
        userMap.set(u.id, u)
      })
    }

    const walletMap = new Map<string, { permanent: number; bonus: number; total: number }>()
    if (wallets) {
      wallets.forEach((w) => {
        const permanent = Number(w.permanent_credits) || 0
        const bonus = Number(w.bonus_credits) || 0
        walletMap.set(w.user_id, {
          permanent,
          bonus,
          total: permanent + bonus,
        })
      })
    }

    const formatted = rows.map((row) => {
      const user = userMap.get(row.user_id)
      const wallet = walletMap.get(row.user_id)
      return {
        ...row,
        user_email: user?.email ?? null,
        user_name: user?.name ?? null,
        admin_email: row.admin_user_id ? userMap.get(row.admin_user_id)?.email ?? null : null,
        admin_name: row.admin_user_id ? userMap.get(row.admin_user_id)?.name ?? null : null,
        latest_credits: wallet?.total ?? row.after_credits ?? null, // Use wallet total, fallback to adjustment record
        wallet_permanent: wallet?.permanent ?? null,
        wallet_bonus: wallet?.bonus ?? null,
      }
    })

    return NextResponse.json({
      success: true,
      adjustments: formatted,
      count: formatted.length,
    })
  } catch (error) {
    console.error('获取积分调整记录失败:', error)
    return NextResponse.json(
      { error: '获取积分调整记录失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      userId?: string
      userEmail?: string
      delta?: number
      amount?: number
      operation?: 'increase' | 'decrease'
      adjustmentType?: CreditAdjustmentRow['adjustment_type']
      reason?: string | null
      relatedRechargeId?: string | null
      relatedConsumptionId?: string | null
      creditType?: 'permanent' | 'bonus'
      bonusExpiresDays?: number | null
    }

    if (!payload) {
      return NextResponse.json({ error: '请求体不能为空' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    if (!payload.userId && !payload.userEmail) {
      return NextResponse.json({ error: '必须提供 userId 或 userEmail' }, { status: 400 })
    }

    let targetUserId = payload.userId ?? null

    if (!targetUserId && payload.userEmail) {
      const { data: targetUser, error: findUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', payload.userEmail.trim())
        .single<{ id: string }>()

      if (findUserError || !targetUser) {
        return NextResponse.json(
          { error: '找不到对应的用户', details: findUserError?.message },
          { status: 404 }
        )
      }
      targetUserId = targetUser.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: '无法确定目标用户' }, { status: 400 })
    }

    let delta = 0
    if (typeof payload.delta === 'number') {
      delta = Math.trunc(payload.delta)
    } else if (typeof payload.amount === 'number') {
      const amount = Math.trunc(payload.amount)
      if (amount === 0) {
        return NextResponse.json({ error: '调整积分值不能为0' }, { status: 400 })
      }
      delta = payload.operation === 'decrease' ? -Math.abs(amount) : Math.abs(amount)
    } else {
      return NextResponse.json({ error: '必须提供 delta 或 amount' }, { status: 400 })
    }

    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json({ error: '调整积分必须是非零整数' }, { status: 400 })
    }

    const adjustmentType =
      payload.adjustmentType ??
      (delta > 0 ? 'manual_increase' : delta < 0 ? 'manual_decrease' : 'other')

    if (!ADJUSTMENT_TYPES.includes(adjustmentType)) {
      return NextResponse.json({ error: '不支持的调整类型' }, { status: 400 })
    }

    // 调用存储过程，原子性地调整积分并记录
    const creditType = payload.creditType ?? 'permanent'
    const bonusExpiresDays = payload.bonusExpiresDays ?? null
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: adjustment, error } = await (supabase as any).rpc('admin_adjust_user_credits', {
      p_admin_user_id: adminUser.id,
      p_user_id: targetUserId,
      p_delta: delta,
      p_reason: payload.reason ?? null,
      p_adjustment_type: adjustmentType,
      p_related_recharge_id: payload.relatedRechargeId ?? null,
      p_related_consumption_id: payload.relatedConsumptionId ?? null,
      p_credit_type: creditType,
      p_bonus_expires_days: bonusExpiresDays,
    })

    if (error || !adjustment) {
      console.error('积分调整失败:', error)
      return NextResponse.json(
        { error: '积分调整失败', details: error?.message ?? '未知错误' },
        { status: 400 }
      )
    }

    // 验证并获取最新的钱包余额（确保同步成功）
    const { data: wallet, error: walletError } = await supabase
      .from('credit_wallet')
      .select('permanent_credits, bonus_credits, bonus_expires_at')
      .eq('user_id', targetUserId)
      .single<{
        permanent_credits: number | null
        bonus_credits: number | null
        bonus_expires_at: string | null
      }>()

    if (walletError && walletError.code !== 'PGRST116') {
      console.warn('获取钱包余额失败（非关键错误）:', walletError)
    }

    // 计算总可用积分
    const now = new Date()
    const expiresAt = wallet?.bonus_expires_at ? new Date(wallet.bonus_expires_at) : null
    const validBonus = expiresAt && expiresAt > now ? (wallet?.bonus_credits || 0) : 0
    const totalAvailable = (wallet?.permanent_credits || 0) + validBonus

    return NextResponse.json({
      success: true,
      adjustment,
      // 返回最新的钱包余额，确保 admin 可以看到同步结果
      wallet: wallet ? {
        permanent_credits: wallet.permanent_credits || 0,
        bonus_credits: wallet.bonus_credits || 0,
        bonus_expires_at: wallet.bonus_expires_at,
        total_available: totalAvailable,
      } : null,
      message: '积分调整成功，已同步到钱包系统',
    })
  } catch (error) {
    console.error('执行积分调整时发生错误:', error)
    return NextResponse.json(
      {
        error: '执行积分调整失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


