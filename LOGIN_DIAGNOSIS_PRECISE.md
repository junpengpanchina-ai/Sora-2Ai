# 🔍 /login 登不进去问题精确定位方案（10分钟闭环）

## ✅ 先定性：/login RES=91 说明什么？

- ✅ **前端性能没问题**
- ❌ **"登不了"基本只会落在**：OAuth 配置 / 回调 URL / 环境变量 / Cookie & session / middleware 重定向 / Provider 权限

**所以你现在的目标是：找到第一个失败点（first failure），而不是看 10 个可能性。**

---

## 🎯 1️⃣ 10分钟闭环：把失败点钉在"哪一段"

### Step 1：无痕窗口 + Network 只看 3 个东西

**打开 `/login` → 点击 Google 登录 → 只盯这三条：**

#### A) 是否跳去 `accounts.google.com`？

- ❌ **不跳**：99% 是前端初始化失败（client id / provider 未启用 / JS 报错）
- ✅ **跳了**：继续看 B

#### B) 从 Google 回来后，是否命中 callback？

**Supabase 常见**：
- `/auth/v1/callback`（Supabase 内部）
- `/auth/callback`（你的自定义 callback 页面）

**只要 callback 请求出现 400/401/500，你就已经抓到根因方向了（不用再猜 cookie）。**

#### C) callback 成功后，session 是否建立？

**Supabase 检查**：
- 看 `localStorage` 是否出现 `sb-` 前缀相关 key
- 看 `Application` → `Cookies` 是否有 `sb-` 前缀的 cookie
- 看 `/auth/v1/session` 或 `/auth/v1/user` 请求是否返回用户信息

---

## 🎯 2️⃣ 快速判别：你到底属于哪一种"登不了"

把用户问题归类成 **4 类**（每类对应 1-2 个最常见根因）：

### ① 点登录不跳转

**高概率**：
- `GOOGLE_CLIENT_ID` 没注入到前端（环境变量没生效/名称错）
- Google Provider 没启用（Supabase 的 Google provider OFF）
- Console 有 JS 错误（比如 `window is not defined`、组件报错导致按钮没触发）

**你该看**：
- Console 第一条红字
- 点击按钮时 Network 有没有请求发出（`/auth/v1/authorize`）

---

### ② 跳到 Google 了，但回站 callback 报错 400

**高概率（最常见）**：
- `redirect_uri_mismatch`
- 域名混乱：www vs non-www，或残留旧域名
- callback 路径不一致（你改过路由但 Google Console 没同步）

**你该看**：
- callback 的 response body（通常会直接写 mismatch）
- Google Console 的 Authorized redirect URIs 是否完全一致

---

### ③ callback 看起来成功，但刷新就掉登录 / 一直回到 /login

**高概率**：
- Cookie domain / SameSite 不对（尤其 www/non-www 切换）
- middleware 在 session 未 ready 时重定向（App Router 很常见）
- `SUPABASE_SITE_URL` 配错导致 session 写到了另一个域名

**你该看**：
- Network 是否出现 307/308 循环
- Application → Cookies：是否有 `sb-` 前缀的 cookie
- localStorage 是否有 `sb-` 前缀的 key

---

### ④ 只有别人登不了，你自己能登

**高概率**：
- OAuth consent screen 还在 Testing，别人不是 test user
- Google Workspace / 地区 / 账号类型限制
- scope 请求太敏感导致被拦

**你该看**：
- Google Cloud OAuth consent screen 状态
- 是否 External 且 Published

---

## 🎯 3️⃣ 分叉：按你实际栈给"必查清单"

### ✅ 你用的是 Supabase Auth（已确认）

**Supabase Dashboard 必查**：

#### Authentication → URL Configuration

- **Site URL**：`https://sora2aivideos.com`
- **Redirect URLs**：包含你线上回调（建议同时加上你实际会用到的所有路径）
  ```
  https://sora2aivideos.com/**
  https://sora2aivideos.com/auth/callback
  ```

#### Authentication → Providers → Google

- ✅ Google provider **ON**
- ✅ Client ID 正确：`222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
- ✅ Client Secret 正确：`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`

**最常见的致命点**：
- ❌ Site URL 还是旧域名（你之前 robots 域名就修过一次，这个很容易也残留）
- ❌ Redirect URLs 少配了一条（尤其你有多个 callback/returnTo）

**必做动作**：
- Supabase Auth logs（如果你开启了日志/可观测）看 `authorize`/`token` 报错
- 浏览器里看 `sb-` 本地存储是否写入

---

### Vercel 环境变量（Production）必须有：

```
NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**最常见的致命点**：
- ❌ Preview 环境变量齐，Production 不齐（或反过来）
- ❌ 环境变量名称错（比如 `SUPABASE_URL` 而不是 `NEXT_PUBLIC_SUPABASE_URL`）

**必做动作**：
- Vercel → Deployment → Functions Logs
- 搜索：`callback`, `error`, `OAuth`, `redirect`
- callback 400 时，Supabase 往往会在 logs 里吐出更具体原因

---

## 🎯 4️⃣ 你问的"Google Auth Platform 加载失败是不是重要原因？"

