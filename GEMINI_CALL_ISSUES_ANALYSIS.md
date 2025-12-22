# 🔍 Gemini 调用逻辑问题分析

## 当前实现分析

### 1. Gemini API 调用逻辑 (`lib/grsai/client.ts`)

#### ✅ 已实现的保护机制
- **超时控制**：60 秒超时（`TIMEOUT = 60000`）
- **重试机制**：最多 3 次重试
- **网络错误检测**：识别 `ECONNRESET`、`ETIMEDOUT` 等错误
- **服务器错误重试**：5xx 错误自动重试
- **响应验证**：检查 `choices` 和 `content` 是否为空

#### ⚠️ 潜在问题

**问题 1: 超时时间可能不够**
```typescript
const TIMEOUT = 60000 // 60秒超时
```
- **风险**：如果 Gemini API 响应慢（特别是 `gemini-3-pro`），60 秒可能不够
- **影响**：导致请求被中断，浪费积分
- **建议**：根据模型类型调整超时时间
  - `gemini-2.5-flash`: 60 秒
  - `gemini-3-flash`: 90 秒
  - `gemini-3-pro`: 120 秒

**问题 2: 重试延迟可能不够**
```typescript
const RETRY_DELAY = 1000 * (retryCount + 1) // 1s, 2s, 3s
```
- **风险**：如果 API 临时过载，1-3 秒延迟可能不够
- **影响**：重试后仍然失败，浪费积分
- **建议**：使用指数退避，增加最大延迟
  ```typescript
  const RETRY_DELAY = Math.min(1000 * Math.pow(2, retryCount), 10000) // 1s, 2s, 4s, 8s, 10s
  ```

**问题 3: 没有请求速率限制**
- **风险**：如果批量生成时并发请求过多，可能触发 API 速率限制（429 错误）
- **影响**：导致请求失败，浪费积分
- **建议**：添加请求队列，限制并发数

---

### 2. 批量生成逻辑 (`generate-and-save-scenes.ts`)

#### ✅ 已实现的保护机制
- **分批生成**：每批最多 30 条（避免内存和超时问题）
- **立即保存**：每生成一批立即保存（避免数据丢失）
- **失败率检查**：如果保存失败率 > 50%，停止生成
- **任务停止检查**：每个批次前检查是否应该停止
- **模型降级**：`gemini-2.5-flash` → `gemini-3-flash` → `gemini-3-pro`

#### ⚠️ 潜在问题

**问题 1: "卡词"问题（API 调用卡住）**

**场景**：
- Gemini API 响应慢（> 60 秒）
- 网络不稳定，请求挂起
- API 服务器临时过载

**当前处理**：
```typescript
const response = await createChatCompletion({
  model: 'gemini-2.5-flash',
  stream: false,
  messages: [...],
})
```

**问题**：
- 虽然有 60 秒超时，但如果 API 在 59 秒时开始响应，可能会卡住
- 如果网络问题导致连接挂起，`AbortController` 可能无法及时中断

**建议修复**：
```typescript
// 添加更严格的超时控制
const controller = new AbortController()
const timeoutId = setTimeout(() => {
  controller.abort()
  console.error(`[${industry}] 批次 ${batch + 1}: API 调用超时（${TIMEOUT / 1000}秒）`)
}, TIMEOUT)

try {
  const response = await Promise.race([
    createChatCompletion({...}),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('API 调用超时')), TIMEOUT)
    )
  ])
  clearTimeout(timeoutId)
} catch (error) {
  clearTimeout(timeoutId)
  // 处理超时错误
}
```

**问题 2: "卡保存"问题（数据库保存卡住）**

**场景**：
- 数据库连接超时（特别是第 5 个行业时）
- 数据库连接池耗尽
- 网络不稳定导致连接挂起

**当前处理**：
```typescript
let retryCount = 0
const maxRetries = 5
while (retryCount <= maxRetries && !saved) {
  try {
    await saveSceneToDatabase(industry, scene, useCaseType, supabase)
    saved = true
  } catch (error) {
    retryCount++
    // 重试逻辑
  }
}
```

