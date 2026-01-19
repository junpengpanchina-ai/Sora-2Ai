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

  // 去掉 count: 'exact'，避免与主查询叠加加重 DB 负担，触发 statement timeout (57014)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('use_cases')
    .select('id, slug, title, description, use_case_type, industry')
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
  const timeoutPromise = new Promise<{ data: unknown[] | null; error: unknown }>((resolve) => {
    setTimeout(() => {
      resolve({ data: null, error: { message: '查询超时（15秒）', code: 'TIMEOUT' } })
    }, QUERY_TIMEOUT)
  })

  const { data, error } = await Promise.race([
    queryPromise,
    timeoutPromise,
  ]) as { data: unknown[] | null; error: unknown }

  if (error) {
    console.error('[UseCasesPage] 查询失败:', (error as { code?: string }).code === '57014' ? 'statement timeout (57014)' : error)
  }

  const useCases = (Array.isArray(data) ? data : []) as Pick<
    UseCaseRow,
    'id' | 'slug' | 'title' | 'description' | 'use_case_type' | 'industry'
  >[]
  // 已去掉 count:exact，用 data.length；满页时假定可能有下一页以便展示 Next
  const totalCount = error ? 0 : useCases.length
  const totalPages = useCases.length >= pageSize ? 2 : Math.max(1, Math.ceil(totalCount / pageSize))

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
