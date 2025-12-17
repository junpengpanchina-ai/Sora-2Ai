'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Textarea } from '@/components/ui'
import { SEO_CONTENT_TEMPLATES, renderTemplate } from '@/lib/prompts/seo-content-templates'
import { generateSlugFromText } from '@/lib/utils/slug'

interface AdminBatchContentGeneratorProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface BatchTask {
  id: string
  templateId: string
  params: Record<string, string>
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'saved'
  result?: string
  error?: string
  savedId?: string // 保存到数据库后的 ID
}

export default function AdminBatchContentGenerator({ onShowBanner }: AdminBatchContentGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('use-case')
  const [csvInput, setCsvInput] = useState('')
  const [tasks, setTasks] = useState<BatchTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [autoSave, setAutoSave] = useState(true) // 默认开启自动保存
  const fileInputRef = useRef<HTMLInputElement>(null)

  // CSV 示例
  const csvExample = `scene,industry,keyword,style
健身课程视频,体育培训,ai fitness video generator,realistic
宠物短视频,宠物店,ai pet tiktok video,cute
亚马逊产品视频,电商,ai product video generator,studio
教育课程视频,在线教育,ai education video generator,professional
营销广告视频,广告公司,ai marketing video generator,commercial`

  /**
   * 解析 CSV
   */
  const parseCSV = (csv: string): Array<Record<string, string>> => {
    const lines = csv.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim())
    const rows: Array<Record<string, string>> = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }

    return rows
  }

  /**
   * 处理单个任务
   */
  const processTask = async (task: BatchTask): Promise<string> => {
    const template = SEO_CONTENT_TEMPLATES.find((t) => t.id === task.templateId)
    if (!template) {
      throw new Error('模板不存在')
    }

    // 构建完整的 Prompt（包含系统提示词）
    const systemPrompt = 'You are a professional SEO content writer. Please generate content strictly according to the requirements. All output must be in English.'
    const userPrompt = renderTemplate(template.template, task.params)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemini-2.5-flash',
        stream: false, // 批量生成使用非流式，更稳定
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const data = await response.json()
    
    // 处理非流式响应
    if (data.success && data.data) {
      const content = data.data.choices?.[0]?.message?.content || ''
      if (!content) {
        throw new Error('生成的内容为空')
      }
      return content
    }
    
    throw new Error(data.error || '生成失败')
  }

  /**
   * 从内容中提取 H1 标题
   */
  const extractH1 = (content: string): string => {
    const h1Match = content.match(/^#\s+(.+)$/m) || content.match(/<h1[^>]*>(.+?)<\/h1>/i)
    if (h1Match) {
      return h1Match[1].trim().replace(/<[^>]+>/g, '')
    }
    return ''
  }

  /**
   * 从内容中提取第一段作为描述
   */
  const extractDescription = (content: string, maxLength: number = 200): string => {
    // 移除 markdown 标题和 HTML 标签
    const text = content
      .replace(/^#+\s+.+$/gm, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\n+/g, ' ')
      .trim()
    
    // 取第一段
    const firstParagraph = text.split(/\n\n/)[0] || text
    if (firstParagraph.length <= maxLength) {
      return firstParagraph
    }
    return firstParagraph.substring(0, maxLength) + '...'
  }

  /**
   * 自动保存到数据库
   */
  const saveToDatabase = async (task: BatchTask, content: string): Promise<string> => {
    try {
      const h1 = extractH1(content) || task.params.scene || task.params.keyword || task.params.title || 'Untitled'
      const title = task.params.title || task.params.scene || task.params.keyword || h1
      const description = extractDescription(content)
      const slug = generateSlugFromText(task.params.keyword || task.params.scene || task.params.title || h1)

      let savedId = ''

      // 根据模板类型保存到不同的表
      if (task.templateId === 'use-case') {
        // 保存到 use_cases 表
        const response = await fetch('/api/admin/use-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            title,
            h1,
            description,
            content,
            use_case_type: task.params.industry === 'marketing' ? 'marketing' 
              : task.params.industry === 'social-media' ? 'social-media'
              : task.params.industry === 'youtube' ? 'youtube'
              : task.params.industry === 'tiktok' ? 'tiktok'
              : task.params.industry === 'product-demo' ? 'product-demo'
              : task.params.industry === 'ads' ? 'ads'
              : task.params.industry === 'education' ? 'education'
              : 'other', // 默认类型
            is_published: true,
            seo_keywords: task.params.keyword ? [task.params.keyword] : [],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `保存失败: HTTP ${response.status}`)
        }

        const data = await response.json()
        savedId = data.useCase?.id || ''
      } else if (task.templateId === 'long-tail-keyword') {
        // 保存到 long_tail_keywords 表
        const response = await fetch('/api/admin/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword: task.params.keyword || title,
            intent: 'information',
            page_slug: slug,
            title,
            h1,
            meta_description: description,
            intro_paragraph: extractDescription(content, 500),
            status: 'published',
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `保存失败: HTTP ${response.status}`)
        }

        const data = await response.json()
        savedId = data.keyword?.id || ''
      } else if (task.templateId === 'blog-post') {
        // 保存到 blog_posts 表
        const response = await fetch('/api/admin/blog-posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            title,
            description,
            h1,
            content,
            is_published: true,
            published_at: new Date().toISOString(),
            seo_keywords: task.params.keyword ? [task.params.keyword] : [],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `保存失败: HTTP ${response.status}`)
        }

        const data = await response.json()
        savedId = data.blogPost?.id || ''
      } else if (task.templateId === 'compare-page') {
        // 保存到 compare_pages 表
        const response = await fetch('/api/admin/compare-pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            title,
            h1,
            description,
            content,
            tool_a_name: task.params.tool_a || 'OpenAI Sora',
            tool_b_name: task.params.tool_b || '',
            is_published: true,
            seo_keywords: task.params.keyword ? [task.params.keyword] : [],
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `保存失败: HTTP ${response.status}`)
        }

        const data = await response.json()
        savedId = data.comparePage?.id || ''
      }

      return savedId
    } catch (error) {
      throw error
    }
  }

  /**
   * 批量生成
   */
  const handleBatchGenerate = async () => {
    if (!csvInput.trim()) {
      onShowBanner('error', '请输入 CSV 数据')
      return
    }

    const rows = parseCSV(csvInput)
    if (rows.length === 0) {
      onShowBanner('error', 'CSV 数据格式错误')
      return
    }

    const template = SEO_CONTENT_TEMPLATES.find((t) => t.id === selectedTemplate)
    if (!template) {
      onShowBanner('error', '请选择模板')
      return
    }

    // 创建任务列表
    const newTasks: BatchTask[] = rows.map((row, index) => ({
      id: `task-${Date.now()}-${index}`,
      templateId: selectedTemplate,
      params: row,
      status: 'pending' as const,
    }))

    setTasks(newTasks)
    setIsProcessing(true)

    // 逐个处理任务
    for (let i = 0; i < newTasks.length; i++) {
      const task = newTasks[i]
      setProcessingIndex(i)

      // 更新任务状态为处理中
      setTasks((prev) => {
        const updated = [...prev]
        updated[i] = { ...updated[i], status: 'processing' }
        return updated
      })

      try {
        const result = await processTask(task)
        
        // 更新任务状态为完成
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'completed', result }
          return updated
        })

        // 如果开启自动保存，保存到数据库
        if (autoSave) {
          try {
            const savedId = await saveToDatabase(task, result)
            setTasks((prev) => {
              const updated = [...prev]
              updated[i] = { ...updated[i], status: 'saved', savedId }
              return updated
            })
          } catch (saveError) {
            console.error('保存失败:', saveError)
            // 保存失败不影响任务状态，仍然标记为完成
          }
        }

        // 添加延迟，避免 API 限流
        if (i < newTasks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误'
        
        // 更新任务状态为失败
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'failed', error: errorMessage }
          return updated
        })
      }
    }

    setIsProcessing(false)
    setProcessingIndex(-1)
    onShowBanner('success', `批量生成完成：${newTasks.filter((t) => t.status === 'completed').length}/${newTasks.length} 成功`)
  }

  /**
   * 导出结果
   */
  const handleExport = () => {
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.result)
    if (completedTasks.length === 0) {
      onShowBanner('error', '没有可导出的内容')
      return
    }

    const exportData = completedTasks.map((task) => ({
      params: task.params,
      content: task.result,
    }))

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-content-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    onShowBanner('success', `已导出 ${completedTasks.length} 条内容`)
  }

  /**
   * 处理文件上传
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvInput(text)
      onShowBanner('success', 'CSV 文件已加载')
    }
    reader.readAsText(file)

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">批量内容生成</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          使用 AI 批量生成 SEO 内容，支持使用场景、长尾词、博客文章等
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>生成配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 模板选择 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              选择模板
            </label>
            <select
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              disabled={isProcessing}
            >
              {SEO_CONTENT_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} - {template.description}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {SEO_CONTENT_TEMPLATES.find((t) => t.id === selectedTemplate)?.description}
            </p>
          </div>

          {/* CSV 输入 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                CSV 数据（第一行为表头）
              </label>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  📁 上传 CSV
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCsvInput(csvExample)}
                  disabled={isProcessing}
                >
                  使用示例
                </Button>
              </div>
            </div>
            <Textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder="粘贴 CSV 数据，第一行为表头..."
              rows={8}
              className="font-mono text-sm"
              disabled={isProcessing}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              提示：CSV 格式，第一行为参数名（如：scene,industry,keyword），后续行为数据
            </p>
          </div>

          {/* 自动保存开关 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="auto-save"
              checked={autoSave}
              onChange={(e) => setAutoSave(e.target.checked)}
              disabled={isProcessing}
              className="h-4 w-4 rounded border-gray-300 text-energy-water focus:ring-energy-water"
            />
            <label htmlFor="auto-save" className="text-sm text-gray-700 dark:text-gray-300">
              自动保存到数据库（生成后自动保存到对应的使用场景/长尾词/博客等模块）
            </label>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <Button
              onClick={handleBatchGenerate}
              disabled={isProcessing || !csvInput.trim()}
              className="flex-1"
            >
              {isProcessing ? `生成中... (${processingIndex + 1}/${tasks.length})` : '🚀 开始批量生成'}
            </Button>
            {tasks.length > 0 && (
              <Button variant="secondary" onClick={handleExport} disabled={isProcessing}>
                📥 导出结果
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 任务列表 */}
      {tasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              生成任务 (
              {tasks.filter((t) => t.status === 'saved' || t.status === 'completed').length}/{tasks.length} 完成
              {autoSave && tasks.filter((t) => t.status === 'saved').length > 0 && (
                <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                  ({tasks.filter((t) => t.status === 'saved').length} 已保存)
                </span>
              )}
              )
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className={`rounded-lg border p-3 ${
                    task.status === 'saved'
                      ? 'border-green-300 bg-green-100 dark:border-green-700 dark:bg-green-900/30'
                      : task.status === 'completed'
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                      : task.status === 'failed'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                      : task.status === 'processing'
                      ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
                      : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          任务 {index + 1}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            task.status === 'saved'
                              ? 'bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100'
                              : task.status === 'completed'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : task.status === 'failed'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : task.status === 'processing'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {task.status === 'saved'
                            ? '✓ 已保存'
                            : task.status === 'completed'
                            ? '✓ 完成'
                            : task.status === 'failed'
                            ? '✗ 失败'
                            : task.status === 'processing'
                            ? '⏳ 处理中'
                            : '⏸ 等待'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {Object.entries(task.params)
                          .filter(([, value]) => value)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(' | ')}
                      </div>
                      {task.error && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          错误: {task.error}
                        </div>
                      )}
                    </div>
                    {task.result && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(task.result || '')
                          onShowBanner('success', '内容已复制到剪贴板')
                        }}
                      >
                        复制
                      </Button>
                    )}
                  </div>
                  {task.result && (
                    <div className="mt-2 max-h-32 overflow-y-auto rounded border border-gray-200 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800">
                      <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {task.result.substring(0, 200)}...
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

