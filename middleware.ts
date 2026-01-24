import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // ============================================================================
  // 1. /keywords 路由规范化
  // ============================================================================
  if (pathname.startsWith('/keywords/')) {
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

    // 1c) 规范化 slug：去掉重复的 keywords- 前缀
    // /keywords/keywords-keywords-xxx -> /keywords/keywords-xxx
    const parts = pathname.split('/').filter(Boolean) // ["keywords", "<slug>"]
    if (parts.length === 2) {
      const slug = parts[1]
      // 把连续的 "keywords-" 前缀压缩为一个
      const normalized = slug.replace(/^(keywords-)+/i, 'keywords-')
      if (normalized !== slug) {
        newUrl.pathname = `/keywords/${normalized}`
        changed = true
      }
    }

    // 1d) 去掉 .xml 后缀
    if (pathname.endsWith('.xml')) {
      newUrl.pathname = pathname.replace(/\.xml$/, '')
      changed = true
    }

    if (changed) {
      // 301 永久重定向
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
