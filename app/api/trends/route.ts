import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 缓存1小时

interface TrendingSearch {
  title: string
  formattedTraffic: string
  articleTitle?: string
  articleUrl?: string
  imageUrl?: string
}

interface GoogleTrendsItem {
  title?: {
    query?: string
  } | string
  formattedTraffic?: string
  articles?: Array<{
    title?: string
    url?: string
  }>
  image?: {
    imageUrl?: string
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const geo = searchParams.get('geo') || 'US' // 默认美国，可以改为 CN 或其他国家

    // 动态导入 google-trends-api (CommonJS 模块)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const googleTrends = require('google-trends-api')

    // 获取每日热搜词
    const dailyTrends = await googleTrends.dailyTrends({
      geo: geo,
    })

    const data = JSON.parse(dailyTrends)
    const trendingSearches: TrendingSearch[] = []

    // 解析 Google Trends 返回的数据
    if (data?.default?.trendingSearchesDays?.[0]?.trendingSearches) {
      const searches = data.default.trendingSearchesDays[0].trendingSearches as GoogleTrendsItem[]
      
      searches.forEach((item) => {
        const title = typeof item.title === 'string' 
          ? item.title 
          : item.title?.query || ''
        
        trendingSearches.push({
          title,
          formattedTraffic: item.formattedTraffic || '',
          articleTitle: item.articles?.[0]?.title || '',
          articleUrl: item.articles?.[0]?.url || '',
          imageUrl: item.image?.imageUrl || '',
        })
      })
    }

    const response = NextResponse.json({
      success: true,
      trends: trendingSearches.slice(0, 20), // 返回前20个
      geo,
      updatedAt: new Date().toISOString(),
    })
    
    // 🔥 Pro 计划优化：添加 CDN 缓存 headers（利用 Vercel Edge Network）
    // 趋势数据每小时更新一次，但允许使用过期数据（stale-while-revalidate）
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=7200'
    )
    
    return response
  } catch (error) {
    console.error('Failed to fetch Google Trends:', error)
    
    // 如果 API 失败，返回示例数据
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trends',
      trends: [
        { title: 'AI Video Generator', formattedTraffic: '100K+', articleTitle: 'Latest AI Video Tools', articleUrl: '#' },
        { title: 'Sora 2', formattedTraffic: '50K+', articleTitle: 'OpenAI Sora Updates', articleUrl: '#' },
        { title: 'Text to Video', formattedTraffic: '30K+', articleTitle: 'Text to Video AI', articleUrl: '#' },
        { title: 'Video AI', formattedTraffic: '25K+', articleTitle: 'AI Video Creation', articleUrl: '#' },
        { title: 'AI Generator', formattedTraffic: '20K+', articleTitle: 'AI Content Generator', articleUrl: '#' },
      ] as TrendingSearch[],
      updatedAt: new Date().toISOString(),
    })
  }
}

