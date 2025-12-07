'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge } from '@/components/ui'

const SUPPORTED_MODELS = [
  { value: 'nano-banana-fast', label: 'nano-banana-fast' },
  { value: 'nano-banana', label: 'nano-banana' },
  { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro' },
  { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash' },
  { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite' },
  { value: 'gpt-4o-all', label: 'gpt-4o-all' },
  { value: 'o4-mini-all', label: 'o4-mini-all' },
  { value: 'gpt-4o-mini', label: 'gpt-4o-mini' },
]

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AdminGrsaiChatManagerProps {
  onShowBanner?: (type: 'success' | 'error', text: string) => void
}

export default function AdminGrsaiChatManager({ onShowBanner }: AdminGrsaiChatManagerProps) {
  const [model, setModel] = useState('gpt-4o-mini')
  const [stream, setStream] = useState(true)
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful assistant.')
  const [userMessage, setUserMessage] = useState('Hello!')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<string>('')
  const [rawResponse, setRawResponse] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const responseRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight
    }
  }, [response])

  const handleSubmit = async () => {
    if (!userMessage.trim()) {
      onShowBanner?.('error', '请输入用户消息')
      return
    }

    setLoading(true)
    setResponse('')
    setRawResponse('')

    try {
      // 构建消息列表
      const requestMessages: ChatMessage[] = []
      if (systemPrompt.trim()) {
        requestMessages.push({ role: 'system', content: systemPrompt.trim() })
      }
      requestMessages.push({ role: 'user', content: userMessage.trim() })

      // 添加历史消息（如果有）
      const allMessages = [...messages, ...requestMessages]

      const response = await fetch('/api/admin/grsai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream,
          messages: allMessages,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      if (stream) {
        // 处理流式响应
        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error('无法读取流式响应')
        }

        const decoder = new TextDecoder()
        let buffer = ''
        let fullContent = ''

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
                    fullContent += delta.content
                    setResponse(fullContent)
                  }
                }
                // 保存原始响应用于显示
                setRawResponse((prev) => prev + trimmedLine + '\n')
              } catch (error) {
                console.warn('解析流式响应失败:', trimmedLine, error)
              }
            }
          }
        }

        // 更新消息历史
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: userMessage.trim() },
          { role: 'assistant', content: fullContent },
        ])
        setUserMessage('')
      } else {
        // 处理非流式响应
        const data = await response.json()
        if (!data.success) {
          throw new Error(data.error || '请求失败')
        }

        const completion = data.data
        if (completion.choices && completion.choices.length > 0) {
          const content = completion.choices[0].message?.content || ''
          setResponse(content)
          setRawResponse(JSON.stringify(completion, null, 2))

          // 更新消息历史
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: userMessage.trim() },
            { role: 'assistant', content },
          ])
          setUserMessage('')
        }
      }

      onShowBanner?.('success', '请求成功')
    } catch (error) {
      console.error('Chat API 错误:', error)
      const errorMessage = error instanceof Error ? error.message : '请求失败'
      setResponse(`错误: ${errorMessage}`)
      onShowBanner?.('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setResponse('')
    setRawResponse('')
    setUserMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GRSAI Chat API 测试</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          测试 GRSAI Chat API，接口地址：https://api.grsai.com/v1/chat/completions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>请求配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              模型 (Model)
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
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={stream}
                onChange={(e) => setStream(e.target.checked)}
                className="rounded"
              />
              流式响应 (Stream)
            </label>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              System Prompt（可选）
            </label>
            <Input
              placeholder="You are a helpful assistant."
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">
              用户消息 (User Message)
            </label>
            <Textarea
              placeholder="输入您的消息..."
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              按 Cmd/Ctrl + Enter 发送
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? '发送中...' : '发送请求'}
            </Button>
            <Button variant="secondary" onClick={handleClear} disabled={loading}>
              清空对话
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 对话历史 */}
      {messages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>对话历史</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-energy-water-surface text-gray-900 dark:bg-energy-water-muted dark:text-gray-100'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                  }`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      className={
                        msg.role === 'user'
                          ? 'bg-energy-water text-white'
                          : 'bg-gray-600 text-white'
                      }
                    >
                      {msg.role === 'user' ? '用户' : '助手'}
                    </Badge>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 当前响应 */}
      {(response || loading) && (
        <Card>
          <CardHeader>
            <CardTitle>当前响应</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              ref={responseRef}
              className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 font-mono text-sm dark:bg-gray-900"
            >
              {loading && !response ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-energy-water"></div>
                  <span>等待响应...</span>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100">
                  {response || '暂无响应'}
                </pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 原始响应 */}
      {rawResponse && (
        <Card>
          <CardHeader>
            <CardTitle>原始响应 (JSON)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
              <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300">
                {rawResponse}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* API 说明 */}
      <Card>
        <CardHeader>
          <CardTitle>API 说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">接口地址：</p>
            <code className="mt-1 block rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              https://api.grsai.com/v1/chat/completions
            </code>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">支持的模型：</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {SUPPORTED_MODELS.map((m) => (
                <Badge key={m.value} variant="secondary">
                  {m.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">请求头：</p>
            <pre className="mt-1 rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800">
              {`{
  "Content-Type": "application/json",
  "Authorization": "Bearer apikey"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

