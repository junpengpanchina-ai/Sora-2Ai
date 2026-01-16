import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * 获取页面的相关内链（Tier1）
 * 
 * 查询参数：
 * - pageId: use_cases.id (UUID)
 * - slug: use_cases.slug (可选，如果提供 slug 则通过 slug 查找 pageId)
 */
function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7))
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pageId = searchParams.get('pageId')
    const slug = searchParams.get('slug')

    if (!pageId && !slug) {
      return NextResponse.json({ items: [] }, { status: 200 })
    }

    const supabase = await createServiceClient()
    const wk = weekKey()

    let targetPageId: string | null = null

    // 如果提供了 slug，先通过 slug 查找 pageId
    if (slug && !pageId) {
      const { data: pageData, error: pageError } = await supabase
        .from('use_cases')
        .select('id')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle()

      if (pageError || !pageData) {
        return NextResponse.json({ items: [] }, { status: 200 })
      }

      const page = pageData as { id: string } | null
      if (!page || !page.id) {
        return NextResponse.json({ items: [] }, { status: 200 })
      }

      targetPageId = page.id
    } else if (pageId) {
      targetPageId = pageId
    }

    if (!targetPageId) {
      return NextResponse.json({ items: [] }, { status: 200 })
    }

    // 查询内链
    const { data, error } = await supabase
      .from('page_internal_links')
      .select(`
        bucket,
        weight,
        target_page_id,
        use_cases!page_internal_links_target_page_id_fkey(
          slug,
          title,
          industry
        )
      `)
      .eq('page_id', targetPageId)
      .eq('week_key', wk)
      .order('weight', { ascending: false })

    if (error) {
      console.error('[api/related-links] Error:', error)
      return NextResponse.json({ items: [] }, { status: 200 })
    }

    interface LinkItem {
      bucket: string
      weight: number
      path: string
      title: string
      industry: string | null
    }

    const items: LinkItem[] = (data || [])
      .map((r: {
        bucket: string
        weight: number
        use_cases: {
          slug: string
          title: string | null
          industry: string | null
        } | null
      }) => {
        const target = r.use_cases
        if (!target || !target.slug) return null

        return {
          bucket: r.bucket,
          weight: r.weight,
          path: `/use-cases/${target.slug}`,
          title: target.title || target.slug,
          industry: target.industry,
        }
      })
      .filter((x): x is LinkItem => x !== null)

    return NextResponse.json({ items })
  } catch (error) {
    console.error('[api/related-links] Error:', error)
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
