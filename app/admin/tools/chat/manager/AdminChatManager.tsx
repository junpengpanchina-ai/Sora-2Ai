'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button, Badge } from '@/components/ui'
import { getModelDescription } from '@/lib/admin-chat/model-selector'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  model?: string
  created_at?: string
}

interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface AdminChatManagerProps {
  onShowBanner?: (type: 'success' | 'error', text: string) => void
}

export default function AdminChatManager({ onShowBanner }: AdminChatManagerProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 加载会话列表
  const loadSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/sessions')
      const data = await response.json()
      if (data.success) {
        setSessions(data.data || [])
        // 如果有会话，默认选择第一个
        if (data.data && data.data.length > 0 && !currentSessionId) {
          setCurrentSessionId(data.data[0].id)
        }
      }
    } catch (error) {
      console.error('加载会话列表失败:', error)
    }
  }, [currentSessionId])

  // 加载消息列表
  const loadMessages = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/messages?sessionId=${sessionId}`)
      const data = await response.json()
      if (data.success) {
        setMessages(data.data || [])
      }
    } catch (error) {
      console.error('加载消息列表失败:', error)
    }
  }, [])

  // 创建新会话
  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '新对话' }),
      })
      const data = await response.json()
      if (data.success) {
        await loadSessions()
        setCurrentSessionId(data.data.id)
        setMessages([])
        setInput('')
        setImages([])
      }
    } catch (error) {
      console.error('创建会话失败:', error)
      onShowBanner?.('error', '创建会话失败')
    }
  }, [loadSessions, onShowBanner])

  // 删除会话
  const deleteSession = useCallback(async (sessionId: string) => {
    if (!confirm('确定要删除这个会话吗？')) return

    try {
      const response = await fetch(`/api/admin/chat/sessions?id=${sessionId}`, {
        method: 'DELETE',
      })
      const data = await response.json()
      if (data.success) {
        await loadSessions()
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null)
          setMessages([])
        }
        onShowBanner?.('success', '会话已删除')
      }
    } catch (error) {
      console.error('删除会话失败:', error)
      onShowBanner?.('error', '删除会话失败')
    }
  }, [currentSessionId, loadSessions, onShowBanner])

  // 初始化
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // 当会话切换时，加载消息
  useEffect(() => {
    if (currentSessionId) {
      loadMessages(currentSessionId)
    } else {
      setMessages([])
    }
  }, [currentSessionId, loadMessages])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: string[] = []
    const fileArray = Array.from(files)

    fileArray.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const base64 = event.target?.result as string
          newImages.push(base64)
          if (newImages.length === fileArray.length) {
            setImages((prev) => [...prev, ...newImages])
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  // 移除图片
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // 发送消息
  const handleSend = useCallback(async () => {
    if ((!input.trim() && images.length === 0) || isLoading) return

    // 如果没有会话，先创建一个
    let sessionId = currentSessionId
    if (!sessionId) {
      try {
        const response = await fetch('/api/admin/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: input.substring(0, 50) || '新对话' }),
        })
        const data = await response.json()
        if (data.success) {
          sessionId = data.data.id
          setCurrentSessionId(sessionId)
          await loadSessions()
        } else {
          throw new Error('创建会话失败')
        }
      } catch (error) {
        console.error('创建会话失败:', error)
        onShowBanner?.('error', '创建会话失败')
        return
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      images: images.length > 0 ? [...images] : undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setImages([])
    setIsLoading(true)

    // 创建助手消息占位符
    const assistantMessageId = (Date.now() + 1).toString()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input.trim(),
          images: images,
          stream: true,
          saveHistory: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法读取流式响应')
      }

      const decoder = new TextDecoder()
      let buffer = ''
      let assistantContent = ''
      let detectedModel: string | null = null

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || trimmedLine === 'data: [DONE]') {
            continue
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmedLine.slice(6))
              
              // 🔥 调试：记录前几个chunk的详细信息
              if (assistantContent.length === 0) {
                console.log('[Admin Chat Client] 第一个chunk:', {
                  hasError: !!data.error,
                  hasChoices: !!data.choices,
                  choicesLength: data.choices?.length || 0,
                  hasDelta: !!data.choices?.[0]?.delta,
                  hasContent: !!data.choices?.[0]?.delta?.content,
                  finishReason: data.choices?.[0]?.finish_reason,
                  model: data.model,
                  fullData: JSON.stringify(data, null, 2),
                })
              }
              
              // 检查API返回的错误
              if (data.error) {
                const errorMessage = data.error.message || data.error.code || 'API返回错误'
                const errorType = data.error.type || data.error.finishReason || 'unknown'
                console.error('[Admin Chat] API错误:', {
                  message: errorMessage,
                  type: errorType,
                  fullError: data.error,
                })
                
                // 如果是内容被过滤，显示更友好的错误信息
                if (errorType === 'content_filter' || errorType === 'safety' || data.error.finishReason) {
                  throw new Error(`内容被过滤，请尝试修改消息内容或使用不同的表达方式`)
                }
                
                throw new Error(errorMessage)
              }
              
              // 检测使用的模型
              if (data.model && !detectedModel) {
                detectedModel = data.model
                console.log('[Admin Chat Client] 检测到模型:', data.model)
              }
              
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta
                const finishReason = data.choices[0].finish_reason
                
                // 检查是否被拒绝或过滤
                if (finishReason === 'content_filter' || finishReason === 'safety') {
                  throw new Error('内容被过滤或拒绝，请尝试修改消息内容')
                }
                
                if (delta?.content) {
                  assistantContent += delta.content
                  // 更新最后一条消息
                  setMessages((prev) => {
                    const newMessages = [...prev]
                    const lastIndex = newMessages.length - 1
                    if (lastIndex >= 0 && newMessages[lastIndex].id === assistantMessageId) {
                      newMessages[lastIndex] = {
                        ...newMessages[lastIndex],
                        content: assistantContent,
                        model: detectedModel || undefined,
                      }
                    }
                    return newMessages
                  })
                } else if (delta && Object.keys(delta).length > 0) {
                  // 🔥 调试：记录有delta但没有content的情况
                  console.warn('[Admin Chat Client] Delta无content:', delta, 'finishReason:', finishReason)
                }
              } else {
                // 🔥 调试：记录没有choices的情况
                console.warn('[Admin Chat Client] 无choices:', data)
              }
            } catch (error) {
              // 如果是API错误，抛出以便外层处理
              if (error instanceof Error && (error.message.includes('API') || error.message.includes('内容被过滤'))) {
                throw error
              }
              console.warn('解析流式响应失败:', trimmedLine, error)
            }
          }
        }
      }

      // 🔥 调试：检查最终内容
      if (assistantContent.length === 0) {
        console.error('[Admin Chat Client] ⚠️⚠️⚠️ 流式响应完成但内容为空！', {
          detectedModel,
          totalChunks: assistantContent.length,
        })
        throw new Error('AI没有返回任何内容，请检查服务器日志')
      }
      
      console.log('[Admin Chat Client] 流式响应完成:', {
        contentLength: assistantContent.length,
        model: detectedModel,
      })

      // 重新加载消息以确保数据库同步
      if (sessionId) {
        await loadMessages(sessionId)
      }

      onShowBanner?.('success', '消息已发送')
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage = error instanceof Error ? error.message : '请求失败'
      
      // 更新错误消息
      setMessages((prev) => {
        const newMessages = [...prev]
        const lastIndex = newMessages.length - 1
        if (lastIndex >= 0 && newMessages[lastIndex].id === assistantMessageId) {
          newMessages[lastIndex] = {
            ...newMessages[lastIndex],
            content: `错误: ${errorMessage}`,
          }
        }
        return newMessages
      })
      
      onShowBanner?.('error', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [input, images, isLoading, currentSessionId, loadMessages, onShowBanner])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setInput('')
    setImages([])
  }

  return (
    <div className="flex h-[calc(100vh-200px)] gap-4">
      {/* 左侧会话列表 */}
      <div className="w-64 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <Button onClick={createNewSession} className="w-full" size="sm">
            + 新对话
          </Button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-80px)]">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`p-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                currentSessionId === session.id ? 'bg-energy-water-surface dark:bg-energy-water-muted' : ''
              }`}
              onClick={() => setCurrentSessionId(session.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {session.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(session.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSession(session.id)
                  }}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  开始对话
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  输入你的问题，AI 助手会帮助你。支持上传多张图片进行分析。
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-energy-water text-white">
                      AI
                    </div>
                  )}
                  <div
                    className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-energy-water text-white'
                        : 'bg-gray-100 text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    {/* 显示图片 */}
                    {message.images && message.images.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {message.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Uploaded ${idx + 1}`}
                            className="max-w-xs rounded-lg"
                          />
                        ))}
                      </div>
                    )}
                    
                    {/* 显示模型信息 */}
                    {message.model && message.role === 'assistant' && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {message.model}
                        </Badge>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {getModelDescription(message.model)}
                        </span>
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content || '...'}
                    </div>
                    
                    {message.role === 'assistant' && message.content && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                          onShowBanner?.('success', '已复制到剪贴板')
                        }}
                        className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                        title="复制"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                      你
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-energy-water text-white">
                    AI
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 shadow-sm dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
          {/* 图片预览 */}
          {images.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img}
                    alt={`Preview ${idx + 1}`}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 text-white p-1 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              📷
            </Button>
            <div className="flex-1 rounded-lg border border-gray-300 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="输入你的问题... (Cmd/Ctrl + Enter 发送)"
                className="w-full resize-none border-0 bg-transparent px-4 py-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none dark:text-gray-100 dark:placeholder-gray-400"
                rows={1}
                style={{
                  minHeight: '52px',
                  maxHeight: '200px',
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`
                }}
              />
            </div>
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && images.length === 0) || isLoading}
              className="h-12 px-6"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                '发送'
              )}
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                onClick={handleClear}
                disabled={isLoading}
                className="h-12"
              >
                清空
              </Button>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            按 Cmd/Ctrl + Enter 发送，Shift + Enter 换行。支持上传多张图片进行分析。
          </p>
        </div>
      </div>
    </div>
  )
}

