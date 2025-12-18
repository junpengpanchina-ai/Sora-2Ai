import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 检查环境变量
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || '未设置',
      serviceKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`
        : '未设置',
      anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`
        : '未设置',
    }

    // 尝试连接数据库
    let dbConnection = null
    let dbError = null
    try {
      const supabase = await createServiceClient()
      const { data, error } = await supabase.from('admin_users').select('count').limit(1)
      dbConnection = {
        success: !error,
        error: error?.message || null,
        canQuery: !!data,
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err)
      dbConnection = {
        success: false,
        error: dbError,
        canQuery: false,
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbConnection,
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

