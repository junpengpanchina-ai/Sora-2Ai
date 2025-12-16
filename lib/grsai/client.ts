/**
 * Grsai API 客户端
 * 用于与 Grsai API 进行交互
 * 
 * 安全提示：API Key 必须通过环境变量配置，不能硬编码在代码中
 */

// 获取 Grsai API Key（延迟检查，避免构建时错误）
function getGrsaiApiKey(): string {
  const apiKey = process.env.GRSAI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GRSAI_API_KEY 环境变量未配置。请在 .env.local 文件中设置 GRSAI_API_KEY。'
    )
  }
  return apiKey
}

// 获取 Grsai API 主机地址
function getGrsaiHost(): string {
  return process.env.GRSAI_HOST || 'https://grsai.dakka.com.cn' // 国内直连
}

// 获取 Grsai Chat API 主机地址（使用 api.grsai.com）
function getGrsaiChatHost(): string {
  return 'https://api.grsai.com'
}

export interface SoraVideoRequest {
  model: string
  prompt: string
  url?: string
  aspectRatio?: '9:16' | '16:9'
  duration?: 10 | 15
  size?: 'small' | 'large'
  webHook?: string
  shutProgress?: boolean
}

export interface SoraVideoResponse {
  id: string
  results?: Array<{
    url: string
    removeWatermark: boolean
    pid: string
  }>
  progress: number
  status: 'running' | 'succeeded' | 'failed'
  failure_reason?: 'output_moderation' | 'input_moderation' | 'error'
  error?: string
}

export interface GrsaiTaskIdResponse {
  code: number
  msg: string
  data: {
    id: string
  }
}

export interface GrsaiResultResponse {
  code: number
  msg: string
  data: SoraVideoResponse
}

/**
 * 创建 Sora-2 视频生成任务
 */
export async function createSoraVideoTask(
  params: SoraVideoRequest
): Promise<SoraVideoResponse | GrsaiTaskIdResponse> {
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiHost()
  
  // Log request details for debugging (without sensitive info)
  console.log('[Grsai API] Creating video task:', {
    host,
    model: params.model,
    aspectRatio: params.aspectRatio,
    duration: params.duration,
    size: params.size,
    hasPrompt: !!params.prompt,
    promptLength: params.prompt?.length,
    hasUrl: !!params.url,
    webHook: params.webHook ? (params.webHook === '-1' ? 'polling' : 'webhook') : 'none',
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
  })
  
  const response = await fetch(`${host}/v1/video/sora-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Grsai API 错误: ${response.status}`
    
    // Log full error response for debugging
    console.error('[Grsai API] Request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: `${host}/v1/video/sora-video`,
      errorText,
      headers: Object.fromEntries(response.headers.entries()),
    })
    
    // Try to parse error details if available
    try {
      const errorJson = JSON.parse(errorText)
      console.error('[Grsai API] Parsed error response:', errorJson)
      
      if (errorJson.msg) {
        errorMessage += ` - ${errorJson.msg}`
      } else if (errorJson.error) {
        errorMessage += ` - ${errorJson.error}`
      } else if (errorJson.message) {
        errorMessage += ` - ${errorJson.message}`
      } else {
        errorMessage += ` - ${JSON.stringify(errorJson)}`
      }
    } catch {
      // If not JSON, use raw text
      errorMessage += ` - ${errorText}`
    }
    
    // Add helpful context based on status code
    if (response.status === 401) {
      errorMessage += ' (提示: 请检查 GRSAI_API_KEY 是否正确配置)'
    } else if (response.status === 403) {
      errorMessage += ' (提示: API Key 可能没有权限或已过期)'
    } else if (response.status === 429) {
      errorMessage += ' (提示: API 请求频率过高，请稍后重试)'
    } else if (response.status === 500 || response.status === 502 || response.status === 503) {
      errorMessage += ' (提示: API 服务暂时不可用，请稍后重试)'
    }
    
    throw new Error(errorMessage)
  }
  
  // Log successful response (first 100 chars of prompt for debugging)
  console.log('[Grsai API] Request successful, processing response...')

  // 如果使用 webHook: "-1"，会立即返回 id
  if (params.webHook === '-1') {
    return await response.json() as GrsaiTaskIdResponse
  }

  // 否则返回流式响应或回调
  // 如果是流式响应，需要特殊处理
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('text/event-stream') || contentType?.includes('application/x-ndjson')) {
    // 处理流式响应
    return await handleStreamResponse(response)
  }

  return await response.json() as SoraVideoResponse
}

