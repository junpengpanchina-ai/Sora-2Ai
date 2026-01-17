'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import AdminBatchContentGenerator from '../../AdminBatchContentGenerator'
import UseCaseBatchGenerator from '../../UseCaseBatchGenerator'
import IndustrySceneBatchGenerator from '../../IndustrySceneBatchGenerator'

interface AdminBatchesPageProps {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

type BatchTabType = 'general' | 'use-case' | 'industry-scene'

export default function AdminBatchesPage({ onShowBanner }: AdminBatchesPageProps) {
  const [activeTab, setActiveTab] = useState<BatchTabType>('general')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">批量生成</h2>
        <div className="flex gap-2">
          {[
            { value: 'general', label: '通用批量生成' },
            { value: 'use-case', label: '使用场景批量生成' },
            { value: 'industry-scene', label: '行业场景词批量生成' },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.value as BatchTabType)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {activeTab === 'general' && <AdminBatchContentGenerator onShowBanner={onShowBanner} />}
      {activeTab === 'use-case' && (
        <UseCaseBatchGenerator
          onShowBanner={onShowBanner}
          onGenerated={() => {
            // 生成完成后可以刷新列表
            onShowBanner('success', '批量生成完成')
          }}
        />
      )}
      {activeTab === 'industry-scene' && (
        <IndustrySceneBatchGenerator
          onShowBanner={onShowBanner}
          onGenerated={() => {
            onShowBanner('success', '批量生成完成')
          }}
        />
      )}
    </div>
  )
}
