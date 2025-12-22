import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 60 // 缓存60秒

// GET - 获取激活的支付计划（公开访问）
export async function GET() {
  try {
    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('获取支付计划失败:', error)
      return NextResponse.json({
        success: true,
        plans: [],
      })
    }

    const response = NextResponse.json({
      success: true,
      plans: data || [],
    })
    
    // 🔥 Pro 计划优化：添加 CDN 缓存 headers（利用 Vercel Edge Network）
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    )
    
    return response
  } catch (error) {
    console.error('获取支付计划异常:', error)
    return NextResponse.json({
      success: true,
      plans: [],
    })
  }
}