/**
 * 处理流式响应
 */
async function handleStreamResponse(response: Response): Promise<SoraVideoResponse> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取流式响应')
  }

  const decoder = new TextDecoder()
  let lastChunk: SoraVideoResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as SoraVideoResponse
          lastChunk = data
          
          // 如果任务完成，返回最终结果
          if (data.status === 'succeeded' || data.status === 'failed') {
            return data
          }
        } catch {
          // 忽略解析错误，继续处理下一行
        }
      }
    }
  }

  // 如果没有收到最终结果，返回最后一个块
  if (lastChunk) {
    return lastChunk
  }

  throw new Error('流式响应未返回有效数据')
}

/**
 * 获取任务结果（轮询方式）
 * 根据官网日志，视频生成任务查询应该使用 /v1/draw/result 端点
 */
export async function getTaskResult(taskId: string): Promise<GrsaiResultResponse> {
  // 使用 /v1/draw/result 端点（视频和图片共用）
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiHost()
  const response = await fetch(`${host}/v1/draw/result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ id: taskId }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grsai API 错误: ${response.status} - ${errorText}`)
  }

  return await response.json() as GrsaiResultResponse
}

// ==================== Chat API ====================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionRequest {
  model: string
  stream: boolean
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface ChatCompletionChoice {
  index: number
  message?: {
    role: 'assistant'
    content: string
    refusal: string | null
    annotations: unknown[]
  }
  delta?: {
    role?: 'assistant'
    content?: string
    refusal?: string | null
    annotations?: unknown[]
  }
  finish_reason: string | null
}

export interface ChatCompletionResponse {
  id: string
  object: 'chat.completion'
  created: number
  model: string
  choices: ChatCompletionChoice[]
}

/**
 * 调用 GRSAI Chat API（非流式）
 */
export async function createChatCompletion(
  params: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiChatHost()
  const response = await fetch(`${host}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grsai Chat API 错误: ${response.status} - ${errorText}`)
  }

  return await response.json() as ChatCompletionResponse
}

/**
 * 调用 GRSAI Chat API（流式）
 * 返回一个异步生成器，用于处理流式响应
 */
export async function* createChatCompletionStream(
  params: ChatCompletionRequest
): AsyncGenerator<ChatCompletionResponse, void, unknown> {
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiChatHost()
  const response = await fetch(`${host}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ ...params, stream: true }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Grsai Chat API 错误: ${response.status} - ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取流式响应')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // 保留最后一个不完整的行

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine === 'data: [DONE]') {
          continue
        }

        if (trimmedLine.startsWith('data: ')) {
          try {
            const data = JSON.parse(trimmedLine.slice(6)) as ChatCompletionResponse
            yield data
          } catch (error) {
            // 忽略解析错误，继续处理下一行
            console.warn('解析流式响应失败:', trimmedLine, error)
          }
        }
      }
    }

    // 处理剩余的 buffer
    if (buffer.trim() && buffer.trim() !== 'data: [DONE]') {
      const trimmedLine = buffer.trim()
      if (trimmedLine.startsWith('data: ')) {
        try {
          const data = JSON.parse(trimmedLine.slice(6)) as ChatCompletionResponse
          yield data
        } catch {
          // 忽略解析错误
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