**它不是直接导致用户登录失败的"唯一根因"，但它非常危险**，因为它意味着：

- 你可能根本没法确认 OAuth Client 的配置是否正确
- 甚至可能你看的 project/client 不是线上正在用的那个（最常见：账号/项目切错）

**所以它的价值在于**：

只要你发现"console 打不开/加载失败"，你必须用另一台网络/浏览器/账号，把"线上实际使用的 client id 所属项目"确认出来。

否则你可能一直在改错地方。

---

## 🎯 5️⃣ 一句话把问题钉死：你现在下一步该做什么

**你现在不要再扩展文档了，直接做这 3 件事（按顺序）：**

1. ✅ **无痕登录一次** → 抓到 callback 请求的 **status code**（200/302/400/500）
2. ✅ **打开 Vercel Functions Logs**（或 Supabase Auth logs）→ 搜索 `callback` / `OAuth` / `redirect`
3. ✅ **立刻核对"三处域名必须一致"**：
   - 站点最终域名：`https://sora2aivideos.com`
   - OAuth Console redirect/origin
   - Supabase Site URL / Redirect URLs

---

## ✅ 你要贴给我的"证据"长什么样（只要 1 条）

### 方式 A（最推荐）：Network 里复制 callback 这条请求

1. **打开无痕窗口** → 进 `/login`
2. **F12** → **Network**
3. **点 "Sign in with Google"**
4. **从 Google 回来后**，Network 搜索关键字：
   - Supabase：`/auth/v1/callback` 或 `token` 或 `authorize`
   - 你的自定义：`/auth/callback`

5. **点开那条请求，把下面这 3 行复制给我**：

```
Request URL：...
Status Code：...
Response (Preview/Response 的 error 文案)：...
```

**如果 Response 是空的，就贴 Location（Response Headers 里）那一行也行。**

---

## ✅ 你可能看到的"典型错误字符串"（你贴其中一个我就能秒判）

### 1) `redirect_uri_mismatch`

**结论**：100% 是 Google Console 的 Authorized redirect URIs 不匹配（或你站点 www/non-www/旧域名混了）

**修复**：
- Google Cloud Console → APIs & Services → Credentials
- 检查 Authorized redirect URIs 是否包含：
  ```
  https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
  https://sora2aivideos.com/auth/callback
  ```

---

### 2) `invalid_client` / `unauthorized_client`

**结论**：Google Client ID/Secret 不对、或用错了 GCP project/client

**修复**：
- 确认 Vercel 环境变量中的 `GOOGLE_CLIENT_ID` 和 Google Console 中的一致
- 确认 Supabase Provider 中的 Client ID/Secret 正确

---

### 3) `state mismatch` / `PKCE` / `OAuthCallbackError`

**结论**：多半是 Cookie / SameSite / domain / 多域名跳转 或 middleware 干扰回调

**修复**：
- 检查 Cookie SameSite 设置（应该是 `Lax`）
- 检查 `middleware.ts` 是否在 callback 时重定向
- 检查是否有跨子域问题（www vs non-www）

---

### 4) Supabase 回调后 401/403 或 token 报错

**结论**：Supabase Site URL / Redirect URLs 没配对，或 Provider 没启用/密钥错

**修复**：
- Supabase Dashboard → Authentication → URL Configuration
- 确认 Site URL = `https://sora2aivideos.com`
- 确认 Redirect URLs 包含所有需要的路径
- 确认 Google Provider 已启用

---

## 🔍 如何一眼看出你用的是什么 Auth？

**看 callback URL**：

- 含 `/api/auth/` → 基本就是 NextAuth
- 含 `/auth/v1/` 或 `sb-` 的 cookie/localStorage → 基本就是 Supabase Auth

**你的项目**：✅ **Supabase Auth**（已确认）

---

## 📋 完整检查清单（按优先级）

### 🔥 最高优先级（必须一致）

- [ ] **三处域名必须一致**：
  - 站点真实域名：`https://sora2aivideos.com`
  - Google Console Authorized redirect URIs
  - Supabase Site URL

### ⚠️ 高优先级

- [ ] Google Console Authorized redirect URIs 包含：
  ```
  https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
  https://sora2aivideos.com/auth/callback
  ```
- [ ] Supabase Site URL = `https://sora2aivideos.com`
- [ ] Supabase Redirect URLs 包含生产域名
- [ ] Google Provider 已启用（Supabase Dashboard）
- [ ] Vercel Production 环境变量已设置

### ✅ 中优先级

- [ ] OAuth consent screen 状态是 Published（不是 Testing）
- [ ] Cookie SameSite 设置正确（通常是 `Lax`）
- [ ] `middleware.ts` 没有循环重定向逻辑

---

## 🆘 如果还是不行

**提供以下信息（按优先级）**：

1. **Network callback 请求**（status + response body）
2. **Console 错误截图**（第一条红字）
3. **三处域名配置截图**（Google Console、Supabase、Vercel）
4. **用户操作步骤**（从点击登录到失败）

---

**最后更新**：2025-01-06
**优先级**：🔥 最高优先级 - 影响 100% 用户转化
**使用方法**：10分钟闭环，一条证据秒杀根因
