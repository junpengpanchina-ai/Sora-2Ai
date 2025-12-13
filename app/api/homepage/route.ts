import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0 // 禁用缓存，实时获取最新配置

// GET - 获取首页配置（公开访问）
export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('homepage_settings')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error && (error as { code?: string }).code !== 'PGRST116') {
      console.error('获取首页配置失败:', error)
      // 返回默认配置而不是错误
      return NextResponse.json({
        success: true,
        settings: getDefaultSettings(),
      })
    }

    return NextResponse.json({
      success: true,
      settings: data || getDefaultSettings(),
    })
  } catch (error) {
    console.error('获取首页配置异常:', error)
    // 返回默认配置而不是错误
    return NextResponse.json({
      success: true,
      settings: getDefaultSettings(),
    })
  }
}

function getDefaultSettings() {
  return {
    hero_badge_text: 'Sora 2 AI Control Center',
    hero_h1_text: 'Turn cinematic ideas into deployable Sora 2.0 workflows.',
    hero_h1_text_logged_in: 'Welcome back, Creator!',
    hero_description: 'Operate from a focused dashboard that keeps the cosmic atmosphere but prioritizes productivity. Track pipeline health, credits, and the next action without leaving your control surface.',
    hero_image_paths: [
      '2b827a33e43a48b2b583ed428977712c.png',
      '460bef39f6e34f82912a27e357827963.png',
      '5995d3bfdb674ecebaccc581ed8940b3.png',
      '7b0be82bb2134fca87519cbecf30aca9.png',
      '80dc75a06d0b49c29bdb78eb45dc70a0.png',
      'b451ac136a474a9f91398a403af2d2a6.png',
      'e6e1ebc8cea34e83a106009a485b1cbb.png',
      'f566981bc27549b7a2389a6887e9c840.png',
    ],
    hero_image_alt_texts: [
      'Image 1',
      'Image 2',
      'Image 3',
      'Image 4',
      'Image 5',
      'Image 6',
      'Image 7',
      'Image 8',
    ],
    hero_video_paths: [
      'vdieo/b8edbf0aa26b4afa85b7095b91414f3d.mp4',
      'vdieo/微信视频2025-11-09_223443_366.mp4',
      'vdieo/微信视频2025-11-09_223856_981.mp4',
      'vdieo/微信视频2025-11-09_224357_417.mp4',
      'vdieo/微信视频2025-11-09_224947_118.mp4',
    ],
    theme_style: 'cosmic',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
    accent_color: '#F59E0B',
    background_gradient: 'cosmic-space',
    cta_primary_text: 'Open Video Console',
    cta_primary_text_logged_out: 'Sign in to Start',
    cta_secondary_text: 'Browse Prompt Library',
  }
}

