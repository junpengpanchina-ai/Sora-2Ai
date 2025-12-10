// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

/**
 * 管理员后台 - 获取所有消耗记录
 * 包含用户邮箱信息
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ConsumptionRecord = Database['public']['Tables']['consumption_records']['Row']
type UserSummary = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'>

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
    // 获取所有消耗记录
    const { data: consumptionRecords, error: consumptionError } = await supabase
      .from('consumption_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (consumptionError) {
      console.error('获取消耗记录失败:', consumptionError)
      return NextResponse.json(
        { error: '获取消耗记录失败', details: consumptionError.message },
        { status: 500 }
      )
    }

    // 获取所有用户ID
    const records = (consumptionRecords ?? []) as ConsumptionRecord[]
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
        video_task_id: record.video_task_id,
        credits: record.credits,
        description: record.description,
        status: record.status,
        created_at: record.created_at,
        refunded_at: record.refunded_at,
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
    console.error('获取消耗记录失败:', error)
    return NextResponse.json(
      {
        error: '获取消耗记录失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

