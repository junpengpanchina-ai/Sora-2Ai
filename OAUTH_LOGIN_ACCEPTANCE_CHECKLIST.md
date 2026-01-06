# OAuth 登录验收清单

## ✅ 1. 最短闭环验收（3 分钟）

### 步骤

1. **打开无痕窗口** → 访问 `/login`
2. **F12 → Network** → 搜索 `token`（或过滤 `auth/v1/token`）
3. **点击 "Sign in with Google"** → 完成 Google 授权 → 回到站点

### 预期结果

应该看到至少两条关键请求：

- ✅ `.../auth/v1/authorize`（302/跳转都正常）
- ✅ `.../auth/v1/token?grant_type=pkce` → **200 OK**

并且 token 响应里应该有 `access_token` / `refresh_token`（或 session 结构）。

### 如果 token 不是 200

直接看 response 的 `error` / `error_description`，不用猜。

---

## 🔍 2. 错误定位优先级表（按发生概率从高到低）

### ① token 400 且包含 `invalid_client`

**问题**：Google Client ID/Secret 配置错误

**修复**：
- Supabase Dashboard → Authentication → Providers → Google
- 检查 `Client ID` 和 `Client Secret`
- 常见问题：
  - Secret 填错/复制多空格/换行
  - 用了旧 secret（已重置但没更新）
  - Client ID 和 Secret 不匹配

**验证**：
- 重新生成 Google Client Secret（如果需要）
- 确保 Supabase 中的 Secret 与 Google Cloud Console 完全一致

---

### ② token 400 且包含 `redirect_uri_mismatch`

**问题**：Google Cloud Console 中 Authorized redirect URIs 不匹配

**修复**：
- Google Cloud Console → OAuth client → Authorized redirect URIs
- **必须包含**（非常关键）：
  ```
  https://<project-ref>.supabase.co/auth/v1/callback
  ```
- 例如：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`

**注意**：
- 这是 **Supabase 的 callback**，不是你站点的 `/auth/callback`
- URL 必须完全匹配（包括协议、域名、路径）
- 不能有多余的斜杠或参数

**验证**：
- 在 Google Cloud Console 中确认 redirect URI 已添加
- 确保没有拼写错误

---

### ③ token 400 且包含 `invalid_grant` / `Code was already redeemed`

**问题**：回调 exchange 被触发了两次

**常见原因**：
- 回调页被 middleware/重定向干预
- 回调页面重复执行 `exchangeCodeForSession(code)`
- React 严格模式/重复 render 也可能引起

**修复**：
1. **确保 exchange 只执行一次**：
   - 检查 `app/auth/callback/page.tsx` 中的 `useEffect` 依赖
   - 确保不会因为状态更新而重复执行

2. **确保 middleware 放行回调路径**：
   - 检查 `middleware.ts`
   - 确保 `/auth/callback` 不被拦截或重定向

3. **添加防重复执行保护**：
   ```typescript
   const [hasExchanged, setHasExchanged] = useState(false)
   
   if (hasExchanged) return // 防止重复执行
   setHasExchanged(true)
   await supabase.auth.exchangeCodeForSession(code)
   ```

**验证**：
- 检查 Network 标签中是否只有一次 `token` 请求
- 检查 Console 中是否有重复的 exchange 日志

---

### ④ token 500 `server_error`

**问题**：Supabase 服务器端错误（通常仍然是配置问题）

**修复**：
1. **查看 Supabase 日志**：
   - Supabase Dashboard → Logs Explorer
   - 搜索关键词：`oauth` / `google` / `exchange` / `token`
   - 使用 Network Response Headers 中的 `x-request-id` 精确查找

2. **检查配置**：
   - 通常是 `client/secret/redirect` 配置问题，只是以 500 表现
   - 检查 Google OAuth 客户端状态
   - 检查 Supabase Provider 配置

**验证**：
- 查看 Supabase Logs 中的详细错误堆栈
- 确认 Google OAuth 客户端状态正常

---

## 🔧 3. 必须确认的 4 个"隐形坑"

### (1) Supabase → Authentication → URL Configuration

**检查位置**：
- Supabase Dashboard → Authentication → URL Configuration

**配置要求**：
- **Site URL**：`https://sora2aivideos.com`
- **Redirect URLs**：建议先粗暴一点：
  ```
  https://sora2aivideos.com/**
  ```