**问题**：
- 如果数据库连接挂起，`saveSceneToDatabase` 可能永远不会返回（没有超时）
- 虽然有延迟（150ms），但如果连接挂起，延迟不会生效

**建议修复**：
```typescript
// 为数据库操作添加超时控制
async function saveSceneToDatabaseWithTimeout(
  industry: string,
  scene: { id: number; use_case: string },
  useCaseType: string,
  supabase: any,
  timeout = 10000 // 10秒超时
): Promise<void> {
  return Promise.race([
    saveSceneToDatabase(industry, scene, useCaseType, supabase),
    new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('数据库保存超时')), timeout)
    )
  ])
}
```

**问题 3: "出错"问题（错误处理不完善）**

**场景**：
- API 返回格式错误（不是 JSON）
- API 返回空内容
- 数据库约束冲突
- 网络中断

**当前处理**：
- ✅ 检查 `choices` 和 `content` 是否为空
- ✅ JSON 解析错误处理
- ✅ 保存失败率检查
- ⚠️ 但某些错误可能被忽略

**建议修复**：
```typescript
// 增强错误分类和处理
try {
  const response = await createChatCompletion({...})
  
  // 检查响应结构
  if (!response.choices || response.choices.length === 0) {
    throw new Error('API 返回空 choices，可能请求被拒绝')
  }
  
  if (!response.choices[0]?.message?.content) {
    throw new Error('API 返回空 content，可能内容被过滤')
  }
  
  // 检查 finish_reason
  if (response.choices[0].finish_reason === 'content_filter') {
    throw new Error('内容被过滤，可能需要调整提示词')
  }
  
  if (response.choices[0].finish_reason === 'length') {
    throw new Error('响应过长，可能需要减少生成数量')
  }
  
} catch (error) {
  // 根据错误类型决定是否重试
  if (error.message.includes('超时')) {
    // 超时错误，可以重试
    needsRetry = true
  } else if (error.message.includes('被过滤')) {
    // 内容被过滤，不应该重试（会浪费积分）
    needsRetry = false
  } else if (error.message.includes('速率限制')) {
    // 速率限制，应该等待后重试
    needsRetry = true
    retryDelay = 5000 // 5秒延迟
  }
}
```

---

## 🔧 建议的优化方案

### 1. 增强超时控制

```typescript
// lib/grsai/client.ts
export async function createChatCompletion(
  params: ChatCompletionRequest,
  retryCount = 0
): Promise<ChatCompletionResponse> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = Math.min(1000 * Math.pow(2, retryCount), 10000) // 指数退避，最大 10 秒
  
  // 根据模型类型调整超时时间
  const getTimeout = (model: string) => {
    if (model.includes('gemini-3-pro')) return 120000 // 120 秒
    if (model.includes('gemini-3-flash')) return 90000 // 90 秒
    return 60000 // 60 秒（默认）
  }
  
  const TIMEOUT = getTimeout(params.model)
  
  // 使用 Promise.race 确保超时
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)
  
  try {
    const fetchPromise = fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: {...},
      body: JSON.stringify(params),
      signal: controller.signal,
      keepalive: true,
    })
    
    // 双重超时保护
    const timeoutPromise = new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`请求超时（${TIMEOUT / 1000}秒）`)), TIMEOUT)
    )
    
    const response = await Promise.race([fetchPromise, timeoutPromise])
    clearTimeout(timeoutId)
    
    // ... 处理响应
  } catch (error) {
    clearTimeout(timeoutId)
    // ... 错误处理
  }
}
```

### 2. 为数据库操作添加超时

```typescript
// app/api/admin/batch-generation/process/save-scene.ts
export async function saveSceneToDatabase(
  industry: string,
  scene: { id: number; use_case: string },
  useCaseType: string,
  supabase: any,
  timeout = 10000 // 10秒超时
): Promise<void> {
  const savePromise = supabase
    .from('use_cases')
    .insert({
      industry,
      use_case: scene.use_case,
      use_case_type: useCaseType,
      status: 'draft',
    })
    .select()
    .single()
  
  const timeoutPromise = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('数据库保存超时')), timeout)
  )
  
  return Promise.race([savePromise, timeoutPromise])
    .then((result: any) => {
      if (result.error) {
        throw new Error(result.error.message || '数据库保存失败')
      }
      return result
    })
}
```

