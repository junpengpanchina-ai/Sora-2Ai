'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Textarea } from '@/components/ui'
import {
  KEYWORD_INTENTS,
  KEYWORD_STATUSES,
  KEYWORD_INTENT_LABELS,
  type KeywordIntent,
  type KeywordStatus,
  type KeywordStep,
  type KeywordFaqItem,
} from '@/lib/keywords/schema'
import { parseKeywordText, type ParsedKeywordData } from '@/lib/keywords/text-recognition'
import { createWorker } from 'tesseract.js'

interface AdminKeywordsManagerProps {
  onShowBanner: (type: 'success' | 'error', text: string) => void
}

interface KeywordRecord {
  id: string
  keyword: string
  intent: KeywordIntent
  product: string | null
  service: string | null
  region: string | null
  pain_point: string | null
  search_volume: number | null
  competition_score: number | null
  priority: number
  page_slug: string
  page_style: 'default' | 'christmas' | 'official'
  title: string | null
  meta_description: string | null
  h1: string | null
  intro_paragraph: string | null
  steps: KeywordStep[]
  faq: KeywordFaqItem[]
  status: KeywordStatus
  last_generated_at: string | null
  created_at: string
  updated_at: string
}

type KeywordFormState = {
  keyword: string
  intent: KeywordIntent
  page_style: 'default' | 'christmas' | 'official'
  product: string
  service: string
  region: string
  pain_point: string
  search_volume: string
  competition_score: string
  priority: string
  page_slug: string
  title: string
  meta_description: string
  h1: string
  intro_paragraph: string
  status: KeywordStatus
  steps: KeywordStep[]
  faq: KeywordFaqItem[]
}

const createEmptyStep = (): KeywordStep => ({ title: '', description: '' })
const createEmptyFaq = (): KeywordFaqItem => ({ question: '', answer: '' })

const DEFAULT_FORM_STATE: KeywordFormState = {
  keyword: '',
  intent: 'information',
  page_style: 'default',
  product: '',
  service: '',
  region: '',
  pain_point: '',
  search_volume: '',
  competition_score: '',
  priority: '0',
  page_slug: '',
  title: '',
  meta_description: '',
  h1: '',
  intro_paragraph: '',
  status: 'draft',
  steps: [createEmptyStep()],
  faq: [createEmptyFaq()],
}

const STATUS_BADGE_STYLES: Record<KeywordStatus, string> = {
  published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
}

