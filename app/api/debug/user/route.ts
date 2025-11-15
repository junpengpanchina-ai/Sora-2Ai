// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 调试端点：检查当前用户信息和数据库状态
 * 仅在开发环境使用
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated',
        authError: authError?.message,
      }, { status: 401 })
    }

    // 提取 Google ID
    const googleId = 
      user.user_metadata?.provider_id || 
      user.user_metadata?.sub || 
      user.app_metadata?.provider_id ||
      user.id

    // 尝试查询用户（包括 credits 字段）
    const { data: userProfile, error: queryError } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single()
    
    // 检查 credits 字段是否存在
    const userProfileWithCredits = userProfile as { credits?: number } | null
    const hasCreditsField = !!userProfileWithCredits && Object.prototype.hasOwnProperty.call(userProfileWithCredits, 'credits')
    const creditsValue = userProfileWithCredits?.credits ?? null

    // 检查邮箱是否已存在
    const email = user.email || user.user_metadata?.email || ''
    let emailConflict = null
    if (email) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, google_id, email')
        .eq('email', email)
        .single()
      
      const existingEmailUser = emailUser as { id: string; google_id?: string | null; email: string } | null

      if (existingEmailUser && existingEmailUser.google_id !== googleId) {
        emailConflict = existingEmailUser
      }
    }

    return NextResponse.json({
      success: true,
      authUser: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
        app_metadata: user.app_metadata,
      },
      extractedGoogleId: googleId,
      databaseUser: userProfile,
      creditsInfo: {
        hasField: hasCreditsField,
        value: creditsValue,
        type: typeof creditsValue,
      },
      queryError: queryError ? {
        code: queryError.code,
        message: queryError.message,
        details: queryError.details,
        hint: queryError.hint,
      } : null,
      emailConflict,
      debug: {
        hasEmail: !!email,
        emailValue: email,
        googleIdSources: {
          provider_id: user.user_metadata?.provider_id,
          sub: user.user_metadata?.sub,
          app_provider_id: user.app_metadata?.provider_id,
          fallback_id: user.id,
        },
      },
    })
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

