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
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
