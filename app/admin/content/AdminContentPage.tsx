'use client'

import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { useLockdown } from '@/components/admin/AdminLockdownContext'
import { DisabledOverlay } from '@/components/admin/DisabledOverlay'
import AdminUseCasesManager from './use-cases/AdminUseCasesManager'
import AdminKeywordsManager from './keywords/AdminKeywordsManager'
import AdminComparePagesManager from './compare/AdminComparePagesManager'
import AdminBlogManager from './blog/AdminBlogManager'
import AdminBatchesPage from './batches/AdminBatchesPage'

interface AdminContentPageProps {
  adminUser: {
    id: string
    username: string
    is_super_admin: boolean
  }
}

type ContentTabType = 'use-cases' | 'keywords' | 'compare' | 'blog' | 'batches'

export default function AdminContentPage({ adminUser }: AdminContentPageProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams?.get('tab') || 'use-cases'
  
  const [activeTab, setActiveTab] = useState<ContentTabType>(
    (tabFromUrl as ContentTabType) || 'use-cases'
  )
  
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const { phase } = useLockdown()

  const showBanner = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setBanner({ type, text })
    setTimeout(() => {
      setBanner(null)
    }, 4000)
  }, [])

  const handleTabChange = (tab: ContentTabType) => {
    setActiveTab(tab)
    router.push(`/admin/content?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">管理员后台</h1>
              </Link>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'use-cases', label: '使用场景' },
                  { value: 'keywords', label: '长尾词' },
                  { value: 'compare', label: '对比页' },
                  { value: 'blog', label: '博客文章' },
                  { value: 'batches', label: '批量生成' },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => handleTabChange(tab.value as ContentTabType)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.value
                        ? 'bg-energy-water text-white'
                        : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                <span>当前管理员：{adminUser.username}</span>
                {adminUser.is_super_admin && <span className="text-energy-water">超级管理员</span>}
              </div>
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  返回总览
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {banner && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
              banner.type === 'success'
                ? 'border-green-200 bg-green-50 text-green-700'
                : banner.type === 'info'
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {banner.text}
          </div>
        )}

        <div className="relative">
          {phase !== 'EXPAND' && <DisabledOverlay />}
          {activeTab === 'use-cases' && <AdminUseCasesManager onShowBanner={showBanner} />}
          {activeTab === 'keywords' && <AdminKeywordsManager onShowBanner={showBanner} />}
          {activeTab === 'compare' && <AdminComparePagesManager onShowBanner={showBanner} />}
          {activeTab === 'blog' && <AdminBlogManager onShowBanner={showBanner} />}
          {activeTab === 'batches' && <AdminBatchesPage onShowBanner={showBanner} />}
        </div>
      </main>
    </div>
  )
}
