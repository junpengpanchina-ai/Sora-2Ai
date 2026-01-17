import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/utils/url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/storage-test/',
          '/payment-test/',
          '/prompts/',  // ❌ Prompt 是内部资产，不参与 SEO/GEO
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/auth/',
          '/storage-test/',
          '/payment-test/',
          '/prompts/',  // ❌ Prompt 是内部资产，不参与 SEO/GEO
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap-index.xml`, // 指向 sitemap index，包含 Tier 1 和全量 sitemap
  }
}
