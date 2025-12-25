# 修复 API 返回空 choices 数组错误

## ❌ 问题描述

聊天 API 调用时返回空 `choices` 数组，导致无法获取 AI 回复。

## 🔍 可能的原因

1. **API Key 未配置或无效**
   - `GRSAI_API_KEY` 环境变量未设置
   - API Key 已过期或被撤销
   - API Key 权限不足

2. **API 服务不可用**
   - `https://api.grsai.com` 服务暂时不可用
   - 网络连接问题
   - API 服务维护中

3. **请求格式错误**
   - 请求体格式不符合 API 要求
   - 模型名称错误
   - 消息格式不正确

4. **内容被过滤**
   - 请求内容触发了安全过滤
   - 内容违反 API 使用政策

5. **API 限制**
   - 达到速率限制
   - 达到配额限制

## ✅ 诊断步骤

### 1. 检查环境变量

在 Vercel Dashboard 或本地 `.env.local` 中检查：

```bash
GRSAI_API_KEY=your-api-key-here
```

**验证方法**：
- 在浏览器 Console 运行诊断：`await fullDiagnostics()`
- 查看 `debug.checks.geminiApi.apiKey.exists` 是否为 `true`

### 2. 测试 API 连接

在浏览器 Console 中运行：

```javascript
async function testApiConnection() {
  const apiKey = 'your-api-key' // 从环境变量获取
  try {
    const res = await fetch('https://api.grsai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })
    console.log('API 连接测试:', {
      status: res.status,
      ok: res.ok,
      data: await res.json(),
    })
  } catch (error) {
    console.error('API 连接失败:', error)
  }
}
```

### 3. 检查服务器日志

在 Vercel Dashboard 的 Logs 中查看：
- `[Admin Chat] ⚠️⚠️⚠️ API 返回空 choices 数组！`
- 查看 `debug` 字段中的详细信息

### 4. 运行完整诊断

```javascript
await fullDiagnostics()
```

查看输出中的：
- `checks.geminiApi.apiKey.exists` - API Key 是否配置
- `checks.geminiApi.testCall.success` - API 连接是否成功
- `checks.geminiApi.testCall.error` - 连接错误信息

## 🔧 解决方案

### 方案 1: 检查并更新 API Key

1. 登录 GRSAI 控制台
2. 检查 API Key 是否有效
3. 如果无效，生成新的 API Key
4. 更新环境变量 `GRSAI_API_KEY`

### 方案 2: 检查 API 服务状态

1. 访问 `https://api.grsai.com/v1/models`
2. 使用 API Key 测试连接
3. 如果服务不可用，联系 GRSAI 支持

### 方案 3: 检查请求格式

查看服务器日志中的 `requestInfo`：
- `messageLength` - 消息长度
- `imagesCount` - 图片数量
- `hasHistory` - 是否有历史消息

如果消息过长或格式异常，可能需要调整。

### 方案 4: 检查内容过滤

如果 `finish_reason` 为 `content_filter`，说明内容被过滤：
- 调整提示词，避免触发过滤
- 简化请求内容
- 使用不同的模型

## 📋 增强的错误信息

现在错误响应包含更详细的信息：

```json
{
  "success": false,
  "error": "API 返回空 choices 数组，可能请求被拒绝或格式错误",
  "debug": {
    "model": "gemini-2-flash",
    "apiKeyConfigured": true,
    "apiKeyPrefix": "sk-xxxxx...",
    "chatHost": "https://api.grsai.com",
    "errorInfo": {
      "message": "...",
      "type": "...",
      "code": "..."
    },
    "responseStructure": {
      "hasChoices": false,
      "choicesLength": 0,
      "hasId": true,
      "hasModel": true
    },
    "suggestions": [
      "检查 API Key 是否有效（未过期、有足够权限）",
      "检查 API 服务是否可用（https://api.grsai.com）",
      "检查请求内容是否被过滤或拒绝",
      "查看服务器日志获取更多详细信息"
    ]
  }
}
```

## 🧪 测试修复

修复后，运行：

```javascript
await fullDiagnostics()
```

应该看到：
- ✅ `checks.geminiApi.apiKey.exists: true`
- ✅ `checks.geminiApi.testCall.success: true`
- ✅ `checks.createSession.success: true`
- ✅ `checks.sendMessage.success: true`

## 📞 获取帮助

如果问题仍然存在，请提供：
1. `await fullDiagnostics()` 的完整输出
2. Vercel Dashboard 中的服务器日志
3. API Key 配置状态（不包含实际 Key）

