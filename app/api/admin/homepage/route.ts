import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const revalidate = 0

// GET - 获取首页配置
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
      .from('homepage_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && (error as { code?: string }).code !== 'PGRST116') {
      console.error('获取首页配置失败:', error)
      return NextResponse.json(
        { error: '获取首页配置失败', details: (error as { message?: string }).message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      settings: data || null,
    })
  } catch (error) {
    console.error('获取首页配置异常:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

// PUT - 更新首页配置
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
    const supabase = await createServiceClient()

    // 验证必需字段
    const {
      hero_badge_text,
      hero_h1_text,
      hero_h1_text_logged_in,
      hero_description,
      hero_image_paths,
      hero_image_alt_texts,
      hero_video_paths,
      theme_style,
      primary_color,
      secondary_color,
      accent_color,
      background_gradient,
      cta_primary_text,
      cta_primary_text_logged_out,
      cta_secondary_text,
    } = body

    // 构建更新对象
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      updated_by: adminUser.id,
    }

    if (hero_badge_text !== undefined) updateData.hero_badge_text = hero_badge_text
    if (hero_h1_text !== undefined) updateData.hero_h1_text = hero_h1_text
    if (hero_h1_text_logged_in !== undefined) updateData.hero_h1_text_logged_in = hero_h1_text_logged_in
    if (hero_description !== undefined) updateData.hero_description = hero_description
    if (hero_image_paths !== undefined) updateData.hero_image_paths = hero_image_paths
    if (hero_image_alt_texts !== undefined) updateData.hero_image_alt_texts = hero_image_alt_texts
    if (hero_video_paths !== undefined) updateData.hero_video_paths = hero_video_paths
    if (theme_style !== undefined) updateData.theme_style = theme_style
    if (primary_color !== undefined) updateData.primary_color = primary_color
    if (secondary_color !== undefined) updateData.secondary_color = secondary_color
    if (accent_color !== undefined) updateData.accent_color = accent_color
    if (background_gradient !== undefined) updateData.background_gradient = background_gradient
    if (cta_primary_text !== undefined) updateData.cta_primary_text = cta_primary_text
    if (cta_primary_text_logged_out !== undefined) updateData.cta_primary_text_logged_out = cta_primary_text_logged_out
    if (cta_secondary_text !== undefined) updateData.cta_secondary_text = cta_secondary_text

    console.log('[保存首页配置] 更新数据:', JSON.stringify(updateData, null, 2))

    // 获取当前激活的配置ID
    const { data: currentSettings, error: queryError } = await supabase
      .from('homepage_settings')
      .select('id')
      .eq('is_active', true)
      .maybeSingle()

    if (queryError && (queryError as { code?: string }).code !== 'PGRST116') {
      console.error('[保存首页配置] 查询当前配置失败:', queryError)
      // 如果查询失败但不是"未找到"错误，记录但继续（可能没有配置）
    }

    let result
    if (currentSettings && (currentSettings as { id?: string }).id) {
      const currentId = (currentSettings as { id: string }).id
      console.log('[保存首页配置] 更新现有配置，ID:', currentId)
      
      // 更新现有配置
      const { data, error } = await supabase
        .from('homepage_settings')
        .update(updateData as never)
        .eq('id', currentId)
        .select()
        .single()

      if (error) {
        console.error('[保存首页配置] 更新失败:', {
          error,
          errorCode: (error as { code?: string }).code,
          errorMessage: (error as { message?: string }).message,
          errorDetails: (error as { details?: string }).details,
          updateData,
        })
        return NextResponse.json(
          { 
            error: '更新首页配置失败', 
            details: (error as { message?: string }).message || 'Unknown error',
            errorCode: (error as { code?: string }).code,
          },
          { status: 500 }
        )
      }
      result = data
      console.log('[保存首页配置] 更新成功')
    } else {
      console.log('[保存首页配置] 创建新配置')
      
      // 创建新配置
      updateData.is_active = true
      updateData.created_by = adminUser.id
      const { data, error } = await supabase
        .from('homepage_settings')
        .insert(updateData as never)
        .select()
        .single()

      if (error) {
        console.error('[保存首页配置] 创建失败:', {
          error,
          errorCode: (error as { code?: string }).code,
          errorMessage: (error as { message?: string }).message,
          errorDetails: (error as { details?: string }).details,
          updateData,
        })
        return NextResponse.json(
          { 
            error: '创建首页配置失败', 
            details: (error as { message?: string }).message || 'Unknown error',
            errorCode: (error as { code?: string }).code,
          },
          { status: 500 }
        )
      }
      result = data
      console.log('[保存首页配置] 创建成功')
    }

    return NextResponse.json({
      success: true,
      settings: result,
      message: '首页配置已保存',
    })
  } catch (error) {
    console.error('[保存首页配置] 异常:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    })
    return NextResponse.json(
      { 
        error: '服务器错误', 
        details: error instanceof Error ? error.message : '未知错误',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

