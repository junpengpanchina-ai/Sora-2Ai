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
  savedTable?: string // 保存到哪个表
  savedSlug?: string // 保存后的 slug
  model?: string // 使用的模型
  showContent?: boolean // 是否显示内容预览
}

export default function AdminBatchContentGenerator({ onShowBanner }: AdminBatchContentGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('use-case')
  const [csvInput, setCsvInput] = useState('')
  const [tasks, setTasks] = useState<BatchTask[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(-1)
  const [autoSave, setAutoSave] = useState(true) // 默认开启自动保存
  const [shouldStop, setShouldStop] = useState(false) // 终止标志
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 预设数据池
  const useCaseScenes = [
    'Fitness Course Video', 'Pet Short Video', 'Amazon Product Video', 'Education Course Video',
    'Marketing Ad Video', 'TikTok Viral Video', 'YouTube Tutorial Video', 'Product Demo Video',
    'Real Estate Tour Video', 'Food Recipe Video', 'Travel Vlog Video', 'Fashion Showcase Video',
    'Tech Product Review', 'Gaming Highlight Video', 'Music Video', 'Corporate Training Video',
    'Event Promotion Video', 'Charity Campaign Video', 'News Summary Video', 'Sports Highlight Video',
    'Beauty Tutorial Video', 'Home Decor Video', 'Car Review Video', 'Book Trailer Video',
    'App Demo Video', 'Website Intro Video', 'Podcast Video', 'Webinar Recording Video',
    'Customer Testimonial Video', 'Brand Story Video', 'Holiday Greeting Video', 'Birthday Video',
    'Wedding Highlight Video', 'Graduation Video', 'Anniversary Video', 'New Product Launch Video',
    'Sale Promotion Video', 'Event Recap Video', 'Behind The Scenes Video', 'Team Introduction Video',
    'Company Culture Video', 'Service Explanation Video', 'FAQ Video', 'How-to Guide Video',
    'Unboxing Video', 'Comparison Video', 'Before After Video', 'Transformation Video',
    'Success Story Video', 'Case Study Video'
  ]

  const industries = [
    'Fitness & Sports', 'Pet Care', 'E-commerce', 'Education', 'Marketing & Advertising',
    'Social Media', 'Entertainment', 'Technology', 'Real Estate', 'Food & Beverage',
    'Travel & Tourism', 'Fashion & Beauty', 'Gaming', 'Music', 'Corporate',
    'Events', 'Charity', 'News & Media', 'Automotive', 'Publishing',
    'Mobile Apps', 'Web Services', 'Healthcare', 'Finance', 'Retail'
  ]

  const keywords = [
    'ai fitness video generator', 'ai pet video maker', 'ai product video creator',
    'ai education video tool', 'ai marketing video generator', 'ai tiktok video maker',
    'ai youtube video generator', 'ai product demo creator', 'ai real estate video tool',
    'ai food video generator', 'ai travel vlog maker', 'ai fashion video creator',
    'ai tech review generator', 'ai gaming video maker', 'ai music video creator',
    'ai corporate training video', 'ai event video generator', 'ai charity video maker',
    'ai news video creator', 'ai sports video generator', 'ai beauty tutorial maker',
    'ai home decor video', 'ai car review generator', 'ai book trailer maker',
    'ai app demo video', 'ai website intro generator', 'ai podcast video maker',
    'ai webinar video creator', 'ai testimonial video', 'ai brand story generator',
    'ai holiday video maker', 'ai birthday video creator', 'ai wedding video generator',
    'ai graduation video maker', 'ai anniversary video', 'ai product launch video',
    'ai sale video generator', 'ai event recap video', 'ai behind scenes video',
    'ai team intro video', 'ai company culture video', 'ai service explanation video',
    'ai faq video generator', 'ai how to video maker', 'ai unboxing video creator',
    'ai comparison video', 'ai before after video', 'ai transformation video',
    'ai success story video', 'ai case study video'
  ]

  const styles = ['realistic', 'cinematic', 'animated', 'commercial', 'educational', 'creative', 'professional', 'casual']

  // 生成随机 CSV 数据
  const generateRandomCSV = (count: number = 50): string => {
    const template = SEO_CONTENT_TEMPLATES.find((t) => t.id === selectedTemplate)
    if (!template) return ''

    const headers = template.parameters.map((p) => p.key).join(',')
    const rows: string[] = []

    for (let i = 0; i < count; i++) {
      const row: string[] = []
      
      template.parameters.forEach((param) => {
        if (param.key === 'scene') {
          row.push(useCaseScenes[i % useCaseScenes.length])
        } else if (param.key === 'industry') {
          row.push(industries[i % industries.length])
        } else if (param.key === 'keyword') {
          row.push(keywords[i % keywords.length])
        } else if (param.key === 'style') {
          row.push(styles[i % styles.length])
        } else if (param.key === 'title') {
          // 为博客文章生成标题
          const titles = [
            'Best AI Video Generator for Creators',
            'How to Create Stunning Videos with AI',
            'AI Video Generation: Complete Guide',
            'Top AI Video Tools for Marketing',
            'Creating Professional Videos with AI',
            'AI Video Maker: Tips and Tricks',
            'Transform Your Content with AI Video',
            'AI Video Generation Made Easy',
            'Master AI Video Creation',
            'AI Video Tools: Everything You Need to Know'
          ]
          row.push(titles[i % titles.length])
        } else if (param.key === 'audience') {
          const audiences = [
            'Content Creators', 'Marketing Professionals', 'Business Owners',
            'Educators', 'Social Media Managers', 'Video Editors', 'Entrepreneurs',
            'Small Business Owners', 'Agencies', 'Freelancers'
          ]
          row.push(audiences[i % audiences.length])
        } else if (param.key === 'tool_a') {
          row.push('OpenAI Sora')
        } else if (param.key === 'tool_b') {
          const tools = ['Runway', 'Pika Labs', 'Luma AI', 'Stable Video', 'Kling AI']
          row.push(tools[i % tools.length])
        } else {
          row.push('')
        }
      })
      
      rows.push(row.join(','))
    }

    return [headers, ...rows].join('\n')
  }

  // CSV 示例（保留原有的）
  const csvExample = `scene,industry,keyword,style
Fitness Course Video,Fitness & Sports,ai fitness video generator,realistic
Pet Short Video,Pet Care,ai pet tiktok video,animated
Amazon Product Video,E-commerce,ai product video generator,commercial
Education Course Video,Education,ai education video generator,educational
Marketing Ad Video,Marketing & Advertising,ai marketing video generator,professional`

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
  const extractH1 = (content: string, fallback?: string): string => {
    // 先尝试提取 H1
    const h1Match = content.match(/^#\s+(.+)$/m) || content.match(/<h1[^>]*>(.+?)<\/h1>/i)
    if (h1Match) {
      return h1Match[1].trim().replace(/<[^>]+>/g, '')
    }
    
    // 如果没有 H1，尝试从 H2 提取（降级处理）
    const h2Match = content.match(/^##\s+(.+)$/m) || content.match(/<h2[^>]*>(.+?)<\/h2>/i)
    if (h2Match) {
      return h2Match[1].trim().replace(/<[^>]+>/g, '')
    }
    
    // 如果还是没有，使用 fallback 或从内容第一行提取
    if (fallback) {
      return fallback
    }
    
    // 尝试从内容第一行提取标题（去除 markdown 格式）
    const firstLine = content.split('\n')[0]?.trim() || ''
    if (firstLine && !firstLine.startsWith('#')) {
      return firstLine.substring(0, 100) // 限制长度
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
   * 验证生成的内容是否符合要求
   */
  const validateContent = (content: string): { valid: boolean; error?: string } => {
    if (!content || content.trim().length < 100) {
      return { valid: false, error: '内容太短（少于100字符）' }
    }

    // 检查是否包含必要的标题
    const hasH1 = /^#\s+.+$/m.test(content) || /<h1[^>]*>.+?<\/h1>/i.test(content)
    if (!hasH1) {
      return { valid: false, error: '缺少 H1 标题' }
    }

    // 检查是否包含必要的结构（至少2个H2）
    const h2Count = (content.match(/^##\s+.+$/gm) || []).length + (content.match(/<h2[^>]*>.+?<\/h2>/gi) || []).length
    if (h2Count < 2) {
      return { valid: false, error: '内容结构不完整（至少需要2个H2）' }
    }

    return { valid: true }
  }

  /**
   * 自动保存到数据库
   */
  const saveToDatabase = async (task: BatchTask, content: string): Promise<{ id: string; table: string; slug: string }> => {
    // 先验证内容
    const validation = validateContent(content)
    if (!validation.valid) {
      throw new Error(validation.error || '内容验证失败')
    }

    try {
      // 优先使用参数中的值作为 fallback
      const fallbackTitle = task.params.title || task.params.scene || task.params.keyword || 'Untitled'
      const h1 = extractH1(content, fallbackTitle) || fallbackTitle
      const title = task.params.title || task.params.scene || task.params.keyword || h1
      const description = extractDescription(content)
      const slug = generateSlugFromText(task.params.keyword || task.params.scene || task.params.title || h1)

      if (!h1 || h1.trim() === '') {
        throw new Error('无法提取 H1 标题，请确保生成的内容包含标题')
      }

      if (!slug) {
        throw new Error('无法生成有效的 slug')
      }

      let savedId = ''
      let savedTable = ''

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
            use_case_type: 'advertising-promotion', // 默认使用广告转化类型
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
        savedTable = 'use_cases'
        
        if (!savedId) {
          throw new Error('保存成功但未返回 ID')
        }
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
        savedTable = 'long_tail_keywords'
        
        if (!savedId) {
          throw new Error('保存成功但未返回 ID')
        }
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
        savedTable = 'blog_posts'
        
        if (!savedId) {
          throw new Error('保存成功但未返回 ID')
        }
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
        savedTable = 'compare_pages'
        
        if (!savedId) {
          throw new Error('保存成功但未返回 ID')
        }
      } else {
        throw new Error(`不支持的模板类型: ${task.templateId}`)
      }

      return { id: savedId, table: savedTable, slug }
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
    setShouldStop(false) // 重置终止标志

    // 逐个处理任务
    for (let i = 0; i < newTasks.length; i++) {
      // 检查是否应该停止
      if (shouldStop) {
        setTasks((prev) => {
          const updated = [...prev]
          // 将未处理的任务标记为已取消
          for (let j = i; j < updated.length; j++) {
            if (updated[j].status === 'pending') {
              updated[j] = { ...updated[j], status: 'failed', error: '已取消' }
            }
          }
          return updated
        })
        break
      }

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
        
        // 更新任务状态为完成（记录使用的模型）
        setTasks((prev) => {
          const updated = [...prev]
          updated[i] = { ...updated[i], status: 'completed', result, model: 'gemini-2.5-flash' }
          return updated
        })

        // 如果开启自动保存，保存到数据库
        if (autoSave) {
          try {
            const saveResult = await saveToDatabase(task, result)
            setTasks((prev) => {
              const updated = [...prev]
              updated[i] = { 
                ...updated[i], 
                status: 'saved', 
                savedId: saveResult.id,
                savedTable: saveResult.table,
                savedSlug: saveResult.slug
              }
              return updated
            })
          } catch (saveError) {
            console.error('保存失败:', saveError)
            const errorMessage = saveError instanceof Error ? saveError.message : '未知错误'
            setTasks((prev) => {
              const updated = [...prev]
              updated[i] = { ...updated[i], error: `保存失败: ${errorMessage}` }
              return updated
            })
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
    setShouldStop(false)
    
    const completedCount = newTasks.filter((t) => t.status === 'completed' || t.status === 'saved').length
    if (shouldStop) {
      onShowBanner('success', `批量生成已终止：已完成 ${completedCount}/${newTasks.length} 个任务`)
    } else {
      onShowBanner('success', `批量生成完成：${completedCount}/${newTasks.length} 成功`)
    }
  }

  /**
   * 终止批量生成
   */
  const handleStop = () => {
    setShouldStop(true)
    onShowBanner('success', '正在停止批量生成，请稍候...')
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
              <div className="flex flex-wrap gap-2">
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
                  📋 使用示例（5条）
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCsvInput(generateRandomCSV(50))}
                  disabled={isProcessing}
                  className="bg-energy-water text-white hover:bg-energy-water/90"
                >
                  ✨ 快速生成 50 条
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCsvInput(generateRandomCSV(100))}
                  disabled={isProcessing}
                >
                  🚀 快速生成 100 条
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
            {!isProcessing ? (
              <Button
                onClick={handleBatchGenerate}
                disabled={!csvInput.trim()}
                className="flex-1"
              >
                🚀 开始批量生成
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="danger"
                className="flex-1"
              >
                ⏹️ 终止生成
              </Button>
            )}
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
              {isProcessing && processingIndex >= 0 && (
                <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                  (正在处理: {processingIndex + 1}/{tasks.length})
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
                    <div className="flex gap-2">
                      {task.result && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updated = [...tasks]
                              updated[index] = { ...updated[index], showContent: !updated[index].showContent }
                              setTasks(updated)
                            }}
                          >
                            {task.showContent ? '👁️ 隐藏内容' : '👁️ 查看内容'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(task.result || '')
                              onShowBanner('success', '内容已复制到剪贴板')
                            }}
                          >
                            📋 复制
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {/* 内容预览 */}
                  {task.result && (
                    <div className="mt-3">
                      {task.showContent ? (
                        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 text-sm dark:border-gray-700 dark:bg-gray-800">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              生成的内容预览（完整）
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {task.result.length} 字符
                            </span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                            {task.result}
                          </pre>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs dark:border-gray-700 dark:bg-gray-800/50">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">内容预览（前200字符）</span>
                            <span className="text-gray-500 dark:text-gray-500">
                              {task.result.length} 字符
                            </span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                            {task.result.substring(0, 200)}
                            {task.result.length > 200 && '...'}
                          </pre>
                          <button
                            onClick={() => {
                              const updated = [...tasks]
                              updated[index] = { ...updated[index], showContent: true }
                              setTasks(updated)
                            }}
                            className="mt-2 text-xs text-energy-water hover:underline"
                          >
                            点击展开查看完整内容 →
                          </button>
                        </div>
                      )}
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

