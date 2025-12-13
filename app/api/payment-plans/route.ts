import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

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

    return NextResponse.json({
      success: true,
      plans: data || [],
    })
  } catch (error) {
    console.error('获取支付计划异常:', error)
    return NextResponse.json({
      success: true,
      plans: [],
    })
  }
}

