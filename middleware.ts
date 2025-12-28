import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'
import { getLanguageFromRequest } from './lib/i18n'

export async function middleware(request: NextRequest) {
  const { pathname, hostname, searchParams } = request.nextUrl

  // 处理 www 子域名重定向到非 www 版本
  if (hostname.startsWith('www.')) {
    const url = request.nextUrl.clone()
    url.hostname = hostname.replace('www.', '')
    return NextResponse.redirect(url, 301) // 301 永久重定向
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
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|sitemap|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|html|xml)$).*)',
  ],
}

