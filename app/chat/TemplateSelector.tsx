'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { SEO_CONTENT_TEMPLATES, type PromptTemplate, renderTemplate } from '@/lib/prompts/seo-content-templates'

interface TemplateSelectorProps {
  onSelectTemplate: (prompt: string) => void
  onClose: () => void
}

export default function TemplateSelector({ onSelectTemplate, onClose }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null)
  const [params, setParams] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<string>('')

  const handleTemplateSelect = (template: PromptTemplate) => {
    setSelectedTemplate(template)
    // 初始化参数
    const initialParams: Record<string, string> = {}
    template.parameters.forEach((param) => {
      initialParams[param.key] = ''
    })
    setParams(initialParams)
    setPreview('')
  }

  const handleParamChange = (key: string, value: string) => {
    setParams((prev) => {
      const newParams = { ...prev, [key]: value }
      // 实时预览
      if (selectedTemplate) {
        const rendered = renderTemplate(selectedTemplate.template, newParams)
        setPreview(rendered)
      }
      return newParams
    })
  }

  const handleUseTemplate = () => {
    if (!selectedTemplate) return
    
    // 检查必填参数
    const missingParams = selectedTemplate.parameters
      .filter((p) => p.required && (!params[p.key] || params[p.key].trim() === ''))
      .map((p) => p.label)
    
    if (missingParams.length > 0) {
      alert(`请填写必填参数：${missingParams.join('、')}`)
      return
    }

    const rendered = renderTemplate(selectedTemplate.template, params)
    onSelectTemplate(rendered)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        {/* Header */}
        <div className="sticky top-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              SEO 内容生成模板
            </h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          {!selectedTemplate ? (
            // 模板列表
            <div className="grid gap-4 md:grid-cols-2">
              {SEO_CONTENT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="rounded-lg border-2 border-gray-200 bg-white p-4 text-left transition hover:border-energy-water hover:bg-energy-water/5 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-energy-water"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {template.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {template.parameters.slice(0, 3).map((param) => (
                      <span
                        key={param.key}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      >
                        {param.label}
                        {param.required && ' *'}
                      </span>
                    ))}
                    {template.parameters.length > 3 && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        +{template.parameters.length - 3}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            // 参数填写和预览
            <div className="space-y-6">
              {/* 返回按钮 */}
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                ← 返回模板列表
              </Button>

              {/* 模板信息 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedTemplate.name}
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {selectedTemplate.description}
                </p>
              </div>

              {/* 参数输入 */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 dark:text-white">填写参数：</h4>
                {selectedTemplate.parameters.map((param) => (
                  <div key={param.key}>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {param.label}
                      {param.required && <span className="text-red-500"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={params[param.key] || ''}
                      onChange={(e) => handleParamChange(param.key, e.target.value)}
                      placeholder={param.placeholder || `请输入${param.label}`}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    />
                  </div>
                ))}
              </div>

              {/* 预览 */}
              {preview && (
                <div>
                  <h4 className="mb-2 font-medium text-gray-900 dark:text-white">预览 Prompt：</h4>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs dark:border-gray-700 dark:bg-gray-800">
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {preview}
                    </pre>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button onClick={handleUseTemplate} className="flex-1">
                  使用此模板
                </Button>
                <Button variant="secondary" onClick={() => setSelectedTemplate(null)}>
                  取消
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

