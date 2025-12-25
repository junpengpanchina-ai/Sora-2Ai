import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 缓存1小时

/**
 * 获取所有已发布的行业列表
 * 用于前端下拉菜单
 */
export async function GET() {
  try {
    const supabase = await createServiceClient()

    // 获取所有有数据的行业（去重）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('use_cases')
      .select('industry')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
      .not('industry', 'is', null)
      .order('industry', { ascending: true })

    if (error) {
      console.error('[api/use-cases/industries] 查询错误:', error)
      return NextResponse.json(
        { error: 'Failed to load industries', details: error.message },
        { status: 500 }
      )
    }

    // 去重并排序
    const industries = Array.from(new Set(
      (Array.isArray(data) ? data : [])
        .map((item: { industry: string }) => item.industry)
        .filter((industry: string | null): industry is string => Boolean(industry))
    )).sort()

    return NextResponse.json({
      success: true,
      industries,
      count: industries.length,
    })
  } catch (error) {
    console.error('[api/use-cases/industries] 异常:', error)
    return NextResponse.json(
      { error: 'Failed to load industries', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