### 3. 添加请求速率限制

```typescript
// lib/grsai/rate-limiter.ts
class RateLimiter {
  private queue: Array<() => Promise<any>> = []
  private running = 0
  private maxConcurrent = 3 // 最多 3 个并发请求
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        } finally {
          this.running--
          this.processQueue()
        }
      })
      this.processQueue()
    })
  }
  
  private processQueue() {
    while (this.running < this.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!
      this.running++
      task()
    }
  }
}

export const rateLimiter = new RateLimiter()
```

### 4. 增强错误分类和处理

```typescript
// app/api/admin/batch-generation/process/generate-and-save-scenes.ts
function classifyError(error: Error): {
  shouldRetry: boolean
  retryDelay: number
  shouldStop: boolean
  errorMessage: string
} {
  const message = error.message.toLowerCase()
  
  // 超时错误 - 可以重试
  if (message.includes('超时') || message.includes('timeout')) {
    return {
      shouldRetry: true,
      retryDelay: 2000,
      shouldStop: false,
      errorMessage: 'API 调用超时，将重试',
    }
  }
  
  // 网络错误 - 可以重试
  if (message.includes('econnreset') || message.includes('网络')) {
    return {
      shouldRetry: true,
      retryDelay: 3000,
      shouldStop: false,
      errorMessage: '网络连接错误，将重试',
    }
  }
  
  // 内容被过滤 - 不应该重试（会浪费积分）
  if (message.includes('被过滤') || message.includes('content_filter')) {
    return {
      shouldRetry: false,
      retryDelay: 0,
      shouldStop: false,
      errorMessage: '内容被过滤，跳过此批次',
    }
  }
  
  // 速率限制 - 应该等待后重试
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      shouldRetry: true,
      retryDelay: 5000,
      shouldStop: false,
      errorMessage: 'API 速率限制，等待后重试',
    }
  }
  
  // 服务器错误 - 可以重试
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return {
      shouldRetry: true,
      retryDelay: 4000,
      shouldStop: false,
      errorMessage: '服务器错误，将重试',
    }
  }
  
  // 其他错误 - 根据情况决定
  return {
    shouldRetry: false,
    retryDelay: 0,
    shouldStop: false,
    errorMessage: error.message,
  }
}
```

---

## 📊 问题总结

### 当前可能存在的问题

1. **"卡词"问题** ⚠️
   - **原因**：API 调用可能挂起，超时控制不够严格
   - **影响**：浪费积分，阻塞批量生成
   - **优先级**：高

2. **"卡保存"问题** ⚠️
   - **原因**：数据库操作没有超时控制，连接可能挂起
   - **影响**：数据丢失，阻塞批量生成
   - **优先级**：高

3. **"出错"问题** ⚠️
   - **原因**：错误分类不够细致，某些错误可能被忽略
   - **影响**：浪费积分，数据不一致
   - **优先级**：中

### 建议的修复优先级

1. **立即修复**（高优先级）
   - ✅ 为数据库操作添加超时控制
   - ✅ 增强 API 调用的超时保护
   - ✅ 添加错误分类和处理

2. **短期优化**（中优先级）
   - ✅ 根据模型类型调整超时时间
   - ✅ 使用指数退避重试延迟
   - ✅ 添加请求速率限制

3. **长期优化**（低优先级）
   - ✅ 添加请求队列
   - ✅ 实现更智能的错误恢复
   - ✅ 添加监控和告警

---

## 🔗 相关文件

- `lib/grsai/client.ts` - Gemini API 调用逻辑
- `app/api/admin/batch-generation/process/generate-and-save-scenes.ts` - 批量生成逻辑
- `app/api/admin/batch-generation/process/save-scene.ts` - 保存逻辑

