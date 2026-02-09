import { NextRequest, NextResponse } from 'next/server'
import { isBadKeywordSlug, normalizeKeywordSlug } from '@/lib/keywords/bad-slugs'
import { reportBadUrlHit } from '@/lib/seo/bad-url-report'

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
        reportBadUrlHit(req, 'keywords_repeated_prefix')
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
  // 2. /use-cases: 含 hex 的 slug 不再重定向
  // DB 中 use_cases 的 slug 本身就是完整形式（如 abstract-art-content-99fc53cc72-...），
  // 重定向到 /use-cases/<first> 会导致目标页不存在 → 404。
  // 直接透传，由 page 按完整 slug 查库，有则 200，无则 404。
  // ============================================================================

  // ============================================================================
  // 3. /video 路由：去掉 prompt 参数（单跳 308）
  // P1: /video?prompt=... → /video（prompt 参数不参与 SEO，避免消耗 crawl budget）
  // ============================================================================
  if (pathname === '/video' && url.searchParams.has('prompt')) {
    reportBadUrlHit(req, 'video_prompt_param')
    const newUrl = url.clone()
    newUrl.searchParams.delete('prompt')
    // 保留其他查询参数（如果有）
    return NextResponse.redirect(newUrl, 308)
  }

  // ============================================================================
  // 4. 通用：去掉 ?format=xml 参数（全站）
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
    '/video',
  ],
}
