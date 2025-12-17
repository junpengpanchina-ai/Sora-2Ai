'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui'
import Link from 'next/link'
import TemplateSelector from './TemplateSelector'

const SUPPORTED_MODELS = [
  { 
    value: 'gemini-2.5-flash', 
    label: 'gemini-2.5-flash ⭐ 推荐 - 大量内容首选',
    price: 'Input: ￥0.1~￥0.2 /M tokens | Output: ￥0.4~￥0.8 /M tokens',
    strategy: '适合：使用场景、对比文章、关键词解释、教程指南等大量内容（占网站 90% 内容）'
  },
  { 
    value: 'gemini-2.5-pro', 
    label: 'gemini-2.5-pro 💎 核心内容',
    price: '价格较高',
    strategy: '适合：首页主框架、重点流量词、顶级 pillar page（5000+ 字）、高竞争关键词、权威内容（全站 10-20 篇）'
  },
  { 
    value: 'gemini-2.5-flash-lite', 
    label: 'gemini-2.5-flash-lite',
    price: 'Input: ￥0.1~￥0.2 /M tokens | Output: ￥0.4~￥0.8 /M tokens',
    strategy: '轻量级模型，适合简单内容'
  },
  { value: 'gemini-3-pro', label: 'gemini-3-pro' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
  { value: 'nano-banana-fast', label: 'nano-banana-fast' },
  { value: 'nano-banana', label: 'nano-banana' },
]

interface Message {
  id: string
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState('gemini-2.5-flash')
  const [systemPrompt, setSystemPrompt] = useState('You are a professional SEO content assistant, specializing in generating high-quality content for use cases, comparisons, and other SEO purposes. All output must be in English.')
  const [showSettings, setShowSettings] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // 聚焦输入框
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // 构建消息列表（包含系统提示词）
      const requestMessages: Array<{ role: string; content: string }> = []
      if (systemPrompt.trim()) {
        requestMessages.push({ role: 'system', content: systemPrompt.trim() })
      }
      // 添加历史消息（排除 system 消息）
      const historyMessages = messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => ({ role: msg.role, content: msg.content }))
      requestMessages.push(...historyMessages)
      // 添加当前用户消息
      requestMessages.push({ role: 'user', content: userMessage.content })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: requestMessages,
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

      // 创建助手消息 ID
      const assistantMessageId = (Date.now() + 1).toString()
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

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
              if (data.choices && data.choices.length > 0) {
                const delta = data.choices[0].delta
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
                      }
                    }
                    return newMessages
                  })
                }
              }
            } catch (error) {
              console.warn('解析流式响应失败:', trimmedLine, error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat API 错误:', error)
      const errorMessage = error instanceof Error ? error.message : '请求失败'
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `错误: ${errorMessage}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages, model, systemPrompt])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = () => {
    setMessages([])
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI 文案助手
            </h1>
            <span className="rounded-full bg-energy-water/10 px-2 py-0.5 text-xs font-medium text-energy-water">
              {model}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
            >
              📝 模板
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              ⚙️ 设置
            </Button>
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              返回首页
            </Link>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-4xl space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                模型选择
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              >
                {SUPPORTED_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              
              {/* 模型策略说明 */}
              {SUPPORTED_MODELS.find(m => m.value === model)?.strategy && (
                <div className="mt-2 rounded-lg bg-green-50 p-3 text-xs text-gray-700 dark:bg-green-900/20 dark:text-gray-300">
                  <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">📌 使用场景：</p>
                  <p>{SUPPORTED_MODELS.find(m => m.value === model)?.strategy}</p>
                </div>
              )}
              
              <div className="mt-2 rounded-lg bg-blue-50 p-3 text-xs text-gray-600 dark:bg-blue-900/20 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-gray-200 mb-1">💡 Token 计费说明：</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>Input tokens</strong>：你发送的内容（问题 + 历史对话 + 系统提示词）</li>
                  <li><strong>Output tokens</strong>：AI 生成回复的内容</li>
                  <li><strong>1M = 100万 tokens</strong></li>
                  {SUPPORTED_MODELS.find(m => m.value === model)?.price && (
                    <li className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                      <strong>当前模型价格：</strong>
                      <div className="mt-1 font-mono text-xs">
                        {SUPPORTED_MODELS.find(m => m.value === model)?.price}
                      </div>
                    </li>
                  )}
                </ul>
              </div>
              
              {/* 最佳策略说明 */}
              <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-gray-700 dark:bg-amber-900/20 dark:text-gray-300">
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">🎯 最佳策略：</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>大量内容（90%）</strong>：使用 <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">gemini-2.5-flash</code></li>
                  <li><strong>核心内容（10%）</strong>：使用 <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">gemini-2.5-pro</code></li>
                  <li>一天产几十至几百篇，成本可控，质量保证</li>
                </ul>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                系统提示词
              </label>
              <textarea
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                placeholder="你是一个专业的 SEO 文案助手..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
                  开始对话
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  输入你的问题，AI 助手会帮助你生成专业的文案内容
                </p>
                <div className="mt-6 space-y-2 text-left">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">示例问题：</p>
                  <button
                    onClick={() => setInput('为"AI 做 YouTube 视频"这个使用场景写一篇 SEO 文案')}
                    className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    💡 为&ldquo;AI 做 YouTube 视频&rdquo;这个使用场景写一篇 SEO 文案
                  </button>
                  <button
                    onClick={() => setInput('写一篇"Sora vs Runway"的对比文案')}
                    className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    💡 写一篇&ldquo;Sora vs Runway&rdquo;的对比文案
                  </button>
                  <button
                    onClick={() => setInput('为长尾词"ai video generator for youtube"写一篇 SEO 页面内容')}
                    className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    💡 为长尾词&ldquo;ai video generator for youtube&rdquo;写一篇 SEO 页面内容
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
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
                        : 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {message.role === 'assistant' && message.content && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content)
                          // 可以添加一个 toast 提示
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
                  <div className="rounded-2xl bg-white px-4 py-3 shadow-sm dark:bg-gray-800">
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
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-end gap-2">
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
              disabled={!input.trim() || isLoading}
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
            按 Cmd/Ctrl + Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <TemplateSelector
          onSelectTemplate={(prompt) => {
            setInput(prompt)
            setShowTemplateSelector(false)
            inputRef.current?.focus()
          }}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}
    </div>
  )
}

