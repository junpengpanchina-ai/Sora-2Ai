import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { escapeXml } from '@/lib/utils/url'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CHUNK_SIZE = 5000

type RpcResult = { data: unknown; error: { message: string } | null }
type RpcClient = { rpc: (fn: string, args?: Record<string, unknown>) => Promise<RpcResult> }

async function supabaseRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await createServiceClient()
  const { data, error } = await (supabase as unknown as RpcClient).rpc(fn, args)
  if (error) throw new Error(`RPC ${fn} failed: ${error.message}`)
  return data as T
}

/**
 * Tier1 分片 sitemap：/sitemaps/tier1-0.xml, /sitemaps/tier1-1.xml, ...
 * 只处理 tier1-{N}.xml，其它 404
 */
export async function GET(_: Request, { params }: { params: { name: string } }) {
  const name = params?.name || ''
  const m = name.match(/^tier1-(\d+)\.xml$/)
  if (!m) {
    return new NextResponse('Not Found', { status: 404 })
  }
  const page = parseInt(m[1], 10)
  if (!Number.isFinite(page) || page < 0) {
    return new NextResponse('Invalid page', { status: 400 })
  }

  const offset = page * CHUNK_SIZE

  try {
    const rows = await supabaseRpc<Array<{ loc: string; lastmod: string }>>('get_tier1_sitemap_chunk', {
      p_limit: CHUNK_SIZE,
      p_offset: offset,
    })

    const urls = (rows || []).map((r) => {
      const loc = String(r?.loc || '').trim()
      const lastmod = r?.lastmod ? new Date(r.lastmod).toISOString() : new Date().toISOString()
      if (!loc) return ''
      return `  <url><loc>${escapeXml(loc)}</loc><lastmod>${escapeXml(lastmod)}</lastmod></url>`
    }).filter(Boolean)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return new NextResponse(body, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }
}
