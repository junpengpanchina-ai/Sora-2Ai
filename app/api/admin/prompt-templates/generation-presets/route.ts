import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })

    const supabase = await createServiceClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('prompt_generation_presets')
      .select('preset_id,display_name,description,enabled,config,updated_at')
      .order('updated_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ success: true, items: data ?? [] })
  } catch (e) {
    console.error('[admin/prompt-templates/generation-presets] GET failed:', e)
    return NextResponse.json({ error: '获取 presets 失败' }, { status: 500 })
  }
}

