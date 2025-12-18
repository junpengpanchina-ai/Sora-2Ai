import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 检查认证
    const adminUser = await validateAdminSession()
    const authStatus = {
      isAuthenticated: !!adminUser,
      username: adminUser?.username || null,
      error: adminUser ? null : '未登录或会话已过期',
    }

    // 检查数据库连接
    let dbStatus = null
    try {
      const supabase = await createServiceClient()
      const { data, error } = await supabase
        .from('use_cases')
        .select('id, slug, title')
        .limit(5)

      dbStatus = {
        success: !error,
        error: error?.message || null,
        count: data?.length || 0,
        sample: data || [],
      }
    } catch (err) {
      dbStatus = {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        count: 0,
        sample: [],
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      authentication: authStatus,
      database: dbStatus,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

