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
export function getGrsaiChatHost(): string {
  return 'https://api.grsai.com'
}

/**
 * 🔥 错误分类和处理
 * 根据错误类型决定是否重试、重试延迟和错误消息
 */
function classifyApiError(
  status: number,
  errorText: string,
  retryCount: number,
  maxRetries: number
): {
  shouldRetry: boolean
  retryDelay: number
  errorMessage: string
  message: string
} {
  // 速率限制（429）- 应该等待后重试
  if (status === 429) {
    const retryDelay = Math.min(5000 * Math.pow(2, retryCount), 30000) // 5s, 10s, 20s, 30s
    return {
      shouldRetry: retryCount < maxRetries,
      retryDelay,
      errorMessage: `API 请求频率过高（429），已重试 ${retryCount + 1} 次，请稍后重试`,
      message: 'API 速率限制',
    }
  }
  
  // 服务器错误（5xx）- 可以重试
  if (status >= 500 && status < 600) {
    const retryDelay = status === 500 
      ? Math.min(4000 * Math.pow(2, retryCount), 20000) // 500错误：4s, 8s, 16s, 20s
      : Math.min(2000 * Math.pow(2, retryCount), 10000) // 其他5xx：2s, 4s, 8s, 10s
    return {
      shouldRetry: retryCount < maxRetries,
      retryDelay,
      errorMessage: `API 服务器错误（${status}），已重试 ${retryCount + 1} 次，请稍后重试`,
      message: `服务器错误 ${status}`,
    }
  }
  
  // 认证错误（401, 403）- 不应该重试
  if (status === 401 || status === 403) {
    let errorMessage = `Grsai Chat API 错误: ${status}`
    try {
      const errorJson = JSON.parse(errorText)
      if (errorJson.error?.message) {
        errorMessage += ` - ${errorJson.error.message}`
      } else if (errorJson.message) {
        errorMessage += ` - ${errorJson.message}`
      }
    } catch {
      errorMessage += ` - ${errorText.substring(0, 200)}`
    }
    
    if (status === 401) {
      errorMessage += ' (提示: 请检查 GRSAI_API_KEY 是否正确配置)'
    } else {
      errorMessage += ' (提示: API Key 可能没有权限或已过期)'
    }
    
    return {
      shouldRetry: false,
      retryDelay: 0,
      errorMessage,
      message: '认证错误',
    }
  }
  
  // 其他错误（4xx）- 根据具体情况决定
  let errorMessage = `Grsai Chat API 错误: ${status}`
  try {
    const errorJson = JSON.parse(errorText)
    if (errorJson.error?.message) {
      errorMessage += ` - ${errorJson.error.message}`
    } else if (errorJson.message) {
      errorMessage += ` - ${errorJson.message}`
    } else {
      errorMessage += ` - ${errorText.substring(0, 200)}`
    }
  } catch {
    errorMessage += ` - ${errorText.substring(0, 200)}`
  }
  
  // 400 错误通常不应该重试（请求格式错误）
  return {
    shouldRetry: false,
    retryDelay: 0,
    errorMessage,
    message: `客户端错误 ${status}`,
  }
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

export interface VeoVideoRequest {
  model: 'veo3.1-fast' | 'veo3.1-pro' | 'veo3-fast' | 'veo3-pro'
  prompt: string
  firstFrameUrl?: string
  lastFrameUrl?: string
  urls?: string[] // 参考图片URL数组，最多3张
  aspectRatio?: '16:9' | '9:16'
  webHook?: string
  shutProgress?: boolean
}

export interface VeoVideoResponse {
  id: string
  url?: string
  progress: number
  status: 'running' | 'succeeded' | 'failed'
  failure_reason?: 'output_moderation' | 'input_moderation' | 'error'
  error?: string
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
 * 创建 Sora-2 视频生成任务（带重试机制）
 */
export async function createSoraVideoTask(
  params: SoraVideoRequest,
  retryCount = 0
): Promise<SoraVideoResponse | GrsaiTaskIdResponse> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 * (retryCount + 1) // 递增延迟：1s, 2s, 3s
  const TIMEOUT = 60000 // 60秒超时（增加超时时间）
  
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiHost()
  
  // Log request details for debugging (without sensitive info)
  if (retryCount === 0) {
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
  } else {
    console.log(`[Grsai API] Retrying video task (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      host,
      retryCount,
      delay: RETRY_DELAY,
    })
  }
  
  // 添加超时控制（60秒）
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  let response: Response
  try {
    response = await fetch(`${host}/v1/video/sora-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
      // 添加 keepalive 选项，保持连接
      keepalive: true,
    })
    clearTimeout(timeoutId)
  } catch (fetchError) {
    clearTimeout(timeoutId)
    
    // 如果是网络错误且还有重试次数，进行重试
    const isNetworkError = fetchError instanceof Error && (
      fetchError.name === 'AbortError' ||
      fetchError.message.includes('fetch failed') ||
      fetchError.message.includes('ECONNREFUSED') ||
      fetchError.message.includes('ENOTFOUND') ||
      fetchError.message.includes('getaddrinfo') ||
      fetchError.message.includes('ECONNRESET') ||
      fetchError.message.includes('socket hang up')
    )
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai API] Network error detected, retrying in ${RETRY_DELAY}ms...`, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
      })
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return createSoraVideoTask(params, retryCount + 1)
    }
    
    // 处理网络错误（不再重试）
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`Grsai API 请求超时（${TIMEOUT / 1000}秒），请检查网络连接或稍后重试`)
      } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error('Grsai API 连接失败，请检查网络连接或 API 服务是否可用')
      } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
        throw new Error('Grsai API 域名解析失败，请检查网络连接')
      } else if (fetchError.message.includes('ECONNRESET') || fetchError.message.includes('socket hang up')) {
        throw new Error('Grsai API 连接被重置，可能是网络不稳定，请稍后重试')
      }
    }
    
    throw new Error(`Grsai API 请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`)
  }

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

/**
 * 创建 Veo 视频生成任务（带重试机制）
 * 支持 veo3.1-fast, veo3.1-pro, veo3-fast, veo3-pro
 */
export async function createVeoVideoTask(
  params: VeoVideoRequest,
  retryCount = 0
): Promise<VeoVideoResponse | GrsaiTaskIdResponse> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 * (retryCount + 1) // 递增延迟：1s, 2s, 3s
  const TIMEOUT = 60000 // 60秒超时
  
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiHost()
  
  // Log request details for debugging (without sensitive info)
  if (retryCount === 0) {
    console.log('[Grsai API] Creating Veo video task:', {
      host,
      model: params.model,
      aspectRatio: params.aspectRatio,
      hasPrompt: !!params.prompt,
      promptLength: params.prompt?.length,
      hasFirstFrame: !!params.firstFrameUrl,
      hasLastFrame: !!params.lastFrameUrl,
      referenceUrlsCount: params.urls?.length || 0,
      webHook: params.webHook ? (params.webHook === '-1' ? 'polling' : 'webhook') : 'none',
      apiKeyPrefix: apiKey.substring(0, 10) + '...',
    })
  } else {
    console.log(`[Grsai API] Retrying Veo video task (attempt ${retryCount + 1}/${MAX_RETRIES}):`, {
      host,
      retryCount,
      delay: RETRY_DELAY,
    })
  }
  
  // 添加超时控制（60秒）
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  let response: Response
  try {
    response = await fetch(`${host}/v1/video/veo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(params),
      signal: controller.signal,
      keepalive: true,
    })
    clearTimeout(timeoutId)
  } catch (fetchError) {
    clearTimeout(timeoutId)
    
    // 如果是网络错误且还有重试次数，进行重试
    const isNetworkError = fetchError instanceof Error && (
      fetchError.name === 'AbortError' ||
      fetchError.message.includes('fetch failed') ||
      fetchError.message.includes('ECONNREFUSED') ||
      fetchError.message.includes('ENOTFOUND') ||
      fetchError.message.includes('getaddrinfo') ||
      fetchError.message.includes('ECONNRESET') ||
      fetchError.message.includes('socket hang up')
    )
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai API] Network error detected, retrying in ${RETRY_DELAY}ms...`, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
      })
      
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return createVeoVideoTask(params, retryCount + 1)
    }
    
    // 处理网络错误（不再重试）
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`Grsai Veo API 请求超时（${TIMEOUT / 1000}秒），请检查网络连接或稍后重试`)
      } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error('Grsai Veo API 连接失败，请检查网络连接或 API 服务是否可用')
      } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
        throw new Error('Grsai Veo API 域名解析失败，请检查网络连接')
      } else if (fetchError.message.includes('ECONNRESET') || fetchError.message.includes('socket hang up')) {
        throw new Error('Grsai Veo API 连接被重置，可能是网络不稳定，请稍后重试')
      }
    }
    
    throw new Error(`Grsai Veo API 请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`)
  }

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `Grsai Veo API 错误: ${response.status}`
    
    // Log full error response for debugging
    console.error('[Grsai API] Veo request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: `${host}/v1/video/veo`,
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
  
  // Log successful response
  console.log('[Grsai API] Veo request successful, processing response...')

  // 如果使用 webHook: "-1"，会立即返回 id
  if (params.webHook === '-1') {
    return await response.json() as GrsaiTaskIdResponse
  }

  // 否则返回流式响应或回调
  // 如果是流式响应，需要特殊处理
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('text/event-stream') || contentType?.includes('application/x-ndjson')) {
    // 处理流式响应
    return await handleVeoStreamResponse(response)
  }

  return await response.json() as VeoVideoResponse
}

/**
 * 处理 Veo 流式响应
 */
async function handleVeoStreamResponse(response: Response): Promise<VeoVideoResponse> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取流式响应')
  }

  const decoder = new TextDecoder()
  let lastChunk: VeoVideoResponse | null = null

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6)) as VeoVideoResponse
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
  tools?: Array<{
    type: 'google_search_retrieval'
  }>
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
  error?: {
    message?: string
    type?: string
    code?: string
    [key: string]: unknown
  }
}

interface InvalidChunkInfo {
  chunk: ChatCompletionResponse
  rawLine: string
  chunkNumber: number
}

/**
 * 调用 GRSAI Chat API（非流式，带重试机制）
 */
export async function createChatCompletion(
  params: ChatCompletionRequest,
  retryCount = 0
): Promise<ChatCompletionResponse> {
  const MAX_RETRIES = 3
  // 🔥 使用指数退避重试延迟：1s, 2s, 4s, 8s（最大 10s）
  const RETRY_DELAY = Math.min(1000 * Math.pow(2, retryCount), 10000)
  
  // 🔥 根据模型类型调整超时时间
  const getTimeout = (model: string): number => {
    if (model.includes('gemini-3-pro')) return 120000 // 120 秒
    if (model.includes('gemini-3-flash')) return 90000 // 90 秒
    return 60000 // 60 秒（默认，gemini-2.5-flash）
  }
  
  const TIMEOUT = getTimeout(params.model)
  
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiChatHost()
  
  if (retryCount > 0) {
    console.log(`[Grsai Chat API] 重试请求 (尝试 ${retryCount + 1}/${MAX_RETRIES}):`, {
      host,
      model: params.model,
      retryCount,
      delay: RETRY_DELAY,
      timeout: TIMEOUT,
    })
  }
  
  // 🔥 双重超时保护：使用 AbortController + Promise.race
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  let response: Response
  try {
    // 🔥 使用速率限制器（避免触发 429 错误）
    const { rateLimiter } = await import('./rate-limiter')
    
    // 🔥 使用 Promise.race 确保超时控制
    const fetchPromise = rateLimiter.execute(() =>
      fetch(`${host}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(params),
        signal: controller.signal,
        keepalive: true,
      })
    )
    
    // 双重超时保护：如果 AbortController 失效，Promise.race 会捕获
    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`请求超时（${TIMEOUT / 1000}秒）`)), TIMEOUT)
    )
    
    response = await Promise.race([fetchPromise, timeoutPromise])
    clearTimeout(timeoutId)
  } catch (fetchError) {
    clearTimeout(timeoutId)
    
    // 如果是网络错误且还有重试次数，进行重试
    const isNetworkError = fetchError instanceof Error && (
      fetchError.name === 'AbortError' ||
      fetchError.message.includes('fetch failed') ||
      fetchError.message.includes('ECONNREFUSED') ||
      fetchError.message.includes('ENOTFOUND') ||
      fetchError.message.includes('getaddrinfo') ||
      fetchError.message.includes('ECONNRESET') ||
      fetchError.message.includes('socket hang up')
    )
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai Chat API] 网络错误，${RETRY_DELAY}ms 后重试...`, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
      })
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return createChatCompletion(params, retryCount + 1)
    }
    
    // 处理网络错误（不再重试）
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`Grsai Chat API 请求超时（${TIMEOUT / 1000}秒），请检查网络连接或稍后重试`)
      } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error('Grsai Chat API 连接失败，请检查网络连接或 API 服务是否可用')
      } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
        throw new Error('Grsai Chat API 域名解析失败，请检查网络连接')
      } else if (fetchError.message.includes('ECONNRESET') || fetchError.message.includes('socket hang up')) {
        throw new Error('Grsai Chat API 连接被重置，可能是网络不稳定，请稍后重试')
      }
    }
    
    throw new Error(`Grsai Chat API 请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`)
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Grsai Chat API] 请求失败:', {
      status: response.status,
      statusText: response.statusText,
      url: `${host}/v1/chat/completions`,
      errorText,
      model: params.model,
      messagesCount: params.messages.length,
      retryCount,
    })
    
    // 🔥 智能错误分类和处理
    const errorClassification = classifyApiError(response.status, errorText, retryCount, MAX_RETRIES)
    
    if (errorClassification.shouldRetry && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai Chat API] ${errorClassification.message}，${errorClassification.retryDelay}ms 后重试 (${retryCount + 1}/${MAX_RETRIES})...`)
      await new Promise(resolve => setTimeout(resolve, errorClassification.retryDelay))
      return createChatCompletion(params, retryCount + 1)
    }
    
    throw new Error(errorClassification.errorMessage)
  }

  const data = await response.json() as ChatCompletionResponse
  
  // 🔥 检查响应是否有效，避免浪费积分
  if (!data.choices || data.choices.length === 0) {
    console.error('[Grsai Chat API] ⚠️⚠️⚠️ 严重问题：API 返回空 choices 数组！完整响应:', JSON.stringify(data, null, 2))
    throw new Error('API 返回空 choices 数组，可能请求被拒绝或格式错误')
  }
  
  if (!data.choices[0]?.message?.content) {
    console.error('[Grsai Chat API] ⚠️⚠️⚠️ 严重问题：API 返回空 content！完整响应:', JSON.stringify(data, null, 2))
    throw new Error('API 返回空 content，可能内容被过滤或拒绝')
  }
  
  // 记录响应详情（用于调试）
  console.log('[Grsai Chat API] 响应详情:', {
    model: data.model,
    hasChoices: !!data.choices,
    choicesCount: data.choices?.length || 0,
    firstChoiceContentLength: data.choices?.[0]?.message?.content?.length || 0,
    finishReason: data.choices?.[0]?.finish_reason,
  })
  
  return data
}

