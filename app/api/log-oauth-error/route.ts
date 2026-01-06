import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * 记录 OAuth 登录错误（不记录敏感信息）
 * 用于可观测性：了解最常见的失败原因分布
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      error,
      error_description,
      error_code,
      origin,
      pathname,
      user_agent,
      timestamp,
    } = body

    // 验证必需字段
    if (!error || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: error, timestamp' },
        { status: 400 }
      )
    }

    // 创建 Supabase client（用于记录日志）
    const supabase = await createClient()

    // 记录到 Supabase（如果表存在）
    // 如果没有表，只记录到 console（不影响功能）
    try {
      const { error: insertError } = await supabase
        .from('oauth_error_logs')
        .insert({
          error: error.substring(0, 200), // 限制长度
          error_description: error_description
            ? error_description.substring(0, 500)
            : null,
          error_code: error_code || null,
          origin: origin || null,
          pathname: pathname || null,
          user_agent: user_agent ? user_agent.substring(0, 200) : null,
          timestamp: timestamp,
          created_at: new Date().toISOString(),
        })

      if (insertError) {
        // 表可能不存在，只记录到 console
        console.error('[OAuth Error Log] Failed to insert:', insertError)
      }
    } catch (dbError) {
      // 表不存在或其他数据库错误，只记录到 console
      console.error('[OAuth Error Log] Database error:', dbError)
    }

    // 始终记录到 console（用于 Vercel Logs）
    console.error('[OAuth Error Log]', {
      error: error.substring(0, 200),
      error_description: error_description
        ? error_description.substring(0, 500)
        : null,
      error_code: error_code || null,
      origin: origin || null,
      pathname: pathname || null,
      timestamp: timestamp,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[OAuth Error Log API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    )
  }
}

