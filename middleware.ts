import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否是关键词页面的 XML 请求
  // 如果路径是 /keywords/{slug} 且 Accept 头包含 XML，重写到 API 路由
  const keywordMatch = pathname.match(/^\/keywords\/([^/]+)$/)
  if (keywordMatch) {
    const acceptHeader = request.headers.get('accept') || ''
    const acceptsXml = acceptHeader.includes('application/xml') || acceptHeader.includes('text/xml')
    const format = request.nextUrl.searchParams.get('format')
    
    if (acceptsXml || format === 'xml') {
      // 重写到 API 路由
      const slug = keywordMatch[1]
      const url = request.nextUrl.clone()
      url.pathname = `/api/keywords/${slug}`
      // 保留查询参数
      return NextResponse.rewrite(url)
    }
  }

  return await updateSession(request)
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

