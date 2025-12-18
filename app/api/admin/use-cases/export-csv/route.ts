import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 导出使用场景为 CSV 格式
 * 用于内容整理和备份
 */
export async function GET() {
  try {
    // 验证管理员权限
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json({ error: '未授权，请先登录' }, { status: 401 })
    }

    const supabase = await createServiceClient()
    
    // 获取所有已发布的使用场景
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCases, error } = await (supabase as any)
      .from('use_cases')
      .select('*')
      .eq('is_published', true)
      .order('industry', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[export-csv] 查询错误:', error)
      return NextResponse.json(
        { error: '导出失败', details: error.message },
        { status: 500 }
      )
    }

    if (!useCases || useCases.length === 0) {
      return NextResponse.json({ error: '没有可导出的数据' }, { status: 404 })
    }

    // 生成 CSV 内容
    const headers = [
      'industry',
      'scene_id',
      'scene_text',
      'slug',
      'title',
      'h1',
      'description',
      'use_case_type',
      'seo_keywords',
      'created_at',
    ]

    const csvRows = [
      headers.join(','),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...useCases.map((uc: any) => {
        const row = [
          uc.industry || '',
          uc.id,
          uc.content?.substring(0, 500) || uc.title || '',
          uc.slug || '',
          (uc.title || '').replace(/,/g, ';'),
          (uc.h1 || '').replace(/,/g, ';'),
          (uc.description || '').replace(/,/g, ';'),
          uc.use_case_type || '',
          Array.isArray(uc.seo_keywords) ? uc.seo_keywords.join(';') : (uc.seo_keywords || ''),
          uc.created_at || '',
        ]
        // 转义 CSV 中的引号和换行
        return row.map((cell) => {
          const str = String(cell)
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }).join(',')
      }),
    ]

    const csvContent = csvRows.join('\n')

    // 返回 CSV 文件
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="use-cases-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('[export-csv] 导出异常:', error)
    return NextResponse.json(
      {
        error: '导出失败',
        details: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    )
  }
}

