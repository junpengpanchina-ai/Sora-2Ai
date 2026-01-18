import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DAYS_MAX = 31

/**
 * GET /api/admin/lockdown-daily?days=14
 * 返回最近 N 天的填报，按 date 降序。
 */
export async function GET(request: Request) {
  try {
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Math.min(DAYS_MAX, Math.max(1, Number(searchParams.get('days')) || 14))

    const supabase = await createServiceClient()

    const { data, error } = await supabase
      .from('admin_lockdown_daily')
      .select('*')
      .order('date', { ascending: false })
      .limit(days)

    if (error) {
      console.error('[lockdown-daily] GET', error)
      return NextResponse.json(
        { error: '获取 Lockdown 记录失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ entries: data ?? [] })
  } catch (e) {
    console.error('[lockdown-daily] GET', e)
    return NextResponse.json(
      { error: '获取 Lockdown 记录失败' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/lockdown-daily
 * Body: LockdownDailyForm（见 types/admin-lockdown）
 * 按 date 唯一，存在则更新，否则插入。
 */
export async function POST(request: Request) {
  try {
    const admin = await validateAdminSession()
    if (!admin) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const date = body.date || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date 格式须为 YYYY-MM-DD' }, { status: 400 })
    }

    const row = {
      date,
      phase: body.phase || 'HOLD',
      crawl_pages_per_day: Number(body.crawl_pages_per_day) || 0,
      crawl_trend: ['up', 'flat', 'down'].includes(body.crawl_trend) ? body.crawl_trend : 'flat',
      discovered_total: Number(body.discovered_total) || 0,
      discovered_trend: ['up', 'flat', 'down'].includes(body.discovered_trend)
        ? body.discovered_trend
        : 'flat',
      indexed_total: Number(body.indexed_total) || 0,
      indexed_trend: ['up', 'flat', 'down'].includes(body.indexed_trend)
        ? body.indexed_trend
        : 'flat',
      sitemap_status: ['success', 'warning', 'error'].includes(body.sitemap_status)
        ? body.sitemap_status
        : 'success',
      sitemap_submitted: body.sitemap_submitted != null ? Number(body.sitemap_submitted) : null,
      sitemap_discovered: body.sitemap_discovered != null ? Number(body.sitemap_discovered) : null,
      sitemap_indexed: body.sitemap_indexed != null ? Number(body.sitemap_indexed) : null,
      sample_main_scene_ok: Boolean(body.sample_main_scene_ok),
      sample_merged_scene_ok: Boolean(body.sample_merged_scene_ok),
      note: body.note && String(body.note).trim() ? String(body.note).trim() : null,
    }

    const supabase = await createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin_lockdown_daily Insert 与 Supabase 生成类型暂不完全匹配，运行时正确
    const { error } = await (supabase as any)
      .from('admin_lockdown_daily')
      .upsert(row, { onConflict: 'date' })

    if (error) {
      console.error('[lockdown-daily] POST', error)
      return NextResponse.json(
        { error: '保存 Lockdown 记录失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[lockdown-daily] POST', e)
    return NextResponse.json(
      { error: '保存 Lockdown 记录失败' },
      { status: 500 }
    )
  }
}
