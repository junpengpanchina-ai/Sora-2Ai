# 为什么 Vercel 看不到 Google 登录失败？

## 🔴 问题

Google OAuth 登录失败，但在 Vercel Dashboard 中看不到错误信息。

## 📋 原因分析

### Vercel 能看到什么？

✅ **服务器端错误**：
- API 路由错误（`/api/*`）
- 服务器端渲染（SSR）错误
- 构建错误
- 服务器端函数日志

❌ **客户端错误**（Vercel 看不到）：
- 浏览器控制台错误（`console.error`）
- `localStorage` 操作失败
- 客户端 JavaScript 错误
- OAuth 重定向流程中的错误
- `code_verifier` 丢失问题

### 为什么 Google 登录失败在 Vercel 看不到？

Google OAuth 登录是**客户端流程**：

1. **登录按钮点击** → 客户端 JavaScript
2. **生成 OAuth URL** → Supabase 客户端 SDK
3. **保存 `code_verifier`** → 浏览器 `localStorage`
4. **重定向到 Google** → 浏览器导航
5. **Google 授权** → 外部服务
6. **回调到 `/auth/callback`** → 客户端页面
7. **读取 `code_verifier`** → 浏览器 `localStorage`
8. **交换 token** → Supabase 客户端 SDK

**所有这些步骤都在浏览器中执行，Vercel 服务器看不到！**

## ✅ 解决方案

### 方案 1: 添加错误日志 API（推荐）

创建一个 API 路由来记录客户端错误：

```typescript
// app/api/log-error/route.ts
export async function POST(request: Request) {
  const { error, context } = await request.json()
  
  // 记录到 Vercel 函数日志
  console.error('[Client Error]', {
    error,
    context,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    url: request.headers.get('referer'),
  })
  
  return Response.json({ success: true })
}
```

### 方案 2: 使用 Vercel Analytics

Vercel Analytics 可以捕获客户端错误，但需要配置。

### 方案 3: 使用第三方错误追踪

- Sentry
- LogRocket
- Bugsnag

## 🔧 已实施：错误日志记录系统

✅ **已添加错误日志 API** (`/api/log-error`)
✅ **已集成到登录流程** (`components/LoginButton.tsx`)
✅ **已集成到回调处理** (`app/auth/callback/page.tsx`)

现在所有客户端错误都会发送到服务器，可以在 Vercel Dashboard 中查看！

## 📊 如何在 Vercel 中查看错误日志

### 步骤 1: 访问 Vercel Dashboard

1. 访问 https://vercel.com/dashboard
2. 选择你的项目

### 步骤 2: 查看函数日志

**方法 A: 通过 Deployments**
1. 进入 **Deployments** 标签页
2. 点击最新的部署
3. 点击 **Functions** 标签
4. 找到 `/api/log-error` 函数
5. 查看日志输出

**方法 B: 通过实时日志**
1. 进入 **Deployments** 标签页
2. 点击最新的部署
3. 点击 **Logs** 标签
4. 查看实时日志流

### 步骤 3: 搜索错误日志

在日志中搜索：
- `[Client Error]` - 客户端错误
- `[Client Warning]` - 客户端警告
- `code_verifier` - PKCE 相关错误
- `PKCE token exchange failed` - Token 交换失败

## 🔍 日志格式

错误日志会包含以下信息：

```json
{
  "level": "error",
  "error": {
    "message": "code_verifier not found after multiple attempts",
    "stack": "...",
    "name": "Error"
  },
  "context": {
    "redirectTo": "http://localhost:3000/auth/callback",
    "supabaseKeys": ["..."],
    "localStorageKeys": 5,
    "attemptCount": 10,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "userAgent": "Mozilla/5.0...",
    "url": "http://localhost:3000/login"
  }
}
```

## 🎯 常见错误日志示例

### 1. code_verifier 未找到

```
[Client Error] {
  "error": {
    "message": "code_verifier not found after multiple attempts"
  },
  "context": {
    "redirectTo": "https://your-app.vercel.app/auth/callback",
    "supabaseKeys": [],
    "localStorageKeys": 0
  }
}
```

**可能原因**：
- 浏览器清除了 localStorage
- 使用了无痕模式
- 跨域重定向问题

### 2. PKCE Token 交换失败

```
[Client Error] {
  "error": {
    "message": "PKCE token exchange failed: invalid request"
  },
  "context": {
    "code": "abc123...",
    "status": 400,
    "hasCodeVerifier": true
  }
}
```

**可能原因**：
- code_verifier 已过期
- 授权码无效
- Supabase 配置问题

## 📝 使用建议

1. **定期检查日志**
   - 每天查看一次 Vercel 日志
   - 关注 `[Client Error]` 标签

2. **设置告警**（可选）
   - 使用 Vercel 的 Webhook 功能
   - 或集成 Sentry 等错误追踪服务

3. **分析错误模式**
   - 如果某个错误频繁出现，可能是配置问题
   - 记录错误发生的环境（浏览器、设备等）

## ✅ 现在你可以：

1. ✅ 在 Vercel Dashboard 中看到所有客户端错误
2. ✅ 了解错误发生的上下文（URL、用户代理等）
3. ✅ 追踪 `code_verifier` 相关问题的详细信息
4. ✅ 调试生产环境的登录问题

