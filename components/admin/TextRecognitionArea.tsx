'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Button, Textarea } from '@/components/ui'
import { createWorker } from 'tesseract.js'

interface ImageItem {
  file: File
  preview: string
  isProcessing: boolean
  progress: number
  recognizedText?: string
}

interface TextRecognitionAreaProps {
  textInput: string
  onTextInputChange: (text: string) => void
  onRecognize: (text: string) => Promise<void>
  isRecognizing?: boolean
  onShowBanner: (type: 'success' | 'error', text: string) => void
  maxImages?: number
}

const MAX_IMAGES_DEFAULT = 10

export default function TextRecognitionArea({
  textInput,
  onTextInputChange,
  onRecognize,
  isRecognizing = false,
  onShowBanner,
  maxImages = MAX_IMAGES_DEFAULT,
}: TextRecognitionAreaProps) {
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([])
  const [isProcessingAnyImage, setIsProcessingAnyImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

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
        onShowBanner('error', `No text detected in image ${imageIndex + 1}.`)
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

      // 更新文本输入框
      if (allTexts.trim()) {
        onTextInputChange(allTexts)
        onShowBanner('success', `Image ${imageIndex + 1} recognized (${cleanedText.length} characters).`)
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
      onShowBanner('error', 'Please add images first.')
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
      onTextInputChange(allTexts)
      onShowBanner('success', `Recognized ${selectedImages.filter((img) => img.recognizedText).length} images.`)
    }

    setIsProcessingAnyImage(false)
  }

  /**
   * 处理图片选择
   */
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const newImages: ImageItem[] = []
    
    // 检查是否超过上限
    const remainingSlots = maxImages - selectedImages.length
    if (remainingSlots <= 0) {
      onShowBanner('error', `You can add up to ${maxImages} images.`)
      return
    }

    // 处理选中的文件（最多处理剩余槽位数量）
    const filesToProcess = Array.from(files).slice(0, remainingSlots)

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        onShowBanner('error', `${file.name} is not an image file.`)
        continue
      }

      // 验证文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        onShowBanner('error', `${file.name} exceeds 10MB.`)
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

      newImages.push({
        file,
        preview: '',
        isProcessing: false,
        progress: 0,
      })
    }

    if (newImages.length > 0) {
      setSelectedImages((prev) => [...prev, ...newImages])
      onShowBanner('success', `Added ${newImages.length} images.`)
    }

    // 清空文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
   * 处理粘贴事件（支持粘贴多张图片）
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
            onShowBanner('error', `${file.name || 'image'} exceeds 10MB.`)
            continue
          }

          imageFiles.push(file)
        }
      }

      if (imageFiles.length === 0) return

      // 检查是否超过上限
      const remainingSlots = maxImages - selectedImages.length
      if (remainingSlots <= 0) {
        onShowBanner('error', `You can add up to ${maxImages} images.`)
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
        onShowBanner('success', `Pasted ${newImages.length} images.`)
      }
    }

    // 添加全局粘贴事件监听
    document.addEventListener('paste', handlePaste)
    
    return () => {
      document.removeEventListener('paste', handlePaste)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onShowBanner, selectedImages.length, maxImages])

  /**
   * 处理文本识别和自动填充（手动触发）
   */
  const handleTextRecognition = () => {
    if (!textInput.trim()) {
      onShowBanner('error', 'Please paste text or images to recognize.')
      return
    }
    onRecognize(textInput).then(() => {
      // 识别成功后清空输入框
      onTextInputChange('')
    })
  }

  return (
    <div className="text-recognition-area mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          📋 Text Recognition & Auto-fill
        </span>
      </div>
      <p className="mb-3 text-xs text-gray-600 dark:text-gray-400">
        Supported inputs: (1) Paste images (Ctrl+V / Cmd+V) for OCR, (2) Upload images for OCR, (3) Paste plain text.
        The system will detect fields and auto-fill the form. Multi-language OCR is supported, and common notes/labels are filtered out.
      </p>
      
      {/* 图片上传区域 */}
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
            disabled={isProcessingAnyImage || selectedImages.length >= maxImages}
          />
          <label
            htmlFor="image-upload"
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              isProcessingAnyImage || selectedImages.length >= maxImages
                ? 'cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                : 'cursor-pointer border-blue-300 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:border-blue-600 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800'
            }`}
          >
            📷 Upload Images {selectedImages.length > 0 && `(${selectedImages.length}/${maxImages})`}
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
                {isProcessingAnyImage ? 'Batch recognizing...' : '🔍 Recognize all images'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAllImages}
                disabled={isProcessingAnyImage}
              >
                ✕ Clear all
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
                          <div className="mb-1 text-xs">Recognizing...</div>
                          <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-700">
                            <div
                              className="h-full bg-blue-500 transition-all duration-300"
                              style={{ width: `${imageItem.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 识别完成标记 */}
                    {imageItem.recognizedText && !imageItem.isProcessing && (
                      <div className="absolute top-1 left-1 rounded bg-green-500 px-1.5 py-0.5 text-xs font-medium text-white">
                        ✓
                      </div>
                    )}
                  </div>
                )}
                
                {/* 操作按钮 */}
                <div className="mt-2 flex gap-1">
                  {!imageItem.recognizedText && !imageItem.isProcessing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => handleSingleImageOCR(index)}
                      disabled={isProcessingAnyImage}
                    >
                      Recognize
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs"
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
      <div className="mb-3">
        <Textarea
          ref={textAreaRef}
          value={textInput}
          onChange={(e) => onTextInputChange(e.target.value)}
          placeholder="Paste text or images (Ctrl+V / Cmd+V). Example: Title: Best Sora Alternatives... Description: Find the best Sora alternatives... Notes will be filtered automatically."
          className="min-h-[120px] resize-y"
          disabled={isRecognizing || isProcessingAnyImage}
        />
      </div>
      
      {/* 识别按钮 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <span>💡</span>
          <span>
            Multi-language recognition: keywords, product/service, location, title, H1, meta description, etc. Notes in many languages will be filtered automatically.
          </span>
        </div>
        <Button
          type="button"
          onClick={handleTextRecognition}
          disabled={isRecognizing || isProcessingAnyImage || !textInput.trim()}
          className="bg-gray-700 text-white hover:bg-gray-800 dark:bg-gray-600 dark:hover:bg-gray-700"
        >
          {isRecognizing ? 'Recognizing...' : '🔍 Recognize & Fill'}
        </Button>
      </div>
    </div>
  )
}

