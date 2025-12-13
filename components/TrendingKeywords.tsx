'use client'

import { useState, useEffect, useCallback } from 'react'

interface TrendingSearch {
  title: string
  formattedTraffic: string
  articleTitle?: string
  articleUrl?: string
  imageUrl?: string
}

interface TrendingKeywordsProps {
  geo?: string
  limit?: number
}

export default function TrendingKeywords({ geo = 'US', limit = 10 }: TrendingKeywordsProps) {
  const [trends, setTrends] = useState<TrendingSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchTrends = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      const response = await fetch(`/api/trends?geo=${geo}`)
      const data = await response.json()

      if (data.success && Array.isArray(data.trends)) {
        setTrends(data.trends.slice(0, limit))
        setLastUpdated(new Date(data.updatedAt))
      } else {
        // 使用备用数据
        setTrends(data.trends || [])
        setLastUpdated(new Date(data.updatedAt))
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err)
      setError('无法加载热搜词数据')
      // 使用示例数据
      setTrends((prevTrends) => {
        if (prevTrends.length === 0) {
          return [
            { title: 'AI Video Generator', formattedTraffic: '100K+', articleTitle: 'Latest AI Video Tools', articleUrl: '#' },
            { title: 'Sora 2', formattedTraffic: '50K+', articleTitle: 'OpenAI Sora Updates', articleUrl: '#' },
            { title: 'Text to Video', formattedTraffic: '30K+', articleTitle: 'Text to Video AI', articleUrl: '#' },
          ]
        }
        return prevTrends
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [geo, limit])

  useEffect(() => {
    fetchTrends()
    // 每30分钟刷新一次
    const interval = setInterval(() => fetchTrends(true), 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchTrends])

  if (loading && trends.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🔥 热搜词榜单</h2>
          <a
            href="https://trends.google.com/trending"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-energy-water hover:underline"
          >
            查看全部 →
          </a>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
          <span className="ml-2 text-sm text-gray-500">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/70">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">🔥 热搜词榜单</h2>
          {lastUpdated && (
            <p className="mt-1 text-xs text-gray-500">
              更新时间: {lastUpdated.toLocaleTimeString('zh-CN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTrends(true)}
            disabled={refreshing}
            className="text-sm text-energy-water hover:underline disabled:opacity-50"
            title="刷新数据"
          >
            {refreshing ? (
              <span className="inline-flex items-center">
                <svg className="mr-1 h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                刷新中
              </span>
            ) : (
              '🔄 刷新'
            )}
          </button>
          <a
            href="https://trends.google.com/trending"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-energy-water hover:underline"
          >
            查看全部 →
          </a>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
          {error}
        </div>
      )}

      {trends.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">暂无热搜词数据</p>
      ) : (
        <div className="space-y-3">
          {trends.map((trend, index) => (
            <div
              key={index}
              className="group flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition hover:border-energy-water hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-energy-water/10 text-xs font-semibold text-energy-water">
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-energy-water">
                      {trend.title}
                    </h3>
                    {trend.articleTitle && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-1 dark:text-gray-400">
                        {trend.articleTitle}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
                    {trend.formattedTraffic}
                  </span>
                </div>
                {trend.articleUrl && trend.articleUrl !== '#' && (
                  <a
                    href={trend.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-energy-water hover:underline"
                  >
                    查看详情 →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          数据来源: <a href="https://trends.google.com" target="_blank" rel="noopener noreferrer" className="text-energy-water hover:underline">Google Trends</a>
        </p>
      </div>
    </div>
  )
}

