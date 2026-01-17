'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui'
import ScenePromptsTab from './tabs/ScenePromptsTab'
import GlobalPromptsTab from './tabs/GlobalPromptsTab'
import PromptExperimentsTab from './tabs/PromptExperimentsTab'

interface AdminPromptsManagerV2Props {
  onShowBanner: (type: 'success' | 'error' | 'info', text: string) => void
}

/**
 * Admin Prompts Manager V2
 * 
 * 新架构：提示词库作为内部资产，不干扰 SEO
 * 
 * 3 个 Tab：
 * 1. Scene Prompts - 按场景管理（Scene 是 SEO 核心）
 * 2. Global Prompts - 全局模板（不绑定场景）
 * 3. Prompt Experiments - AB/灰度实验
 */
export default function AdminPromptsManagerV2({ onShowBanner }: AdminPromptsManagerV2Props) {
  const [activeTab, setActiveTab] = useState<'scene' | 'global' | 'experiments'>('scene')

  return (
    <div className="space-y-6">
      {/* 提示信息：提示词库是内部资产 */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                提示词库定位说明
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-200">
                提示词库是内部资产/能力实现，不参与 SEO/GEO。所有 Prompt 页面默认 <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 rounded">noindex</code>，不会出现在 sitemap 中。
                <br />
                <strong>场景（Scene/Use Case）</strong>才是内容与 SEO 的第一公民。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3 个 Tab */}
      <div className="space-y-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
          {[
            { value: 'scene', label: 'Scene Prompts' },
            { value: 'global', label: 'Global Prompts' },
            { value: 'experiments', label: 'Prompt Experiments' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setActiveTab(tab.value as typeof activeTab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.value
                  ? 'bg-energy-water text-white'
                  : 'text-gray-700 hover:bg-energy-water-surface dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {activeTab === 'scene' && <ScenePromptsTab onShowBanner={onShowBanner} />}
          {activeTab === 'global' && <GlobalPromptsTab onShowBanner={onShowBanner} />}
          {activeTab === 'experiments' && <PromptExperimentsTab onShowBanner={onShowBanner} />}
        </div>
      </div>
    </div>
  )
}