/**
 * 调用 GRSAI Chat API（流式，带重试机制）
 * 返回一个异步生成器，用于处理流式响应
 */
export async function* createChatCompletionStream(
  params: ChatCompletionRequest,
  retryCount = 0
): AsyncGenerator<ChatCompletionResponse, void, unknown> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 * (retryCount + 1) // 递增延迟：1s, 2s, 3s
  const TIMEOUT = 60000 // 60秒超时
  
  const apiKey = getGrsaiApiKey()
  const host = getGrsaiChatHost()
  
  if (retryCount > 0) {
    console.log(`[Grsai Chat API Stream] 重试请求 (尝试 ${retryCount + 1}/${MAX_RETRIES}):`, {
      host,
      model: params.model,
      retryCount,
      delay: RETRY_DELAY,
    })
  }
  
  // 添加超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  let response: Response
  try {
    response = await fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ ...params, stream: true }),
      signal: controller.signal,
      keepalive: true,
    })
    clearTimeout(timeoutId)
  } catch (fetchError) {
    clearTimeout(timeoutId)
    
    // 如果是网络错误且还有重试次数，进行重试
    const isNetworkError = fetchError instanceof Error && (
      fetchError.name === 'AbortError' ||
      fetchError.message.includes('fetch failed') ||
      fetchError.message.includes('ECONNREFUSED') ||
      fetchError.message.includes('ENOTFOUND') ||
      fetchError.message.includes('getaddrinfo') ||
      fetchError.message.includes('ECONNRESET') ||
      fetchError.message.includes('socket hang up')
    )
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai Chat API Stream] 网络错误，${RETRY_DELAY}ms 后重试...`, {
        error: fetchError instanceof Error ? fetchError.message : String(fetchError),
        retryCount: retryCount + 1,
        maxRetries: MAX_RETRIES,
      })
      
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      // 递归重试
      yield* createChatCompletionStream(params, retryCount + 1)
      return
    }
    
    // 处理网络错误（不再重试）
    if (fetchError instanceof Error) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`Grsai Chat API 流式请求超时（${TIMEOUT / 1000}秒），请检查网络连接或稍后重试`)
      } else if (fetchError.message.includes('fetch failed') || fetchError.message.includes('ECONNREFUSED')) {
        throw new Error('Grsai Chat API 连接失败，请检查网络连接或 API 服务是否可用')
      } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
        throw new Error('Grsai Chat API 域名解析失败，请检查网络连接')
      } else if (fetchError.message.includes('ECONNRESET') || fetchError.message.includes('socket hang up')) {
        throw new Error('Grsai Chat API 连接被重置，可能是网络不稳定，请稍后重试')
      }
    }
    
    throw new Error(`Grsai Chat API 流式请求失败: ${fetchError instanceof Error ? fetchError.message : '未知错误'}`)
  }

  if (!response.ok) {
    const errorText = await response.text()
    
    // 🔥 详细记录错误响应
    console.error('[Grsai Chat API Stream] 请求失败:', {
      status: response.status,
      statusText: response.statusText,
      model: params.model,
      messagesCount: params.messages.length,
      errorText: errorText.substring(0, 500),
      retryCount,
    })
    
    // 如果是服务器错误（5xx）且还有重试次数，进行重试
    if ((response.status >= 500 && response.status < 600) && retryCount < MAX_RETRIES) {
      console.warn(`[Grsai Chat API Stream] 服务器错误 ${response.status}，${RETRY_DELAY}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      yield* createChatCompletionStream(params, retryCount + 1)
      return
    }
    
    throw new Error(`Grsai Chat API 错误: ${response.status} - ${errorText}`)
  }
  
  // 🔥 记录成功的响应开始
  console.log('[Grsai Chat API Stream] 流式响应开始:', {
    status: response.status,
    model: params.model,
    contentType: response.headers.get('content-type'),
  })

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取流式响应')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let chunkCount = 0
  let hasValidChunk = false
  let firstInvalidChunk: InvalidChunkInfo | null = null

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
            chunkCount++
            
            // 🔥 检查是否有choices
            if (data.choices && data.choices.length > 0) {
              hasValidChunk = true
              yield data
            } else {
              // 🔥 记录第一个无效chunk的详细信息
              if (!firstInvalidChunk) {
                firstInvalidChunk = {
                  chunk: data,
                  rawLine: trimmedLine.substring(0, 500),
                  chunkNumber: chunkCount,
                }
              }
              
              // 🔥 详细记录无choices的chunk
              console.error(`[Grsai Chat API Stream] ⚠️⚠️⚠️ Chunk #${chunkCount} 无choices！`, {
                model: params.model,
                hasChoices: !!data.choices,
                choicesLength: data.choices?.length || 0,
                hasError: !!data.error,
                error: data.error,
                hasId: !!data.id,
                hasModel: !!data.model,
                fullChunk: JSON.stringify(data, null, 2),
                rawLine: trimmedLine.substring(0, 300),
              })
              
              // 如果chunk包含错误信息，抛出错误
              if (data.error) {
                const errorMsg = data.error.message || JSON.stringify(data.error)
                throw new Error(`Grsai Chat API 返回错误: ${errorMsg}`)
              }
              
              // 仍然yield这个chunk，让上层处理
              yield data
            }
          } catch (error) {
            // 解析错误，记录详细信息
            console.error('[Grsai Chat API Stream] 解析流式响应失败:', {
              error: error instanceof Error ? error.message : String(error),
              rawLine: trimmedLine.substring(0, 200),
              lineLength: trimmedLine.length,
            })
            // 如果是我们抛出的错误（API错误），继续抛出
            if (error instanceof Error && error.message.includes('Grsai Chat API')) {
              throw error
            }
            // 其他解析错误，继续处理下一行
          }
        }
      }
    }
    
    // 🔥 如果所有chunk都没有choices，记录警告
    if (chunkCount > 0 && !hasValidChunk) {
      console.error('[Grsai Chat API Stream] ⚠️⚠️⚠️ 所有chunk都没有choices！', {
        totalChunks: chunkCount,
        firstInvalidChunk: firstInvalidChunk ? {
          chunkNumber: firstInvalidChunk.chunkNumber,
          hasError: !!firstInvalidChunk.chunk.error,
          error: firstInvalidChunk.chunk.error,
          fullChunk: JSON.stringify(firstInvalidChunk.chunk, null, 2),
        } : null,
      })
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

