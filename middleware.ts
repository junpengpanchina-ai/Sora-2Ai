import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { updateSession } from './lib/supabase/middleware'
import { getLanguageFromRequest } from './lib/i18n'

export async function middleware(request: NextRequest) {
  const { pathname, hostname, searchParams } = request.nextUrl

  // 🔥 防回归护栏 #1: OAuth callback 路径绝对放行
  // 防止未来改 middleware 导致 OAuth 回调失败
  const oauthExcludedPaths = [
    '/auth/callback',        // Supabase OAuth 回调
    '/api/auth/callback',     // NextAuth 回调（如果使用）
    '/api/auth/callback/[...nextauth]', // NextAuth 动态路由
  ]
  
  // 如果路径匹配 OAuth 回调，直接放行，不执行任何中间件逻辑
  if (oauthExcludedPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 处理 www 子域名重定向到非 www 版本
  if (hostname.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.hostname = hostname.replace('www.', '')
    return NextResponse.redirect(url, 301) // 301 永久重定向
  }

  // 308/301 映射：只对 /use-cases/* 生效，查 redirect_map（硬合并开关）
  if (pathname.startsWith('/use-cases/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
        const { data } = await supabase
          .from('redirect_map')
          .select('to_path, code')
          .eq('from_path', pathname)
          .maybeSingle()
        if (data?.to_path && data.to_path !== pathname) {
          const url = request.nextUrl.clone()
          url.pathname = data.to_path
          return NextResponse.redirect(url, { status: (data.code === 301 ? 301 : 308) as 301 | 308 })
        }
      } catch (_) { /* 查表失败则放行 */ }
    }
  }

  // Admin 路由重定向：旧路径 → 新路径（308 永久重定向）
  // 注意：只重定向不存在的旧路径，不要重定向已经存在的路径（如 /admin/billing, /admin/content）
  if (pathname.startsWith('/admin')) {
    const REDIRECTS: Array<{ from: string; to: string }> = [
      // 老入口（/admin 没有对应的 page.tsx，需要重定向）
      { from: '/admin', to: '/admin/dashboard' },

      // 如果你以前确实存在这些旧路由（没有就删掉）
      // 注意：/admin/billing 和 /admin/content 已经有对应的页面，不要重定向
      { from: '/admin/keywords', to: '/admin/content/use-cases?tab=keywords' },
      { from: '/admin/use-cases', to: '/admin/content/use-cases?tab=usecases' },
      { from: '/admin/compare', to: '/admin/content/compare' },
      { from: '/admin/blog', to: '/admin/content/blog' },
      { from: '/admin/batch', to: '/admin/content/batches' },
    ]

    const hit = REDIRECTS.find(r => r.from === pathname)
    if (!hit) return NextResponse.next()

    const url = request.nextUrl.clone()
    const [toPath, toQuery] = hit.to.split('?')

    url.pathname = toPath
    url.search = toQuery ? `?${toQuery}` : ''

    // 透传旧 query 里非 tab 类参数（比如 id=xxx）
    searchParams.forEach((v, k) => {
      if (['tab', 'section', 'view', 'page'].includes(k)) return
      if (!url.searchParams.has(k)) url.searchParams.set(k, v)
    })

    return NextResponse.redirect(url, 308)
  }

  // 检查是否是关键词页面的 XML 请求
  // 只有当明确指定 format=xml 查询参数时，才返回 XML
  // 不检查 Accept 头，因为浏览器通常包含多种内容类型
  const keywordMatch = pathname.match(/^\/keywords\/([^/]+)$/)
  if (keywordMatch) {
    const format = request.nextUrl.searchParams.get('format')
    const slug = keywordMatch[1]
    
    // 调试日志
    console.log(`Middleware: Keyword path detected: ${pathname}, slug: ${slug}, format: ${format}`)

    // Normalize legacy ".xml" slugs to canonical HTML URL (301).
    // Example: /keywords/some-keyword.xml  -> /keywords/some-keyword
    // Keep ?format=xml behavior intact.
    if (format !== 'xml' && slug.toLowerCase().endsWith('.xml')) {
      const url = request.nextUrl.clone()
      url.pathname = `/keywords/${slug.replace(/\.xml$/i, '')}`
      // Preserve query params (except format, which isn't xml here anyway)
      return NextResponse.redirect(url, 301)
    }
    
    // 只有当明确指定 format=xml 时，才返回 XML
    if (format === 'xml') {
      // 重写到 API 路由
      const url = request.nextUrl.clone()
      url.pathname = `/api/keywords/${slug}`
      // 保留查询参数
      console.log(`Middleware: Rewriting to XML API: ${url.pathname}`)
      return NextResponse.rewrite(url)
    }
    // 否则，继续到 page.tsx 返回 HTML
    console.log(`Middleware: Continuing to HTML page for slug: ${slug}`)
  }

  // 处理会话更新
  const response = await updateSession(request)
  
  // 添加语言检测到响应头（用于国际 SEO）
  const acceptLanguage = request.headers.get('accept-language')
  const region = request.geo?.region // Vercel 提供的地理位置信息
  const detectedLang = getLanguageFromRequest(acceptLanguage, searchParams, region)
  response.headers.set('Content-Language', detectedLang)
  
  return response
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico, icon.svg (图标文件)
     * - sitemap 文件 (sitemap.xml, sitemap-*.xml)
     * - robots.txt
     * - public 文件夹中的静态资源
     * - /auth/callback (OAuth 回调 - 绝对放行)
     * - /api/auth/* (NextAuth 回调 - 绝对放行)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap|robots\\.txt|auth/callback|api/auth/.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html|xml)$).*)',
    // Admin 路由匹配（用于重定向）
    '/admin/:path*',
  ],
}