export default function AdminKeywordsManager({ onShowBanner }: AdminKeywordsManagerProps) {
  const [keywords, setKeywords] = useState<KeywordRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    intent: 'all',
    status: 'all',
    product: '',
    region: '',
    painPoint: '',
  })

  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState<KeywordFormState>(DEFAULT_FORM_STATE)
  const [textRecognitionInput, setTextRecognitionInput] = useState('')
  const [isRecognizing, setIsRecognizing] = useState(false)
  
  // 图片上传和OCR相关状态（支持最多10张图片）
  interface ImageItem {
    file: File
    preview: string
    isProcessing: boolean
    progress: number
    recognizedText?: string
  }
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([])
  const [isProcessingAnyImage, setIsProcessingAnyImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const MAX_IMAGES = 10

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<KeywordFormState>(DEFAULT_FORM_STATE)
  const [updating, setUpdating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const compactSteps = (steps: KeywordStep[]) =>
    steps
      .map((step) => ({
        title: step.title.trim(),
        description: (step.description ?? '').trim(),
      }))
      .filter((step) => step.title || step.description)

  const compactFaq = (faq: KeywordFaqItem[]) =>
    faq
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      }))
      .filter((item) => item.question && item.answer)

  const fetchKeywords = useCallback(
    async (withLoader = false) => {
      try {
        if (withLoader) {
          setFetching(true)
        }
        const params = new URLSearchParams()
        if (filters.search.trim()) params.set('search', filters.search.trim())
        if (filters.intent !== 'all') params.set('intent', filters.intent)
        if (filters.status !== 'all') params.set('status', filters.status)
        if (filters.product.trim()) params.set('product', filters.product.trim())
        if (filters.region.trim()) params.set('region', filters.region.trim())
        if (filters.painPoint.trim()) params.set('pain_point', filters.painPoint.trim())

        const response = await fetch(`/api/admin/keywords?${params.toString()}`)
        const payload = await response.json().catch(() => ({}))

        if (!response.ok || !payload.success) {
          throw new Error(payload.error ?? 'Failed to fetch keywords')
        }

        setKeywords(Array.isArray(payload.keywords) ? payload.keywords : [])
        setError(null)
      } catch (err) {
        console.error('Failed to fetch keywords:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch keywords')
        setKeywords([])
      } finally {
        setLoading(false)
        setFetching(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchKeywords(true)
  }, [fetchKeywords])

  /**
   * 执行文本识别和填充
   */
  const performTextRecognition = useCallback(async (text: string) => {
    if (!text.trim()) {
      return
    }

    setIsRecognizing(true)
    try {
      const parsed = parseKeywordText(text)
      
      // 更新表单字段
      setCreateForm((prev) => {
        const updated: KeywordFormState = { ...prev }
        
        if (parsed.keyword) updated.keyword = parsed.keyword
        if (parsed.intent && KEYWORD_INTENTS.includes(parsed.intent as KeywordIntent)) {
          updated.intent = parsed.intent as KeywordIntent
        }
        if (parsed.page_style) updated.page_style = parsed.page_style
        if (parsed.page_slug) updated.page_slug = parsed.page_slug
        if (parsed.status) updated.status = parsed.status
        if (parsed.product) updated.product = parsed.product
        if (parsed.service) updated.service = parsed.service
        if (parsed.region) updated.region = parsed.region
        if (parsed.pain_point) updated.pain_point = parsed.pain_point
        if (parsed.search_volume) updated.search_volume = parsed.search_volume
        if (parsed.competition_score) updated.competition_score = parsed.competition_score
        if (parsed.priority) updated.priority = parsed.priority
        if (parsed.title) updated.title = parsed.title
        if (parsed.h1) updated.h1 = parsed.h1
        if (parsed.meta_description) updated.meta_description = parsed.meta_description
        if (parsed.intro_paragraph) updated.intro_paragraph = parsed.intro_paragraph
        if (parsed.steps && parsed.steps.length > 0) {
          updated.steps = parsed.steps.map((step) => ({
            title: step.title,
            description: step.description || '',
          }))
        }
        if (parsed.faq && parsed.faq.length > 0) {
          updated.faq = parsed.faq
        }
        
        return updated
      })
      
      // 统计识别到的字段数量
      const recognizedFields = Object.keys(parsed).filter((key) => {
        const value = parsed[key as keyof ParsedKeywordData]
        if (Array.isArray(value)) {
          return value.length > 0
        }
        return value !== undefined && value !== null && value !== ''
      }).length
      
      onShowBanner('success', `Successfully recognized and filled ${recognizedFields} field(s)`)
    } catch (err) {
      console.error('Text recognition failed:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Text recognition failed')
    } finally {
      setIsRecognizing(false)
    }
  }, [onShowBanner])

  /**
   * 处理粘贴事件（支持粘贴多张图片，最多10张）
   */
  useEffect(() => {
    const handlePaste = async (event: ClipboardEvent) => {
      // 检查剪贴板中是否有图片
      const items = event.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      
      // 收集所有图片文件
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          event.preventDefault()
          
          const file = item.getAsFile()
          if (!file) continue

          // 验证文件大小（限制为10MB）
          if (file.size > 10 * 1024 * 1024) {
            onShowBanner('error', `${file.name || '图片'} 大小超过 10MB`)
            continue
          }

          imageFiles.push(file)
        }
      }

      if (imageFiles.length === 0) return

      // 检查是否超过上限
      const remainingSlots = MAX_IMAGES - selectedImages.length
      if (remainingSlots <= 0) {
        onShowBanner('error', `最多只能添加 ${MAX_IMAGES} 张图片`)
        return
      }

      // 只处理剩余槽位数量
      const filesToAdd = imageFiles.slice(0, remainingSlots)
      const newImages: ImageItem[] = []

      for (const file of filesToAdd) {
        // 创建预览
        const reader = new FileReader()
        reader.onloadend = () => {
          const preview = reader.result as string
          setSelectedImages((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((img) => img.file === file)
            if (index >= 0) {
              updated[index] = { ...updated[index], preview }
            }
            return updated
          })
        }
        reader.readAsDataURL(file)

        newImages.push({
          file,
          preview: '',
          isProcessing: false,
          progress: 0,
        })
      }

      if (newImages.length > 0) {
        setSelectedImages((prev) => [...prev, ...newImages])
        onShowBanner('success', `已粘贴 ${newImages.length} 张图片`)
        
        // 注意：自动识别功能已移除，用户需要手动点击识别按钮
        // 这样可以避免在useEffect中调用未定义的函数
      }
    }

    // 添加全局粘贴事件监听
    document.addEventListener('paste', handlePaste)
    
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [performTextRecognition, onShowBanner, selectedImages.length])

  const handleInputChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    field: keyof KeywordFormState,
    value: string
  ) => {
    setter((prev) => ({ ...prev, [field]: value }))
  }

  const handleStepChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    index: number,
    field: keyof KeywordStep,
    value: string
  ) => {
    setter((prev) => {
      const nextSteps = [...prev.steps]
      nextSteps[index] = { ...nextSteps[index], [field]: value }
      return { ...prev, steps: nextSteps }
    })
  }

  const handleFaqChange = (
    setter: React.Dispatch<React.SetStateAction<KeywordFormState>>,
    index: number,
    field: keyof KeywordFaqItem,
    value: string
  ) => {
    setter((prev) => {
      const nextFaq = [...prev.faq]
      nextFaq[index] = { ...nextFaq[index], [field]: value }
      return { ...prev, faq: nextFaq }
    })
  }

  const appendStep = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>) => {
    setter((prev) => ({ ...prev, steps: [...prev.steps, createEmptyStep()] }))
  }

  const appendFaq = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>) => {
    setter((prev) => ({ ...prev, faq: [...prev.faq, createEmptyFaq()] }))
  }

  const removeStep = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>, index: number) => {
    setter((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== index) }))
  }

  const removeFaq = (setter: React.Dispatch<React.SetStateAction<KeywordFormState>>, index: number) => {
    setter((prev) => ({ ...prev, faq: prev.faq.filter((_, i) => i !== index) }))
  }

  const preparePayload = (form: KeywordFormState) => ({
    keyword: form.keyword.trim(),
    intent: form.intent,
    page_style: form.page_style,
    product: form.product.trim(),
    service: form.service.trim(),
    region: form.region.trim(),
    pain_point: form.pain_point.trim(),
    search_volume: form.search_volume.trim(),
    competition_score: form.competition_score.trim(),
    priority: form.priority.trim(),
    pageSlug: form.page_slug.trim(),
    title: form.title.trim(),
    meta_description: form.meta_description.trim(),
    h1: form.h1.trim(),
    intro_paragraph: form.intro_paragraph.trim(),
    status: form.status,
    steps: compactSteps(form.steps),
    faq: compactFaq(form.faq),
  })

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!createForm.keyword.trim()) {
      onShowBanner('error', 'Please enter a keyword')
      return
    }
    setCreating(true)
    try {
      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(createForm)),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Creation failed')
      }
      setCreateForm(DEFAULT_FORM_STATE)
      setKeywords((prev) => [payload.keyword, ...prev])
      onShowBanner('success', 'Keyword created successfully')
    } catch (err) {
      console.error('Failed to create keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to create keyword')
    } finally {
      setCreating(false)
    }
  }

  const startEditing = (record: KeywordRecord) => {
    setEditingId(record.id)
    setEditForm({
      keyword: record.keyword,
      intent: record.intent,
      page_style: record.page_style ?? 'default',
      product: record.product ?? '',
      service: record.service ?? '',
      region: record.region ?? '',
      pain_point: record.pain_point ?? '',
      search_volume: record.search_volume?.toString() ?? '',
      competition_score: record.competition_score?.toString() ?? '',
      priority: record.priority.toString(),
      page_slug: record.page_slug,
      title: record.title ?? '',
      meta_description: record.meta_description ?? '',
      h1: record.h1 ?? '',
      intro_paragraph: record.intro_paragraph ?? '',
      status: record.status,
      steps: record.steps.length ? record.steps : [createEmptyStep()],
      faq: record.faq.length ? record.faq : [createEmptyFaq()],
    })
    // Scroll to edit form after a short delay to allow state update
    setTimeout(() => {
      const editCard = document.getElementById('edit-keyword-card')
      if (editCard) {
        editCard.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingId) return
    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/keywords/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparePayload(editForm)),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Update failed')
      }
      setKeywords((prev) => prev.map((item) => (item.id === editingId ? payload.keyword : item)))
      onShowBanner('success', 'Keyword updated successfully')
      setEditingId(null)
      setEditForm(DEFAULT_FORM_STATE)
    } catch (err) {
      console.error('Failed to update keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to update keyword')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (record: KeywordRecord) => {
    if (!window.confirm(`Are you sure you want to delete "${record.keyword}"?`)) {
      return
    }
    setDeletingId(record.id)
    try {
      const response = await fetch(`/api/admin/keywords/${record.id}`, {
        method: 'DELETE',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'Delete failed')
      }
      setKeywords((prev) => prev.filter((item) => item.id !== record.id))
      if (editingId === record.id) {
        setEditingId(null)
        setEditForm(DEFAULT_FORM_STATE)
      }
      onShowBanner('success', 'Keyword deleted successfully')
    } catch (err) {
      console.error('Failed to delete keyword:', err)
      onShowBanner('error', err instanceof Error ? err.message : 'Failed to delete keyword')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredKeywordCount = useMemo(() => keywords.length, [keywords])

  /**
   * 处理图片上传（支持多张图片，最多10张）
   */
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newImages: ImageItem[] = []
    
    // 检查是否超过上限
    const remainingSlots = MAX_IMAGES - selectedImages.length
    if (remainingSlots <= 0) {
      onShowBanner('error', `最多只能添加 ${MAX_IMAGES} 张图片`)
      return
    }

    // 处理选中的文件（最多处理剩余槽位数量）
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    
    for (const file of filesToProcess) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        onShowBanner('error', `${file.name} 不是图片文件`)
        continue
      }

      // 验证文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        onShowBanner('error', `${file.name} 大小超过 10MB`)
        continue
      }

      // 创建预览
      const reader = new FileReader()
      reader.onloadend = () => {
        const preview = reader.result as string
        setSelectedImages((prev) => {
          const updated = [...prev]
          const index = updated.findIndex((img) => img.file === file)
          if (index >= 0) {
            updated[index] = { ...updated[index], preview }
          }
          return updated
        })
      }
      reader.readAsDataURL(file)

      // 添加新图片项
      newImages.push({
        file,
        preview: '',
        isProcessing: false,
        progress: 0,
      })
    }

    if (newImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...newImages])
      onShowBanner('success', `已添加 ${newImages.length} 张图片`)
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 处理单张图片的OCR识别
   */
  const handleSingleImageOCR = async (imageIndex: number) => {
    if (imageIndex < 0 || imageIndex >= selectedImages.length) return

    const imageItem = selectedImages[imageIndex]
    if (imageItem.isProcessing) return

    // 更新该图片的处理状态
    setSelectedImages((prev) => {
      const updated = [...prev]
      updated[imageIndex] = { ...updated[imageIndex], isProcessing: true, progress: 0 }
      return updated
    })
    setIsProcessingAnyImage(true)
    
    try {
      const languages = 'eng+chi_sim+chi_tra+tha+ara+rus+slv+ron+spa+fra+deu+ita+por+nld+pol+ces+hun+ell+swe+nor+fin+bul'
      
      const worker = await createWorker(languages, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setSelectedImages((prev) => {
              const updated = [...prev]
              updated[imageIndex] = { ...updated[imageIndex], progress: Math.round(m.progress * 100) }
              return updated
            })
          }
        },
      })

      const { data: { text } } = await worker.recognize(imageItem.file)
      await worker.terminate()

      const cleanedText = text.trim()
      
      // 更新图片项的识别文本
      setSelectedImages((prev) => {
        const updated = [...prev]
        updated[imageIndex] = { ...updated[imageIndex], recognizedText: cleanedText, isProcessing: false, progress: 100 }
        return updated
      })

      if (!cleanedText) {
        onShowBanner('error', `图片 ${imageIndex + 1} 未识别到文字`)
        return
      }

      // 合并所有已识别的文本
      const allTexts = selectedImages
        .map((img, idx) => {
          if (idx === imageIndex) return cleanedText
          return img.recognizedText || ''
        })
        .filter((text) => text.trim())
        .join('\n\n')

      setTextRecognitionInput(allTexts)
      
      // 如果有文本，自动执行识别和填充
      if (allTexts.trim()) {
        await performTextRecognition(allTexts)
        onShowBanner('success', `图片 ${imageIndex + 1} 识别成功，共 ${cleanedText.length} 个字符`)
      }
    } catch (err) {
      console.error('OCR recognition failed:', err)
      setSelectedImages((prev) => {
        const updated = [...prev]
        updated[imageIndex] = { ...updated[imageIndex], isProcessing: false, progress: 0 }
        return updated
      })
      onShowBanner('error', err instanceof Error ? err.message : 'OCR recognition failed. Please try again.')
    } finally {
      setIsProcessingAnyImage(selectedImages.some((img, idx) => idx !== imageIndex && img.isProcessing))
    }
  }

  /**
   * 批量处理所有图片的OCR识别
   */
  const handleBatchOCRRecognition = async () => {
    if (selectedImages.length === 0) {
      onShowBanner('error', '请先添加图片')
      return
    }

    setIsProcessingAnyImage(true)
    
    // 按顺序处理所有未识别的图片
    for (let i = 0; i < selectedImages.length; i++) {
      if (!selectedImages[i].recognizedText && !selectedImages[i].isProcessing) {
        await handleSingleImageOCR(i)
      }
    }

    // 合并所有识别结果
    const allTexts = selectedImages
      .map((img) => img.recognizedText || '')
      .filter((text) => text.trim())
      .join('\n\n')

    if (allTexts.trim()) {
      setTextRecognitionInput(allTexts)
      await performTextRecognition(allTexts)
      onShowBanner('success', `已识别 ${selectedImages.filter((img) => img.recognizedText).length} 张图片`)
    }

    setIsProcessingAnyImage(false)
  }

  /**
   * 清除单张图片
   */
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
  }

  /**
   * 清除所有图片
   */
  const handleClearAllImages = () => {
    setSelectedImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * 处理文本识别和自动填充（手动触发）
   */
  const handleTextRecognition = () => {
    if (!textRecognitionInput.trim()) {
      onShowBanner('error', 'Please paste text to recognize')
      return
    }
    performTextRecognition(textRecognitionInput).then(() => {
      // 识别成功后清空输入框
      setTextRecognitionInput('')
    })
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Keyword Page</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 文本识别区域 */}
          <div className="text-recognition-area mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                📋 文本识别自动填充 (Text Recognition & Auto-fill)
              </span>
            </div>
            <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
              支持三种方式：1) 直接粘贴图片（Ctrl+V / Cmd+V）自动识别文字（OCR） 2) 上传图片自动识别文字 3) 直接粘贴文本。系统会自动识别字段并填充表单。支持多语言识别（中文、英文、泰语、印地语、阿拉伯语、俄语、斯洛文尼亚语、罗马尼亚语、西班牙语、法语、德语、意大利语、葡萄牙语、荷兰语、波兰语、捷克语、匈牙利语、希腊语、瑞典语、挪威语、芬兰语等），自动屏蔽各种语言的备注和表单标签。
            </p>
            
            {/* 图片上传区域（支持最多10张） */}
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessingAnyImage || selectedImages.length >= MAX_IMAGES}
                />
                <label
                  htmlFor="image-upload"
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isProcessingAnyImage || selectedImages.length >= MAX_IMAGES
                      ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                      : 'cursor-pointer border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-600 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
                  }`}
                >
                  📷 上传图片 {selectedImages.length > 0 && `(${selectedImages.length}/${MAX_IMAGES})`}
                </label>
                {selectedImages.length > 0 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleBatchOCRRecognition}
                      disabled={isProcessingAnyImage}
                    >
                      {isProcessingAnyImage ? '批量识别中...' : '🔍 批量识别所有图片'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllImages}
                      disabled={isProcessingAnyImage}
                    >
                      ✕ 清除全部
                    </Button>
                  </>
                )}
              </div>
              
              {/* 图片预览网格 */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {selectedImages.map((imageItem, index) => (
                    <div
                      key={index}
                      className="relative rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800"
                    >
                      {/* 图片编号 */}
                      <div className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                        {index + 1}
                      </div>
                      
                      {/* 图片预览 */}
                      {imageItem.preview && (
                        <div className="relative aspect-square w-full overflow-hidden rounded">
                          <Image
                            src={imageItem.preview}
                            alt={`Preview ${index + 1}`}
                            width={200}
                            height={200}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                          {/* 处理进度遮罩 */}
                          {imageItem.isProcessing && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <div className="text-center text-white">
                                <div className="mb-1 text-xs">识别中...</div>
                                <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-700">
                                  <div
                                    className="h-full bg-blue-500 transition-all duration-300"
                                    style={{ width: `${imageItem.progress}%` }}
                                  />
                                </div>
                                <div className="mt-1 text-[10px]">{imageItem.progress}%</div>
                              </div>
                            </div>
                          )}
                          {/* 识别完成标记 */}
                          {imageItem.recognizedText && !imageItem.isProcessing && (
                            <div className="absolute top-1 left-1 rounded bg-green-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                              ✓
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* 操作按钮 */}
                      <div className="mt-2 flex gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleSingleImageOCR(index)}
                          disabled={imageItem.isProcessing || !!imageItem.recognizedText}
                        >
                          {imageItem.isProcessing ? '识别中' : imageItem.recognizedText ? '已识别' : '识别'}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="px-2 text-xs"
                          onClick={() => handleRemoveImage(index)}
                          disabled={imageItem.isProcessing}
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 文本输入区域 */}
            <div className="space-y-2">
              <Textarea
                ref={textAreaRef}
                rows={6}
                value={textRecognitionInput}
                onChange={(event) => setTextRecognitionInput(event.target.value)}
                onPaste={() => {
                  // 粘贴事件由全局监听器处理
                }}
                placeholder="粘贴文本内容或图片（Ctrl+V / Cmd+V），例如：&#10;关键词: Sora2 vs Runway for English Christmas Pantomime videos...&#10;产品: Sora2 AI Video Generator&#10;地区: England, UK&#10;// 中文解释: 这些是中文备注，会被自动过滤"
                className="font-mono text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 支持多语言识别：关键词、产品、服务、地区、标题、H1、元描述等字段，自动过滤各种语言的备注（包括欧洲语言：斯洛文尼亚语、罗马尼亚语、西班牙语、法语、德语、意大利语等）
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleTextRecognition}
                  disabled={isRecognizing || !textRecognitionInput.trim()}
                >
                  {isRecognizing ? '识别中...' : '🔍 识别并填充'}
                </Button>
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleCreate}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  关键词 (keyword)
                </label>
                <Input
                  value={createForm.keyword}
                  onChange={(event) => handleInputChange(setCreateForm, 'keyword', event.target.value)}
                  placeholder="e.g., sora video generator free online"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  意图类型 (intent)
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={createForm.intent}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'intent', event.target.value as KeywordIntent)
                  }
                >
                  {KEYWORD_INTENTS.map((intent) => (
                    <option key={intent} value={intent}>
                      {KEYWORD_INTENT_LABELS[intent]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  页面风格 (page_style)
                </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={createForm.page_style}
                    onChange={(event) =>
                      handleInputChange(setCreateForm, 'page_style', event.target.value as 'default' | 'christmas' | 'official')
                    }
                  >
                    <option value="default">默认风格 (Default)</option>
                    <option value="christmas">圣诞节风格 🎄 (Christmas)</option>
                    <option value="official">官网风格 🌐 (Official Website)</option>
                  </select>
                  {createForm.page_style === 'christmas' && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      💡 圣诞节风格包含动态背景和背景音乐
                    </p>
                  )}
                  {createForm.page_style === 'official' && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      💡 官网风格使用网站官方设计风格
                    </p>
                  )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  URL别名 (page_slug)
                </label>
                <Input
                  value={createForm.page_slug}
                  onChange={(event) => handleInputChange(setCreateForm, 'page_slug', event.target.value)}
                  placeholder="e.g., sora-video-generator-free (会自动添加 keywords- 前缀)"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  状态 (status)
                </label>
                <select
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                  value={createForm.status}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'status', event.target.value as KeywordStatus)
                  }
                >
                  {KEYWORD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status === 'published' ? 'Published' : 'Draft'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  产品 (product)
                </label>
                <Input
                  value={createForm.product}
                  onChange={(event) => handleInputChange(setCreateForm, 'product', event.target.value)}
                  placeholder="e.g., Sora2 Video"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  服务/功能 (service)
                </label>
                <Input
                  value={createForm.service}
                  onChange={(event) => handleInputChange(setCreateForm, 'service', event.target.value)}
                  placeholder="e.g., Online Generator"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  地区 (region)
                </label>
                <Input
                  value={createForm.region}
                  onChange={(event) => handleInputChange(setCreateForm, 'region', event.target.value)}
                  placeholder="e.g., US, UK, Global"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  痛点/场景 (pain_point)
                </label>
                <Input
                  value={createForm.pain_point}
                  onChange={(event) => handleInputChange(setCreateForm, 'pain_point', event.target.value)}
                  placeholder="e.g., Batch Content Creation"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  搜索量 (search_volume)
                </label>
                <Input
                  type="number"
                  value={createForm.search_volume}
                  onChange={(event) => handleInputChange(setCreateForm, 'search_volume', event.target.value)}
                  placeholder="e.g., 90"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  竞争度 (competition_score)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.competition_score}
                  onChange={(event) =>
                    handleInputChange(setCreateForm, 'competition_score', event.target.value)
                  }
                  placeholder="0 - 1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  优先级 (priority)
                </label>
                <Input
                  type="number"
                  value={createForm.priority}
                  onChange={(event) => handleInputChange(setCreateForm, 'priority', event.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  页面标题 (title)
                </label>
                <Input
                  value={createForm.title}
                  onChange={(event) => handleInputChange(setCreateForm, 'title', event.target.value)}
                  placeholder="Page title containing long-tail keyword"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  H1标题 (h1)
                </label>
                <Input
                  value={createForm.h1}
                  onChange={(event) => handleInputChange(setCreateForm, 'h1', event.target.value)}
                  placeholder="Main heading (H1)"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                元描述 (meta_description)
              </label>
              <Textarea
                rows={3}
                value={createForm.meta_description}
                onChange={(event) =>
                  handleInputChange(setCreateForm, 'meta_description', event.target.value)
                }
                placeholder="140-160 characters, naturally includes long-tail keyword"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                介绍段落 (intro_paragraph)
              </label>
              <Textarea
                rows={4}
                value={createForm.intro_paragraph}
                onChange={(event) =>
                  handleInputChange(setCreateForm, 'intro_paragraph', event.target.value)
                }
                placeholder="150-300 words, describes the search intent"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">Steps</label>
                <Button type="button" variant="secondary" size="sm" onClick={() => appendStep(setCreateForm)}>
                  Add Step
                </Button>
              </div>
              {createForm.steps.map((step, index) => {
                // 检查是否是Part标题（以"Part"开头且没有description）
                const isPartTitle = step.title.startsWith('Part ') && !step.description
                
                return (
                  <div key={`create-step-${index}`} className={isPartTitle ? 'col-span-2' : 'grid gap-2 md:grid-cols-2'}>
                    {isPartTitle ? (
                      // Part标题单独一行显示
                      <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-950/30">
                        <Input
                          value={step.title}
                          onChange={(event) => handleStepChange(setCreateForm, index, 'title', event.target.value)}
                          placeholder="Part Title"
                          className="font-semibold text-blue-700 dark:text-blue-300"
                        />
                      </div>
                    ) : (
                      <>
                        <Input
                          value={step.title}
                          onChange={(event) => handleStepChange(setCreateForm, index, 'title', event.target.value)}
                          placeholder={`Step ${index + 1} Title`}
                        />
                        <div className="flex gap-2">
                          <Textarea
                            rows={2}
                            value={step.description ?? ''}
                            onChange={(event) =>
                              handleStepChange(setCreateForm, index, 'description', event.target.value)
                            }
                            placeholder="Description (optional)"
                          />
                          {createForm.steps.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeStep(setCreateForm, index)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">FAQ</label>
                <Button type="button" variant="secondary" size="sm" onClick={() => appendFaq(setCreateForm)}>
                  Add FAQ
                </Button>
              </div>
              {createForm.faq.map((item, index) => (
                <div key={`create-faq-${index}`} className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={item.question}
                    onChange={(event) =>
                      handleFaqChange(setCreateForm, index, 'question', event.target.value)
                    }
                    placeholder={`Question ${index + 1}`}
                  />
                  <div className="flex gap-2">
                    <Textarea
                      rows={2}
                      value={item.answer}
                      onChange={(event) =>
                        handleFaqChange(setCreateForm, index, 'answer', event.target.value)
                      }
                      placeholder="Answer"
                    />
                    {createForm.faq.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeFaq(setCreateForm, index)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? 'Creating...' : 'Create Keyword'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Keywords List</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-energy-water-surface text-energy-water dark:bg-energy-water-muted dark:text-energy-soft">
                Total {filteredKeywordCount} items
              </Badge>
              <Button size="sm" variant="secondary" onClick={() => fetchKeywords(true)} disabled={fetching}>
                {fetching ? 'Refreshing...' : 'Refresh List'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="grid gap-3 md:grid-cols-6"
            onSubmit={(event) => {
              event.preventDefault()
              fetchKeywords(true)
            }}
          >
            <Input
              placeholder="Search keyword/title/URL"
              value={filters.search}
              onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            />
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={filters.intent}
              onChange={(event) => setFilters((prev) => ({ ...prev, intent: event.target.value }))}
            >
              <option value="all">All Intents</option>
              {KEYWORD_INTENTS.map((intent) => (
                <option key={intent} value={intent}>
                  {KEYWORD_INTENT_LABELS[intent]}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <Input
              placeholder="Product"
              value={filters.product}
              onChange={(event) => setFilters((prev) => ({ ...prev, product: event.target.value }))}
            />
            <Input
              placeholder="Region"
              value={filters.region}
              onChange={(event) => setFilters((prev) => ({ ...prev, region: event.target.value }))}
            />
            <Input
              placeholder="Pain Point"
              value={filters.painPoint}
              onChange={(event) => setFilters((prev) => ({ ...prev, painPoint: event.target.value }))}
            />
          </form>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <div className="mr-3 h-6 w-6 animate-spin rounded-full border-b-2 border-energy-water"></div>
              Loading keywords...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-red-500 dark:text-red-400">
              <p>{error}</p>
              <Button variant="secondary" size="sm" onClick={() => fetchKeywords(true)}>
                Reload
              </Button>
            </div>
          ) : keywords.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left">Keyword</th>
                    <th className="py-3 px-4 text-left">Slug</th>
                    <th className="py-3 px-4 text-left">Intent</th>
                    <th className="py-3 px-4 text-left">Region/Product</th>
                    <th className="py-3 px-4 text-left">Priority</th>
                    <th className="py-3 px-4 text-left">Status</th>
                    <th className="py-3 px-4 text-left">Last Updated</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map((keyword) => (
                    <tr
                      key={keyword.id}
                      className="border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {keyword.keyword}
                          </span>
                          <span className="text-xs text-gray-500">{keyword.title ?? '—'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <code className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                          /keywords/{keyword.page_slug}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {KEYWORD_INTENT_LABELS[keyword.intent]}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600 dark:text-gray-300">
                        {keyword.region || '—'}
                        <br />
                        {keyword.product || '—'}
                      </td>
                      <td className="py-3 px-4">{keyword.priority}</td>
                      <td className="py-3 px-4">
                        <Badge className={STATUS_BADGE_STYLES[keyword.status]}>
                          {keyword.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(keyword.updated_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" onClick={() => startEditing(keyword)}>
                              Edit
                            </Button>
                            {keyword.status === 'published' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/keywords/${keyword.page_slug}`, '_blank')}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(keyword)}
                              disabled={deletingId === keyword.id}
                            >
                              {deletingId === keyword.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingId && (
        <Card id="edit-keyword-card">
          <CardHeader>
            <CardTitle>Edit Keyword</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleEditSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    关键词 (keyword)
                  </label>
                  <Input
                    value={editForm.keyword}
                    onChange={(event) => handleInputChange(setEditForm, 'keyword', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    意图类型 (intent)
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.intent}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'intent', event.target.value as KeywordIntent)
                    }
                  >
                    {KEYWORD_INTENTS.map((intent) => (
                      <option key={intent} value={intent}>
                        {KEYWORD_INTENT_LABELS[intent]}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    页面风格 (page_style)
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.page_style}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'page_style', event.target.value as 'default' | 'christmas' | 'official')
                    }
                  >
                    <option value="default">默认风格 (Default)</option>
                    <option value="christmas">圣诞节风格 🎄 (Christmas)</option>
                    <option value="official">官网风格 🌐 (Official Website)</option>
                  </select>
                  {editForm.page_style === 'christmas' && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      💡 圣诞节风格包含动态背景和背景音乐
                    </p>
                  )}
                  {editForm.page_style === 'official' && (
                    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      💡 官网风格使用网站官方设计风格
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    URL别名 (page_slug)
                  </label>
                  <Input
                    value={editForm.page_slug}
                    onChange={(event) => handleInputChange(setEditForm, 'page_slug', event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    状态 (status)
                  </label>
                  <select
                    className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                    value={editForm.status}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'status', event.target.value as KeywordStatus)
                    }
                  >
                    {KEYWORD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status === 'published' ? 'Published' : 'Draft'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    优先级 (priority)
                  </label>
                  <Input
                    type="number"
                    value={editForm.priority}
                    onChange={(event) => handleInputChange(setEditForm, 'priority', event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    产品 (product)
                  </label>
                  <Input
                    value={editForm.product}
                    onChange={(event) => handleInputChange(setEditForm, 'product', event.target.value)}
                    placeholder="e.g., Sora2 Video"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    服务/功能 (service)
                  </label>
                  <Input
                    value={editForm.service}
                    onChange={(event) => handleInputChange(setEditForm, 'service', event.target.value)}
                    placeholder="e.g., Online Generator"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    地区 (region)
                  </label>
                  <Input
                    value={editForm.region}
                    onChange={(event) => handleInputChange(setEditForm, 'region', event.target.value)}
                    placeholder="e.g., US, UK, Global"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    痛点/场景 (pain_point)
                  </label>
                  <Input
                    value={editForm.pain_point}
                    onChange={(event) => handleInputChange(setEditForm, 'pain_point', event.target.value)}
                    placeholder="e.g., Batch Content Creation"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    搜索量 (search_volume)
                  </label>
                  <Input
                    type="number"
                    value={editForm.search_volume}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'search_volume', event.target.value)
                    }
                    placeholder="e.g., 90"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    竞争度 (competition_score)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.competition_score}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'competition_score', event.target.value)
                    }
                    placeholder="0 - 1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    H1标题 (h1)
                  </label>
                  <Input
                    value={editForm.h1}
                    onChange={(event) => handleInputChange(setEditForm, 'h1', event.target.value)}
                    placeholder="Main heading (H1)"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    页面标题 (title)
                  </label>
                  <Textarea
                    rows={2}
                    value={editForm.title}
                    onChange={(event) => handleInputChange(setEditForm, 'title', event.target.value)}
                    placeholder="Page title containing keyword"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    元描述 (meta_description)
                  </label>
                  <Textarea
                    rows={2}
                    value={editForm.meta_description}
                    onChange={(event) =>
                      handleInputChange(setEditForm, 'meta_description', event.target.value)
                    }
                    placeholder="140-160 characters, naturally includes long-tail keyword"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  介绍段落 (intro_paragraph)
                </label>
                <Textarea
                  rows={4}
                  value={editForm.intro_paragraph}
                  onChange={(event) =>
                    handleInputChange(setEditForm, 'intro_paragraph', event.target.value)
                  }
                  placeholder="150-300 words, describes the search intent"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    步骤 (steps)
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => appendStep(setEditForm)}>
                    添加步骤
                  </Button>
                </div>
                {editForm.steps.map((step, index) => {
                  // 检查是否是Part标题（以"Part"开头且没有description）
                  const isPartTitle = step.title.startsWith('Part ') && !step.description
                  
                  return (
                    <div key={`edit-step-${index}`} className={isPartTitle ? 'col-span-2' : 'grid gap-2 md:grid-cols-2'}>
                      {isPartTitle ? (
                        // Part标题单独一行显示
                        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-950/30">
                          <Input
                            value={step.title}
                            onChange={(event) => handleStepChange(setEditForm, index, 'title', event.target.value)}
                            placeholder="Part Title"
                            className="font-semibold text-blue-700 dark:text-blue-300"
                          />
                        </div>
                      ) : (
                        <>
                          <Input
                            value={step.title}
                            onChange={(event) => handleStepChange(setEditForm, index, 'title', event.target.value)}
                            placeholder={`Step ${index + 1} Title`}
                          />
                          <div className="flex gap-2">
                            <Textarea
                              rows={2}
                              value={step.description ?? ''}
                              onChange={(event) =>
                                handleStepChange(setEditForm, index, 'description', event.target.value)
                              }
                            />
                            {editForm.steps.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => removeStep(setEditForm, index)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                    常见问题 (faq)
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={() => appendFaq(setEditForm)}>
                    添加FAQ
                  </Button>
                </div>
                {editForm.faq.map((item, index) => (
                  <div key={`edit-faq-${index}`} className="grid gap-2 md:grid-cols-2">
                    <Input
                      value={item.question}
                      onChange={(event) =>
                        handleFaqChange(setEditForm, index, 'question', event.target.value)
                      }
                      placeholder={`Question ${index + 1}`}
                    />
                    <div className="flex gap-2">
                      <Textarea
                        rows={2}
                        value={item.answer}
                        onChange={(event) =>
                          handleFaqChange(setEditForm, index, 'answer', event.target.value)
                        }
                      />
                      {editForm.faq.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeFaq(setEditForm, index)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditingId(null)} disabled={updating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


