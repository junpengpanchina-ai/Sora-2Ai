import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * 管理员后台 - 获取所有消耗记录
 * 包含用户邮箱信息
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
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
    const userIds = [...new Set((consumptionRecords || []).map((r: any) => r.user_id))]
    
    // 批量获取用户信息
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)

    const userMap = new Map()
    if (!usersError && users) {
      users.forEach((u: any) => {
        userMap.set(u.id, { email: u.email, name: u.name })
      })
    }

    // 格式化数据，添加用户信息
    const formattedRecords = (consumptionRecords || []).map((record: any) => {
      const userInfo = userMap.get(record.user_id) || {}
      return {
        id: record.id,
        user_id: record.user_id,
        video_task_id: record.video_task_id,
        credits: record.credits,
        description: record.description,
        status: record.status,
        created_at: record.created_at,
        refunded_at: record.refunded_at,
        user_email: userInfo.email || null,
        user_name: userInfo.name || null,
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

