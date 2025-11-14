import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextResponse } from 'next/server'

/**
 * 诊断端点：检查积分系统配置
 * 检查 credits 字段是否存在，以及用户积分状态
 */
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized, please login first' },
        { status: 401 }
      )
    }

    // 获取或创建用户信息
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // 尝试查询 credits 字段
    const { data: userWithCredits, error: creditsError } = await supabase
      .from('users')
      .select('id, credits')
      .eq('id', userProfile.id)
      .single()

    // 检查 credits 字段是否存在
    const hasCreditsField = !creditsError || !creditsError.message?.includes('column') || !creditsError.message?.includes('credits')
    
    // 尝试查询表结构（如果可能）
    let tableInfo = null
    try {
      const { data: columns, error: rpcError } = await supabase.rpc('get_table_columns', { 
        table_name: 'users' 
      })
      if (!rpcError && columns) {
        tableInfo = columns
      }
    } catch (e) {
      // 忽略错误，RPC可能不存在
    }

    return NextResponse.json({
      success: true,
      diagnostics: {
        user: {
          id: userProfile.id,
          hasCreditsField,
          credits: userWithCredits?.credits ?? null,
          creditsError: creditsError ? {
            message: creditsError.message,
            code: creditsError.code,
            hint: creditsError.hint,
            details: creditsError.details,
          } : null,
        },
        recommendation: hasCreditsField 
          ? 'Credits字段存在，可以正常使用'
          : '需要执行数据库迁移：supabase/migrations/004_add_credits_system.sql',
        migrationFile: 'supabase/migrations/004_add_credits_system.sql',
        quickFix: hasCreditsField 
          ? null 
          : 'ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0 CHECK (credits >= 0);',
      },
    })
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      {
        error: 'Failed to run diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

