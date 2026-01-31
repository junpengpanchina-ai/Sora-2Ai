import { NextRequest, NextResponse } from 'next/server'
import { isBadKeywordSlug } from '@/lib/keywords/bad-slugs'

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
      // P0: Bad slugs (keywords-keywords-*, overlong) → 410 Gone
      // Stops Google wasting crawl; Gate requires no 5xx
      if (isBadKeywordSlug(slug)) {
        return new NextResponse('Gone', {
          status: 410,
          headers: { 'X-Robots-Tag': 'noindex, nofollow' },
        })
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
  // 2. 通用：去掉 ?format=xml 参数（全站）
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
