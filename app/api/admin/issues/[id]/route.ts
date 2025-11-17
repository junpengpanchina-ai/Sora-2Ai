import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/admin-auth'

type IssueUpdate = Database['public']['Tables']['after_sales_issues']['Update']
type IssueRow = Database['public']['Tables']['after_sales_issues']['Row']

const ALLOWED_STATUS = new Set(['open', 'in_progress', 'resolved', 'closed'])

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id
    if (!issueId) {
      return NextResponse.json({ error: '缺少问题ID' }, { status: 400 })
    }

    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createClient()
    const payload = (await request.json()) as {
      status?: IssueRow['status']
      adminNotes?: string | null
      handledBy?: string | null
    }

    if (!payload || Object.keys(payload).length === 0) {
      return NextResponse.json({ error: '没有可更新的字段' }, { status: 400 })
    }

    const updates: IssueUpdate = {}

    if (payload.status) {
      if (!ALLOWED_STATUS.has(payload.status)) {
        return NextResponse.json({ error: '无效的状态值' }, { status: 400 })
      }
      updates.status = payload.status
      updates.handled_by = payload.handledBy ?? adminUser.id
      if (payload.status === 'resolved' || payload.status === 'closed') {
        updates.resolved_at = new Date().toISOString()
      } else if (payload.status === 'open') {
        updates.resolved_at = null
        updates.handled_by = null
      }
    }

    if (payload.adminNotes !== undefined) {
      updates.admin_notes = payload.adminNotes ?? null
      if (!updates.handled_by) {
        updates.handled_by = payload.handledBy ?? adminUser.id
      }
    }

    if (payload.handledBy !== undefined && !payload.status && payload.adminNotes === undefined) {
      updates.handled_by = payload.handledBy
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '未提供有效的更新内容' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('after_sales_issues')
      .update(updates)
      .eq('id', issueId)
      .select('*')
      .single()

    if (error) {
      console.error('更新售后问题失败:', error)
      return NextResponse.json(
        { error: '更新售后问题失败', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      issue: updated,
    })
  } catch (error) {
    console.error('更新售后问题失败:', error)
    return NextResponse.json(
      {
        error: '更新售后问题失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


