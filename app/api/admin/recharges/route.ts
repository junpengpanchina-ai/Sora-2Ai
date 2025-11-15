// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

/**
 * 管理员后台 - 获取所有充值记录
 * 包含用户邮箱信息
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

type RechargeRecord = Database['public']['Tables']['recharge_records']['Row']
type UserSummary = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'>

export async function GET() {
  try {
    // 验证用户身份
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

    // 获取所有充值记录
    const { data: rechargeRecords, error: rechargeError } = await supabase
      .from('recharge_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (rechargeError) {
      console.error('获取充值记录失败:', rechargeError)
      return NextResponse.json(
        { error: '获取充值记录失败', details: rechargeError.message },
        { status: 500 }
      )
    }

    // 获取所有用户ID
    const records = (rechargeRecords ?? []) as RechargeRecord[]
    const userIds = [...new Set(records.map((record) => record.user_id))]
    
    // 批量获取用户信息
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    const userMap = new Map<string, { email: string | null; name: string | null }>()
    if (!usersError && users) {
      ;(users as UserSummary[]).forEach((userRecord) => {
        userMap.set(userRecord.id, { email: userRecord.email, name: userRecord.name })
      })
    }

    // 格式化数据，添加用户信息
    const formattedRecords = records.map((record) => {
      const userInfo = userMap.get(record.user_id) ?? { email: null, name: null }
      return {
        id: record.id,
        user_id: record.user_id,
        amount: record.amount,
        credits: record.credits,
        payment_method: record.payment_method,
        payment_id: record.payment_id,
        status: record.status,
        created_at: record.created_at,
        completed_at: record.completed_at,
        user_email: userInfo.email,
        user_name: userInfo.name,
      }
    })

    return NextResponse.json({
      success: true,
      records: formattedRecords,
      count: formattedRecords.length,
    })
  } catch (error) {
    console.error('获取充值记录失败:', error)
    return NextResponse.json(
      {
        error: '获取充值记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

