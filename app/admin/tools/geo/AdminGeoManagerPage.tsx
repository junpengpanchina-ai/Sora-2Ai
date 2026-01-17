'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui'
import Link from 'next/link'
import AdminGeoManager from '../../AdminGeoManager'

interface AdminGeoManagerPageProps {
  adminUser: { id: string; username: string; is_super_admin: boolean }
}

export default function AdminGeoManagerPage({ adminUser }: AdminGeoManagerPageProps) {
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)
  const showBanner = useCallback((type: 'success' | 'error' | 'info', text: string) => {
    setBanner({ type, text })
    setTimeout(() => setBanner(null), 4000)
  }, [])

  return (
    <div className="min-h-screen bg-energy-hero dark:bg-energy-hero-dark">
      <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80 sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin"><h1 className="text-xl font-bold text-gray-900 dark:text-white">管理员后台</h1></Link>
              <span className="text-sm text-gray-600 dark:text-gray-400">GEO 管理（研发工具）</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end text-xs text-gray-500 dark:text-gray-400">
                <span>当前管理员：{adminUser.username}</span>
                {adminUser.is_super_admin && <span className="text-energy-water">超级管理员</span>}
              </div>
              <Link href="/admin"><Button variant="ghost" size="sm">返回总览</Button></Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {banner && (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${
            banner.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' :
            banner.type === 'info' ? 'border-blue-200 bg-blue-50 text-blue-700' :
            'border-red-200 bg-red-50 text-red-700'
          }`}>{banner.text}</div>
        )}
        <AdminGeoManager onShowBanner={showBanner} />
      </main>
    </div>
  )
}
