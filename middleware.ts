import { NextRequest, NextResponse } from 'next/server'
import { isBadKeywordSlug, normalizeKeywordSlug } from '@/lib/keywords/bad-slugs'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // ============================================================================
  // 1. /keywords 路由
  // ============================================================================
  if (pathname.startsWith('/keywords/')) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      const slug = parts[1]
      // P0: Bad slugs (keywords-keywords-*) → 308 to canonical (keywords-xxx)
      // Overlong → 410. Gate: never 5xx.
      if (isBadKeywordSlug(slug)) {
        if (slug.length > 200) {
          return new NextResponse('Gone', {
            status: 410,
            headers: { 'X-Robots-Tag': 'noindex, nofollow' },
          })
        }
        const canonical = normalizeKeywordSlug(slug)
        url.pathname = `/keywords/${canonical}`
        return NextResponse.redirect(url, 308)
      }
    }

    let changed = false
    const newUrl = url.clone()

    // 1a) 去掉 ?format=xml 参数
    if (newUrl.searchParams.get('format') === 'xml') {
      newUrl.searchParams.delete('format')
      changed = true
    }

    // 1b) 去掉所有查询参数中的 format
    if (newUrl.searchParams.has('format')) {
      newUrl.searchParams.delete('format')
      changed = true
    }

    // 1c) 去掉 .xml 后缀
    if (pathname.endsWith('.xml')) {
      newUrl.pathname = pathname.replace(/\.xml$/, '')
      changed = true
    }

    if (changed) {
      return NextResponse.redirect(newUrl, 301)
    }
  }

  // ============================================================================
  // 2. /use-cases: 超长 slug 含 hex 片段（如 fitness-<hex>-xxx）→ 308 到主 slug
  // ============================================================================
  if (pathname.startsWith('/use-cases/')) {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      const slug = parts[1]
      // 中间夹 10+ 位 hex 的异常 URL（混入 id + 超长 + 截断）
      if (/-[0-9a-f]{10,}-/i.test(slug)) {
        const first = slug.split('-')[0]
        if (first) {
          url.pathname = `/use-cases/${first}`
          return NextResponse.redirect(url, 308)
        }
      }
    }
  }

  // ============================================================================
  // 3. 通用：去掉 ?format=xml 参数（全站）
  // ============================================================================
  if (url.searchParams.get('format') === 'xml') {
    const newUrl = url.clone()
    newUrl.searchParams.delete('format')
    return NextResponse.redirect(newUrl, 301)
  }

  return NextResponse.next()
}

// 只对这些路径生效（减少性能开销）
export const config = {
  matcher: [
    '/keywords/:path*',
    '/use-cases/:path*',
  ],
}