**验证**：
- 登录 Supabase Dashboard 确认配置
- 确保没有多余的斜杠或参数

---

### (2) Google OAuth Consent Screen 状态

**问题**：如果还在 Testing 模式

**影响**：
- 只有 test users 能登
- 别的用户会失败（有时表现成 exchange fail）

**修复**：
- Google Cloud Console → OAuth consent screen
- 如果还在 Testing：
  - 要么添加所有需要登录的用户为 Test users
  - 要么提交审核，发布到 Production

**验证**：
- 检查 OAuth consent screen 状态
- 确认已添加所有需要的 Test users（如果在 Testing 模式）

---

### (3) 站点域名是否有 www/non-www 混用

**问题**：域名不统一会导致重定向失败

**修复**：
- **必须统一**：只用 `https://sora2aivideos.com`（不带 www）
- Vercel 里把其他域名 301 到这个主域
- Supabase Site URL 和 Redirect URLs 也只认主域

**验证**：
- 访问 `https://www.sora2aivideos.com` 应该 301 到 `https://sora2aivideos.com`
- 检查 Vercel 域名配置
- 检查 Supabase URL 配置

---

### (4) Vercel 环境变量是否 Production/Preview 都齐

**问题**：如果 preview 环境有人访问，也会"有人能登有人不能登"

**检查变量**：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- （以及你若有用 NextAuth 的 `NEXTAUTH_URL` / `NEXTAUTH_SECRET`）

**修复**：
- Vercel Dashboard → Project Settings → Environment Variables
- 确保 Production 和 Preview 环境都有正确的变量

**验证**：
- 检查 Vercel 环境变量配置
- 确保所有环境都有正确的 Supabase 配置

---

## 🐛 4. 线上自检按钮（Debug 开关）

在 `/login` 页面添加 debug 开关（只在 `?debug=1` 或 `NODE_ENV !== 'production'` 才显示）。

**显示信息**：
- `window.location.origin`
- Supabase URL（隐藏 key）
- `detectSessionInUrl` 是否开启
- 当前 session 是否存在（`getSession()`）

**用途**：
- 用户说"登不了"时，让他点一下就能拿到关键证据
- 快速诊断环境配置问题

---

## 📊 5. 最大问题：排除不出登录失败

### 核心原则

**你已经做到了最难的一步**：把 `supabase.auth` 被禁用的结构性错误修掉了。

### 接下来如果还失败

**不需要再"猜原因"**，你只要抓这一条证据就行：

```
auth/v1/token?grant_type=pkce 的 status + response JSON（error / error_description）
```

### 使用方法

1. **使用 `showOAuthRequests()`**：
   - 在 Console 运行 `showOAuthRequests()`
   - 查看捕获的 token 请求详情

2. **查看 Network 标签**：
   - 找到 `auth/v1/token?grant_type=pkce` 请求
   - 查看 Status Code 和 Response

3. **根据 Response 定位问题**：
   - 把 response（把敏感字段打码）贴出来
   - 根据上面的优先级表直接定位：
     - ✅ Google Console 哪一行（99% 是 redirect URIs）
     - ✅ Supabase Provider 哪一项（client/secret）
     - ✅ 还是 middleware / callback 逻辑（重复 exchange）

---

## ✅ 验收检查清单

- [ ] 无痕窗口测试：token 请求返回 200 OK
- [ ] Supabase URL Configuration 正确配置
- [ ] Google OAuth Consent Screen 状态正常
- [ ] 域名统一（无 www/non-www 混用）
- [ ] Vercel 环境变量 Production/Preview 都配置
- [ ] Debug 开关已添加并可正常使用
- [ ] 如果失败，已获取 token 请求的 status + response

---

## 🚀 快速诊断命令

### 查看捕获的网络请求
```javascript
showOAuthRequests()
```

### 清除捕获的请求记录
```javascript
clearOAuthRequests()
```

### 一键诊断
```javascript
quickFix()
```

### 清除 OAuth 存储
```javascript
clearOAuth()
```

