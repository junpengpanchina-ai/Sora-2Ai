import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { createClient } from '@/lib/supabase/server'
import { validateAdminSession } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type IssueRow = Database['public']['Tables']['after_sales_issues']['Row']
type UserSummary = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'email' | 'name'>

export async function GET(request: Request) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 500)

    let query = supabase
      .from('after_sales_issues')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: issues, error } = await query

    if (error) {
      console.error('获取售后问题失败:', error)
      return NextResponse.json(
        { error: '获取售后反馈失败', details: error.message },
        { status: 500 }
      )
    }

    const issueRows = (issues ?? []) as IssueRow[]
    const handledByIds = [
      ...new Set(issueRows.map((issue) => issue.handled_by).filter((id): id is string => Boolean(id))),
    ]

    const { data: adminUsers, error: adminError } = handledByIds.length
      ? await supabase.from('users').select('id, email, name').in('id', handledByIds)
      : { data: null, error: null }

    if (adminError) {
      console.error('获取管理员信息失败:', adminError)
    }

    const adminMap = new Map<string, { email: string | null; name: string | null }>()
    if (adminUsers) {
      ;(adminUsers as UserSummary[]).forEach((admin) => {
        adminMap.set(admin.id, { email: admin.email, name: admin.name })
      })
    }

    const formattedIssues = issueRows.map((issue) => {
      const handler = issue.handled_by ? adminMap.get(issue.handled_by) ?? null : null
      return {
        ...issue,
        handler_email: handler?.email ?? null,
        handler_name: handler?.name ?? null,
      }
    })

    const statusCounts = issueRows.reduce<Record<string, number>>((acc, issue) => {
      acc[issue.status] = (acc[issue.status] ?? 0) + 1
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      issues: formattedIssues,
      count: formattedIssues.length,
      statusCounts,
    })
  } catch (error) {
    console.error('获取售后反馈失败:', error)
    return NextResponse.json(
      {
        error: '获取售后反馈失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}


