# OAuth Exchange 错误诊断指南

## 🔴 问题症状

```
Unable to exchange external code: 4/0ATX87lM6U1OHNrrOWtG4QPnpo-FM3UioYrcwVymg_SJM0K_EK8UgzV73agdRohX5cgLdoQ
```

**关键证据：**
- ✅ 前端已拿到 Google 的 code
- ❌ 在"用 code 去换 token"这一步（exchange）失败
- 问题不在 `/login` 性能、不在按钮点击、不在页面渲染
- **问题在 OAuth 回调后的 token 交换链路**

## 🔍 Step 1: 捕获 Exchange 请求详情

### 方法 1: 使用网络请求调试工具（推荐）

1. **打开浏览器开发者工具**（F12）
2. **切换到 Console 标签**
3. **复制并粘贴 `CONSOLE_OAUTH_NETWORK_DEBUG.js` 的内容**
4. **打开无痕窗口**（避免缓存干扰）
5. **访问 `/login` 页面**
6. **点击"使用 Google 账号登录"**
7. **完成授权后，回到站点**
8. **在控制台运行**：
   ```javascript
   showOAuthRequests()
   ```

### 方法 2: 手动查看 Network 标签

1. **打开无痕窗口**
2. **访问 `/login` → 点击 Google 登录**
3. **完成授权后，F12 → Network 标签**
4. **过滤关键词**：
   - `token`
   - `authorize`
   - `callback`
   - `supabase`
   - `auth`
5. **找到类似这样的请求**：
   ```
   https://<project-ref>.supabase.co/auth/v1/token?grant_type=pkce
   ```
6. **点击该请求，查看**：
   - **Request URL**（完整 URL）
   - **Status Code**（状态码）
   - **Response**（JSON 中的 `error` / `error_description`）

## 📊 Step 2: 根据响应错误定位问题

### A) `error: "invalid_client"` 或 `error_description` 包含 `invalid_client`

**结论：** Google Client ID/Secret 配置错误

**修复步骤：**

1. **检查 Supabase 配置**：
   - Supabase Dashboard → Authentication → Providers → Google
   - 检查 `Client ID` 和 `Client Secret` 是否正确
   - 确保没有多余的空格或换行

2. **检查 Google Cloud Console**：
   - Google Cloud Console → APIs & Services → Credentials
   - 找到对应的 OAuth 2.0 Client ID
   - 确认 `Client ID` 和 `Client Secret` 与 Supabase 中的一致
   - 检查 Client Secret 是否过期

3. **重新生成 Secret（如果需要）**：
   - Google Cloud Console → OAuth client → Reset secret
   - 复制新的 Secret 到 Supabase Dashboard

### B) `error: "redirect_uri_mismatch"` 或 `error_description` 包含 `Redirect URL mismatch`

**结论：** Google Console 中 Authorized redirect URIs 不匹配

**修复步骤：**

1. **检查 Google Cloud Console**：
   - Google Cloud Console → OAuth client → Authorized redirect URIs
   - **必须包含**（非常重要）：
     ```
     https://<project-ref>.supabase.co/auth/v1/callback
     ```
   - 例如：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`

2. **检查 Supabase URL 配置**：
   - Supabase Dashboard → Authentication → URL Configuration
   - `Site URL`：`https://sora2aivideos.com`
   - `Redirect URLs`：至少包含 `https://sora2aivideos.com/**`

3. **确保完全匹配**：
   - URL 必须完全匹配（包括协议、域名、路径）
   - 不能有多余的斜杠或参数
   - 区分大小写

### C) `error: "invalid_grant"` 或 `error_description` 包含 `Code was already redeemed` / `Malformed auth code`

**结论：** Code 被重复使用/过期/回调被执行两次

**修复步骤：**

1. **检查代码中是否重复执行 exchange**：
   ```typescript
   // ❌ 错误：不要多次调用
   await supabase.auth.exchangeCodeForSession(code)
   await supabase.auth.exchangeCodeForSession(code) // 重复调用
   
   // ✅ 正确：只调用一次
   const { data, error } = await supabase.auth.exchangeCodeForSession(code)
   ```

2. **检查 middleware 是否导致重复回调**：
   - 检查 `middleware.ts` 是否在 `/auth/callback` 路径上执行了重定向
   - 确保回调页面不会被 middleware 拦截

3. **检查是否有自动刷新/自动跳转**：
   - 检查是否有 `router.refresh()` 或 `window.location.reload()` 在回调后执行
   - 确保不会触发第二次 exchange

### D) `Status Code: 500` + `error: "server_error"`

**结论：** Supabase 服务器端错误（通常仍然是配置问题）

**修复步骤：**

1. **查看 Supabase 日志**：
   - Supabase Dashboard → Logs Explorer
   - 搜索关键词：`oauth` / `google` / `exchange` / `token`
   - 查看详细的错误堆栈

2. **检查 Request ID**：
   - Network 标签 → Response Headers → `x-request-id`
   - 在 Supabase Logs 中搜索该 Request ID

3. **常见原因**：
   - Google Client Secret 过期或错误
   - Google API 配额超限
   - Supabase 项目配置问题

## 🔧 Step 3: 验证修复

修复后，按以下步骤验证：

1. **清除浏览器存储**：
   ```javascript
   // 在控制台运行
   (() => { 
     const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
       .filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth'))
     const uniqueKeys = [...new Set(keys)]
     uniqueKeys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
     console.log(`✅ 已清除 ${uniqueKeys.length} 个键`)
   })()
   ```

2. **使用无痕窗口测试**：
   - 打开无痕窗口
   - 访问 `/login`
   - 点击 Google 登录
   - 完成授权

3. **检查 Network 请求**：
   - 确认 token exchange 请求返回 `200 OK`
   - 确认响应中包含 `access_token` 和 `refresh_token`

## 📝 常见错误对照表

| Network Response Error | 问题原因 | 修复位置 |
|------------------------|---------|---------|
| `invalid_client` | Client ID/Secret 错误 | Supabase Dashboard / Google Cloud Console |
| `redirect_uri_mismatch` | 重定向 URL 不匹配 | Google Cloud Console → Authorized redirect URIs |
| `invalid_grant` | Code 过期/重复使用 | 检查代码是否重复 exchange |
| `server_error` (500) | Supabase 服务器错误 | Supabase Dashboard → Logs Explorer |
| `Unable to exchange external code` | Supabase 无法与 Google 交换 | 检查 Google OAuth 配置和 Supabase 日志 |

## 🚀 快速诊断命令

### 查看捕获的网络请求
```javascript
showOAuthRequests()
```

### 清除捕获的请求记录
```javascript
clearOAuthRequests()
```

### 清除 OAuth 存储
```javascript
(() => { 
  const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
    .filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth'))
  [...new Set(keys)].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
  console.log(`✅ 已清除`)
})()
```

## 💡 额外提示

1. **Google Console 加载失败**：
   - 如果 Google Cloud Console 页面加载失败，可能是权限问题
   - 但仍然可以通过 Network 响应直接看到错误原因

2. **使用无痕窗口**：
   - 避免浏览器缓存和扩展程序干扰
   - 确保测试环境干净

3. **检查 Supabase 项目**：
   - 确保使用的是正确的 Supabase 项目
   - 检查项目 URL 是否匹配

4. **查看完整响应**：
   - Network 标签中的 Response 可能包含更详细的错误信息
   - 特别是 `error_description` 字段

