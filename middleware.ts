import { type NextRequest } from 'next/server'
import { updateSession } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
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

