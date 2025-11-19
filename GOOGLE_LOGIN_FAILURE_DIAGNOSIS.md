# Google 登录失败 - 完整诊断指南

## 🔴 发现的问题

根据代码检查，发现以下**关键问题**：

### 问题 1: 环境变量 URL 不匹配 ⚠️

**当前配置**：
```env
NEXT_PUBLIC_APP_URL=http://sora2aivideos.com
```

**代码实际使用**：
```typescript
const redirectTo = `${window.location.origin}/auth/callback`
```

**问题**：
- 如果你在**本地开发**（`http://localhost:3000`），但环境变量是生产 URL
- 如果你在**生产环境**（`http://sora2aivideos.com`），但 Supabase 可能配置了不同的 URL
- 这会导致重定向 URL 不匹配

### 问题 2: 重定向 URL 路径可能不匹配

**代码使用**：`/auth/callback`
**Google Cloud Console 需要**：可能配置的是 `/api/auth/callback`

### 问题 3: code_verifier 保存失败

使用 `skipBrowserRedirect: true` 时，Supabase 可能不会立即保存 `code_verifier`。

## ✅ 立即修复步骤

### 步骤 1: 检查当前环境

**本地开发**：
```bash
# 检查当前访问的 URL
echo "当前环境: $NEXT_PUBLIC_APP_URL"
```

**生产环境**：
- 检查 Vercel 环境变量
- 确认 `NEXT_PUBLIC_APP_URL` 是否正确

### 步骤 2: 修复环境变量

**本地开发**（`.env.local`）：
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**生产环境**（Vercel）：
```env
NEXT_PUBLIC_APP_URL=https://sora2aivideos.com
# 或
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app
```

### 步骤 3: 检查 Supabase Dashboard

1. **访问**: https://supabase.com/dashboard
2. **进入**: Settings > API
3. **检查 Site URL**:
   - 本地开发：应该包含 `http://localhost:3000`
   - 生产环境：应该包含 `https://sora2aivideos.com`
4. **进入**: Authentication > URL Configuration
5. **检查 Redirect URLs**:
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   https://sora2aivideos.com/**
   https://sora2aivideos.com/auth/callback
   ```

### 步骤 4: 检查 Google Cloud Console

1. **访问**: https://console.cloud.google.com/
2. **进入**: APIs & Services > Credentials
3. **点击**: OAuth 2.0 客户端 ID
4. **检查 Authorized redirect URIs**:

**必须包含**：
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
http://localhost:3000/auth/callback
https://sora2aivideos.com/auth/callback
```

**注意**：
- 路径是 `/auth/callback`（不是 `/api/auth/callback`）
- 协议必须匹配（http vs https）
- 不能有多余的斜杠

### 步骤 5: 检查 Supabase Google Provider

1. **访问**: https://supabase.com/dashboard
2. **进入**: Authentication > Providers
3. **检查 Google Provider**:
   - ✅ 开关已启用
   - ✅ Client ID 正确
   - ✅ Client Secret 正确
   - ✅ 已保存

## 🔧 代码修复建议

### 修复 1: 改进 code_verifier 保存逻辑

当前代码使用 `skipBrowserRedirect: true`，但可能 Supabase 需要更多时间保存。建议：

```typescript
// 增加等待时间
const maxAttempts = 20  // 从 10 增加到 20
// 或
await new Promise(resolve => setTimeout(resolve, 200))  // 从 100ms 增加到 200ms
```

### 修复 2: 添加更详细的错误日志

已添加，但可以增加更多上下文信息。

## 🧪 测试步骤

1. **清除浏览器数据**
   ```bash
   # Chrome: 设置 > 隐私和安全 > 清除浏览数据
   # 选择：Cookie、缓存、本地存储
   ```

2. **检查浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 标签
   - 查看 Network 标签

3. **测试登录流程**
   - 访问登录页面
   - 点击登录按钮
   - 观察控制台输出
   - 检查是否重定向到 Google

4. **检查 Vercel 日志**（如果已部署）
   - 查看 `/api/log-error` 的日志
   - 搜索 `[Client Error]`

## 📋 常见错误及解决方案

### 错误 1: "redirect_uri_mismatch"

**原因**: Google Cloud Console 中的重定向 URI 不匹配

**解决**:
1. 检查 Google Cloud Console 中的 URI
2. 确保包含：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
3. 确保包含你的应用回调 URL（`/auth/callback`）

### 错误 2: "code_verifier not found"

**原因**: localStorage 中未保存 code_verifier

**解决**:
1. 清除浏览器缓存
2. 确保未使用无痕模式
3. 检查浏览器是否允许 localStorage
4. 检查 Supabase Site URL 配置

### 错误 3: "invalid request: both auth code and code verifier should be non-empty"

**原因**: PKCE 流程失败

**解决**:
1. 检查 Supabase 配置
2. 确保 `detectSessionInUrl: true`
3. 检查重定向 URL 是否匹配

## 🎯 快速检查清单

- [ ] 环境变量 `NEXT_PUBLIC_APP_URL` 正确（本地/生产）
- [ ] Supabase Site URL 包含当前环境 URL
- [ ] Supabase Redirect URLs 包含 `/auth/callback`
- [ ] Google Cloud Console 重定向 URI 包含 Supabase 回调
- [ ] Google Cloud Console 重定向 URI 包含应用回调
- [ ] Supabase Google Provider 已启用
- [ ] 浏览器允许 Cookie 和 localStorage
- [ ] 未使用无痕模式
- [ ] 已清除浏览器缓存

## 📞 如果仍然失败

1. **查看浏览器控制台错误**
2. **查看 Vercel 日志**（如果已部署）
3. **检查 Supabase Auth Logs**:
   - Supabase Dashboard > Logs > Auth Logs
4. **检查网络请求**:
   - 开发者工具 > Network 标签
   - 查看到 Supabase 和 Google 的请求

