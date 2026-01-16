import type { Metadata } from 'next'
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import UseCasesPageClient from './UseCasesPageClient'

type UseCaseRow = Database['public']['Tables']['use_cases']['Row']

// 🔥 Performance optimization: Increase cache time for better TTFB
// Use cases don't change frequently, so 1 hour cache is safe
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Use Cases Library - AI Video Generation Applications',
  description: 'Explore AI video generation applications across different scenarios. From marketing to social media, discover best practices and create professional videos with our Sora alternative.',
}

export default async function UseCasesIndexPage({
  searchParams,
}: {
  searchParams?: { page?: string; type?: string; industry?: string; q?: string }
}) {
  const supabase = await createSupabaseServerClient()
  // 🔥 Performance optimization: Reduce initial page size for better LCP
  // Desktop: 24 items, Mobile: 12 items (handled client-side)
  const pageSize = 24
  const page = Math.max(1, Number(searchParams?.page ?? '1') || 1)
  const offset = (page - 1) * pageSize

  const type = (searchParams?.type ?? 'all').toLowerCase()
  const industry = searchParams?.industry ?? 'all'
  const q = (searchParams?.q ?? '').trim()
  
  // Query timeout: 15 seconds for SSR
  const QUERY_TIMEOUT = 15000

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, industry', { count: 'exact' })
    .eq('is_published', true)
    // Allow both approved and null quality_status (null means not reviewed yet, but still show)
    // Use or() with proper syntax: field.operator.value,field.operator.value
    .or('quality_status.eq.approved,quality_status.is.null')
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  // Use correct type values that match the database schema
  const validTypes = ['advertising-promotion', 'social-media-content', 'product-demo-showcase', 'brand-storytelling', 'education-explainer', 'ugc-creator-content']
  if (type !== 'all' && validTypes.includes(type)) {
    query = query.eq('use_case_type', type)
  }

  if (industry !== 'all' && industry !== '') {
    query = query.eq('industry', industry)
  }

  if (q) {
    // Search across slug/title/description in DB to avoid downloading huge datasets.
    query = query.or(`slug.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`)
  }

  // Execute query with timeout
  const queryPromise = query
  const timeoutPromise = new Promise<{ data: unknown[] | null; count: number | null; error: unknown }>((resolve) => {
    setTimeout(() => {
      resolve({ data: null, count: null, error: { message: '查询超时（15秒）', code: 'TIMEOUT' } })
    }, QUERY_TIMEOUT)
  })

  const { data, error, count } = await Promise.race([
    queryPromise,
    timeoutPromise,
  ]) as { data: unknown[] | null; count: number | null; error: unknown }

  // 🔍 详细调试日志
  console.log('[UseCasesPage] 查询参数:', {
    type,
    industry,
    q,
    page,
    pageSize,
    offset,
  })
  console.log('[UseCasesPage] 查询结果:', {
    dataLength: Array.isArray(data) ? data.length : 0,
    count,
    error: error ? {
      message: (error as { message?: string }).message,
      code: (error as { code?: string }).code,
      details: (error as { details?: string }).details,
      hint: (error as { hint?: string }).hint,
    } : null,
  })

  if (error) {
    console.error('[UseCasesPage] 查询失败:', error)
    // 如果是超时错误，记录但不阻止页面渲染
    if ((error as { code?: string }).code === 'TIMEOUT') {
      console.warn('[UseCasesPage] 查询超时，返回空列表，客户端可以重试')
    }
  }

  const useCases = (Array.isArray(data) ? data : []) as Pick<
    UseCaseRow,
    'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'
  >[]
  // 如果查询失败或超时，使用0作为默认值，让客户端通过API获取数据
  const totalCount = typeof count === 'number' ? count : (error ? 0 : useCases.length)
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  console.log('[UseCasesPage] 最终数据:', {
    useCasesCount: useCases.length,
    totalCount,
    totalPages,
  })

  return (
    <UseCasesPageClient
      initialUseCases={useCases}
      totalCount={totalCount}
      currentPage={page}
      totalPages={totalPages}
      selectedType={type}
      selectedIndustry={industry}
      searchQuery={q}
    />
  )
}
