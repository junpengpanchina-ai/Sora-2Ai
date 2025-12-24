import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Sitemap 协议限制：每个文件最多 50,000 个 URL
const MAX_URLS_PER_SITEMAP = 50000

export async function GET() {
  const baseUrl = getBaseUrl()
  const supabase = await createServiceClient()

  try {
    // Use cases - must be both published AND approved for public visibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: useCases, error } = await (supabase as any)
      .from('use_cases')
      .select('slug, updated_at')
      .eq('is_published', true)
      .eq('quality_status', 'approved') // RLS policy requires both conditions
      .order('updated_at', { ascending: false })
      .limit(MAX_URLS_PER_SITEMAP) // Limit to comply with sitemap protocol

    if (error) {
      console.error('Error fetching use cases for sitemap:', error)
      // Return empty sitemap on error
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
        {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff',
          },
        }
      )
    }

    const useCasesArray = Array.isArray(useCases) ? useCases : []

    const urls = useCasesArray.map((useCase: { slug: string; updated_at?: string }) => {
      // Ensure slug is valid
      if (!useCase.slug || typeof useCase.slug !== 'string') {
        return null
      }

      const escapedSlug = useCase.slug
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')

      // Format lastmod date (ISO 8601 format, date only)
      let lastmod = ''
      if (useCase.updated_at) {
        try {
          const date = new Date(useCase.updated_at)
          if (!isNaN(date.getTime())) {
            lastmod = `\n      <lastmod>${date.toISOString().split('T')[0]}</lastmod>`
          }
        } catch {
          // Ignore invalid dates
        }
      }

      return `    <url>
      <loc>${baseUrl}/use-cases/${escapedSlug}</loc>${lastmod}
      <priority>0.7</priority>
    </url>`
    }).filter((url): url is string => url !== null)

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Error generating use cases sitemap:', error)
    // Return empty sitemap on error
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          'X-Content-Type-Options': 'nosniff',
        },
      }
    )
  }
}

