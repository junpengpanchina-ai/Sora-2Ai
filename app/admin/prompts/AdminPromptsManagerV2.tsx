'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui'
import { Button } from '@/components/ui'
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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scene">Scene Prompts</TabsTrigger>
          <TabsTrigger value="global">Global Prompts</TabsTrigger>
          <TabsTrigger value="experiments">Prompt Experiments</TabsTrigger>
        </TabsList>

        <TabsContent value="scene" className="space-y-4 mt-6">
          <ScenePromptsTab onShowBanner={onShowBanner} />
        </TabsContent>

        <TabsContent value="global" className="space-y-4 mt-6">
          <GlobalPromptsTab onShowBanner={onShowBanner} />
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4 mt-6">
          <PromptExperimentsTab onShowBanner={onShowBanner} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
