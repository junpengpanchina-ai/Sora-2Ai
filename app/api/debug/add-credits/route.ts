import { createClient } from '@/lib/supabase/server'
import { getOrCreateUser } from '@/lib/user'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// 仅在开发环境允许
const isDevelopment = process.env.NODE_ENV === 'development'

// 添加积分请求参数验证
const addCreditsSchema = z.object({
  credits: z.number().int().min(1).max(10000, '积分数量必须在1-10000之间'),
})

/**
 * 开发/测试端点：直接添加积分（无需支付）
 * ⚠️ 仅在开发环境使用，生产环境应禁用
 */
export async function POST(request: NextRequest) {
  // 检查是否为开发环境
  if (!isDevelopment) {
    return NextResponse.json(
      { error: '此功能仅在开发环境可用' },
      { status: 403 }
    )
  }

  try {
    // 验证用户身份
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

    // 解析请求体
    const body = await request.json()
    const validatedData = addCreditsSchema.parse(body)

    // 获取或创建用户信息
    const userProfile = await getOrCreateUser(supabase, user)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found or failed to create user' },
        { status: 404 }
      )
    }

    // 获取用户当前积分（尝试查询所有字段，如果credits字段不存在会报错）
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('credits')
      .eq('id', userProfile.id)
      .single()

    if (userError) {
      console.error('Failed to fetch user credits:', userError)
      // 如果错误是因为credits字段不存在，尝试先添加字段
      if (userError.message?.includes('column') && userError.message?.includes('credits')) {
        return NextResponse.json(
          { 
            error: 'Credits字段不存在', 
            details: '请先执行数据库迁移: supabase/migrations/004_add_credits_system.sql',
            hint: '在Supabase Dashboard的SQL Editor中执行迁移文件'
          },
          { status: 500 }
        )
      }
      return NextResponse.json(
        { 
          error: 'Failed to fetch user credits', 
          details: userError.message,
          code: userError.code,
          hint: userError.hint
        },
        { status: 500 }
      )
    }

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      )
    }

    const currentCredits = currentUser.credits ?? 0
    const newCredits = currentCredits + validatedData.credits

    // 更新用户积分
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits })
      .eq('id', userProfile.id)

    if (updateError) {
      console.error('Failed to update credits:', updateError)
      return NextResponse.json(
        { 
          error: 'Failed to update credits', 
          details: updateError.message,
          code: updateError.code,
          hint: updateError.hint || '请检查数据库表结构和权限'
        },
        { status: 500 }
      )
    }

    // 创建测试充值记录（可选，用于记录）
    // 如果表不存在，静默失败，不影响积分添加
    try {
      await supabase
        .from('recharge_records')
        .insert({
          user_id: userProfile.id,
          amount: validatedData.credits / 100, // 假设1元=100积分
          credits: validatedData.credits,
          payment_method: 'test',
          payment_id: `test_${Date.now()}`,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
    } catch (rechargeError: any) {
      // 如果充值记录表不存在或插入失败，不影响积分添加
      // 只记录警告，不抛出错误
      console.warn('Failed to create test recharge record (this is optional):', rechargeError?.message || rechargeError)
    }

    return NextResponse.json({
      success: true,
      message: `成功添加 ${validatedData.credits} 积分`,
      credits: {
        before: currentCredits,
        added: validatedData.credits,
        after: newCredits,
      },
    })
  } catch (error) {
    console.error('Failed to add credits:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '参数验证失败', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to add credits',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

