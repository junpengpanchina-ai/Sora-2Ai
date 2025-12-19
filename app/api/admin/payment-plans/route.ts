import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - 获取所有支付计划
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

    const { data, error } = await supabase
      .from('payment_plans')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('获取支付计划失败:', error)
      return NextResponse.json(
        { error: '获取支付计划失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plans: data || [],
    })
  } catch (error) {
    console.error('获取支付计划异常:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// POST - 创建新支付计划
export async function POST(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const supabase = await createServiceClient()

    const {
      plan_name,
      plan_type,
      display_order,
      amount,
      currency,
      credits,
      videos,
      description,
      badge_text,
      stripe_buy_button_id,
      stripe_payment_link_id,
      is_active,
      is_recommended,
    } = body

    // 验证必需字段
    if (!plan_name || !amount || !credits || !videos) {
      return NextResponse.json(
        { error: '缺少必需字段：plan_name, amount, credits, videos' },
        { status: 400 }
      )
    }

    const insertData = {
      plan_name,
      plan_type: plan_type || 'custom',
      display_order: display_order ?? 0,
      amount: parseFloat(amount),
      currency: currency || 'usd',
      credits: parseInt(credits),
      videos: parseInt(videos),
      description: description || null,
      badge_text: badge_text || null,
      stripe_buy_button_id: stripe_buy_button_id || null,
      stripe_payment_link_id: stripe_payment_link_id || null,
      is_active: is_active !== undefined ? is_active : true,
      is_recommended: is_recommended !== undefined ? is_recommended : false,
      created_by: adminUser.id,
      updated_by: adminUser.id,
    }

    const { data, error } = await supabase
      .from('payment_plans')
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      console.error('创建支付计划失败:', error)
      return NextResponse.json(
        { error: '创建支付计划失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan: data,
      message: '支付计划已创建',
    })
  } catch (error) {
    console.error('创建支付计划异常:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PUT - 更新支付计划
export async function PUT(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: '缺少计划 ID' },
        { status: 400 }
      )
    }

    const supabase = await createServiceClient()

    // 构建更新对象
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: adminUser.id,
    }

    if (updates.plan_name !== undefined) updateData.plan_name = updates.plan_name
    if (updates.plan_type !== undefined) updateData.plan_type = updates.plan_type
    if (updates.display_order !== undefined) updateData.display_order = updates.display_order
    if (updates.amount !== undefined) updateData.amount = parseFloat(updates.amount)
    if (updates.currency !== undefined) updateData.currency = updates.currency
    if (updates.credits !== undefined) updateData.credits = parseInt(updates.credits)
    if (updates.videos !== undefined) updateData.videos = parseInt(updates.videos)
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.badge_text !== undefined) updateData.badge_text = updates.badge_text
    if (updates.stripe_buy_button_id !== undefined) updateData.stripe_buy_button_id = updates.stripe_buy_button_id
    if (updates.stripe_payment_link_id !== undefined) updateData.stripe_payment_link_id = updates.stripe_payment_link_id
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active
    if (updates.is_recommended !== undefined) updateData.is_recommended = updates.is_recommended

    const { data, error } = await supabase
      .from('payment_plans')
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('更新支付计划失败:', error)
      return NextResponse.json(
        { error: '更新支付计划失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan: data,
      message: '支付计划已更新',
    })
  } catch (error) {
    console.error('更新支付计划异常:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

