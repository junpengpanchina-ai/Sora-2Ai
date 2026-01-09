# Google OAuth 登录修复检查清单
## Cloudflare + Vercel 部署专用指南

**你的 Supabase 项目 ref**：`hgzpzsiafycwlqrkzbis`  
**你的生产域名**：`sora2aivideos.com`  
**你的部署平台**：Vercel + Cloudflare

---

## ⚡ 快速参考：最终正确配置（直接照抄）

### Google Cloud Console → OAuth Client

**Authorized redirect URIs**（⚠️ 关键：只保留 Supabase 回调）
```bash
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

> ⚠️ **为什么只保留 Supabase 回调？**
> 因为你用的是 **Supabase Google Provider**，流程是：
> `Google → 回调到 Supabase → Supabase 再把用户重定向回你站点`
> 不是 Google 直接回你站点。你站内的 `/auth/callback` 是 Supabase 回跳的落点，不是 Google 的 redirect_uri。

**Authorized JavaScript origins**
```bash
https://sora2aivideos.com
https://www.sora2aivideos.com
http://localhost:3000
```

### Supabase Dashboard → Auth → URL Configuration

**Site URL**
```bash
https://sora2aivideos.com
```

**Additional Redirect URLs**（✅ 使用 `/*` 通配符，不是 `/**`）
```bash
https://sora2aivideos.com/*
https://sora2aivideos.com/auth/callback
https://www.sora2aivideos.com/*
http://localhost:3000/*
http://localhost:3000/auth/callback
```

---

## ✅ 已完成：立即止血

- [x] 登录页已临时禁用 Google 登录按钮
- [x] 显示提示文案引导用户使用 Email Magic Link
- [x] Email Magic Link 登录功能正常

---

## 🚀 最快恢复客户登录的 3 步（立即执行）

### ✅ 步骤 1：把客户邮箱加入 Test users（立刻恢复一部分客户可用）
**路径**：Google Cloud Console → APIs & Services → OAuth consent screen → Test users

- 点击 **Add users**
- 添加所有需要登录的客户 Gmail 地址
- 保存后客户**立即可以登录**（临时方案）

> ⚠️ **这只是临时止血**，真正解决需要完成步骤 2-3。

---

### ✅ 步骤 2：Search Console → Cloudflare TXT 验证域名（解决 Homepage Requirements 根因）
**详细步骤见下方步骤 2**

---

### ✅ 步骤 3：把 Google Redirect URIs 精简到只留 Supabase callback（避免后续出现 mismatch）
**路径**：Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs

- 打开你的 OAuth Client
- 在 **Authorized redirect URIs** 中，**删除** `https://sora2aivideos.com/auth/callback`（如果有）
- **只保留**：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
- 点击 **Save**

> ✅ 完成后，通常当场就能让客户重新登录。

---

## 📋 详细步骤说明（按最快恢复顺序）

#### 1.1 将客户邮箱加到 Testing users（临时方案）
**路径**：Google Cloud Console → APIs & Services → OAuth consent screen → Test users

- 点击 **Add users**
- 添加所有需要登录的客户 Gmail 地址
- 保存后客户立即可以登录（临时方案）

> ⚠️ 这只是临时止血，真正解决需要完成步骤 2-5。

---

### 步骤 2：Cloudflare DNS 验证域名所有权（15 分钟）

#### 2.1 Google Search Console 添加 Domain 资源
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 点击 **Add property** → 选择 **Domain**
3. 输入：`sora2aivideos.com`
4. 选择 **DNS 验证方式**（最稳定）
5. 复制 Google 提供的 TXT 记录（类似：`google-site-verification=xxxxx...`）

#### 2.2 Cloudflare 添加 TXT 记录
**路径**：Cloudflare Dashboard → 选择域名 `sora2aivideos.com` → **DNS** → **Records**

点击 **Add record**：

- **Type**：`TXT`
- **Name**：`@`（根域名）
- **Content**：粘贴 Google 给的完整 TXT 值（包括 `google-site-verification=` 前缀）
- **TTL**：`Auto`（默认）

保存后回到 Search Console 点击 **Verify**。

> ✅ **验证成功后不要删除 TXT 记录**，它需要持续存在。  
> ℹ️ **注意**：Cloudflare 的 TXT 记录没有 Proxy 开关（橙云/灰云只对 A/CNAME 生效），所以不需要特别设置。

---

### 步骤 3：Vercel 确保首页满足 Google 要求（5 分钟）

#### 3.1 确保首页公开可访问（不强制登录）
用浏览器无痕模式打开并确认：

- ✅ `https://sora2aivideos.com/` 能直接打开（不要跳转到登录页）
- ✅ `https://sora2aivideos.com/privacy` 能直接打开
- ✅ `https://sora2aivideos.com/terms` 能直接打开

#### 3.2 检查首页底部是否有合规链接
首页底部必须包含：

- **Privacy Policy** 链接：`https://sora2aivideos.com/privacy`
- **Terms of Service** 链接：`https://sora2aivideos.com/terms`
- 产品归属标识（如："Sora2AI — sora2aivideos.com"）

> ✅ 已确认：你的 `app/layout.tsx` footer 已经有 Privacy 和 Terms 链接。

#### 3.3 Vercel 域名设置
**路径**：Vercel Dashboard → Project → Settings → Domains

- 确保 `sora2aivideos.com` 设为 **Primary**
- `www.sora2aivideos.com` 可选，建议做 301 重定向到主域

---

### 步骤 4：Google Cloud Console OAuth 配置（10 分钟）

#### 4.1 OAuth Consent Screen → Publishing Status
**路径**：Google Cloud Console → APIs & Services → OAuth consent screen

**操作**：
- 将 **Publishing status** 改为 **In production**
- 如果提示需要验证，先完成步骤 2-3，然后再回来提交

#### 4.2 OAuth Consent Screen → Authorized Domains
**路径**：同一页面 → **Authorized domains** 部分

**必须包含**：
```
sora2aivideos.com
```

#### 4.3 OAuth Client → Authorized Redirect URIs（⚠️ 关键：只保留 Supabase 回调）✅ 已在上方快速 3 步中说明

> ⚠️ **为什么只保留 Supabase 回调？**  
> 因为你用的是 **Supabase Google Provider**，OAuth 流程是：
> ```
> Google → 回调到 Supabase → Supabase 再把用户重定向回你站点
> ```
> 
> 不是 Google 直接回你站点。你站内的 `/auth/callback` 是 **Supabase 回跳的落点**，不是 Google 的 redirect_uri。  
> 如果你添加了站点回调到 Google Redirect URIs，可能会导致 `redirect_uri_mismatch` 错误。

#### 4.4 OAuth Client → Authorized JavaScript Origins
**路径**：同一 OAuth Client 页面 → **Authorized JavaScript origins** 部分

**建议包含**：
```bash
https://sora2aivideos.com
https://www.sora2aivideos.com
http://localhost:3000
```

> ℹ️ **说明**：
> - `www.sora2aivideos.com` 取决于你是否允许用户从 www 访问（建议加上）
> - `localhost:3000` 用于本地开发

> ⚠️ **注意事项**：
> - 不要有多余的斜杠（末尾）
> - 必须使用 https（生产环境）
> - Supabase callback URI 必须精确匹配（包含 `/auth/v1/callback`，不要末尾斜杠）

---

### 步骤 5：Supabase Dashboard 配置（5 分钟）

#### 5.1 Site URL 配置
**路径**：Supabase Dashboard → Authentication → URL Configuration

**Site URL** 必须设置为：
```
https://sora2aivideos.com
```

#### 5.2 Redirect URLs 白名单
**路径**：同一页面 → **Redirect URLs**（Additional Redirect URLs）

**必须包含以下所有 URL**（✅ 使用 `/*` 通配符，不是 `/**`）：
```bash
# 生产环境（通配符覆盖所有路径）
https://sora2aivideos.com/*

# 生产环境（精确路径）
https://sora2aivideos.com/auth/callback

# 如果有 www 且用户可能从 www 访问（或你没强制 301），再加：
https://www.sora2aivideos.com/*

# 本地开发
http://localhost:3000/*
http://localhost:3000/auth/callback
```

> ✅ **Supabase 推荐使用 `/*` 通配符**（不是 `/**`），虽然 `/**` 在某些系统有效，但 `/*` 更标准更稳妥。  
> ℹ️ **说明**：如果你已经在 Vercel 把 www 301 到主域，www 这条可以不加，但加了也不坏。

---

## 🔧 需要修复的配置项（按优先级排序）

> ⬆️ **上述步骤 1-5 已按最快恢复顺序排列，建议按顺序执行**

---

## 📋 详细配置检查清单

### 1. Google Cloud Console 配置（最关键）

#### ✅ 1.1 OAuth Consent Screen → Publishing Status
**路径**：APIs & Services → OAuth consent screen

**当前状态**：
- [ ] Publishing status：**Testing** ❌ （只有 Test users 能登录）
- [ ] Publishing status：**In production** ✅ （所有用户都能登录）

**临时方案**（如果还没过审）：
- [ ] Test users 列表包含所有客户 Gmail 地址

#### ✅ 1.2 Homepage Requirements 验证
**路径**：APIs & Services → OAuth consent screen → Verification Center

**检查项**：
- [ ] 红色的 "Homepage Requirements" 是否已解决？

**解决方案**（Cloudflare + Vercel 专用）：
1. ✅ 使用 Google Search Console 验证域名所有权（步骤 2）
2. ✅ 确保首页公开可访问（步骤 3.1）
3. ✅ 首页底部有 Privacy/Terms 链接（步骤 3.2，已确认存在）

#### ✅ 1.3 Authorized Domains
**路径**：APIs & Services → OAuth consent screen → Authorized domains

**必须包含**：
- [ ] `sora2aivideos.com`

#### ✅ 1.4 OAuth Client → Authorized Redirect URIs（⚠️ 关键：只保留 Supabase 回调）
**路径**：APIs & Services → Credentials → OAuth 2.0 Client IDs

**只保留 Supabase 回调 URI**（不要添加站点回调）：
```bash
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

> ⚠️ **为什么只保留 Supabase 回调？**  
> 因为你用的是 **Supabase Google Provider**，流程是 `Google → Supabase → 站点`，不是 `Google → 站点`。  
> 站点回调 `/auth/callback` 应该放在 Supabase 的 Redirect URLs 白名单，不是 Google 的 Redirect URIs。

#### ✅ 1.5 OAuth Client → Authorized JavaScript Origins
**路径**：同一 OAuth Client 页面

**必须包含**：
```bash
https://sora2aivideos.com
https://www.sora2aivideos.com
http://localhost:3000
```

---

### 2. Supabase Dashboard 配置

#### ✅ 2.1 Site URL 配置
**路径**：Authentication → URL Configuration

**必须设置为**：
- [ ] `https://sora2aivideos.com`

#### ✅ 2.2 Redirect URLs 白名单
**路径**：Authentication → URL Configuration → Redirect URLs

**完整列表**（✅ 使用 `/*` 通配符，不是 `/**`）：
```bash
https://sora2aivideos.com/*
https://sora2aivideos.com/auth/callback
https://www.sora2aivideos.com/*
http://localhost:3000/*
http://localhost:3000/auth/callback
```

> ✅ **Supabase 推荐使用 `/*` 通配符**（不是 `/**`），虽然 `/**` 可能在某些系统有效，但 `/*` 更标准更稳妥。

---

### 3. Google Search Console 域名验证（已完成详细步骤 2）

✅ **已在上方步骤 2 中详细说明**

---

### 4. 代码配置检查

#### 4.1 redirectTo 配置（已正确）
**文件**：`components/LoginButton.tsx`

**当前配置**（正确）：
```typescript
const redirectTo = `${window.location.origin}/auth/callback`
```

**验证**：
- ✅ 使用 `location.origin` 确保动态获取当前域名
- ✅ 回调路径 `/auth/callback` 已添加到 Supabase Redirect URLs

---

## 🧪 验证修复是否成功（10分钟快速测试）

### ✅ 步骤 1：确认 Search Console 域名验证通过
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 确认 `sora2aivideos.com` 显示为 **已验证**
3. 如果未验证，检查 Cloudflare TXT 记录是否添加成功（可能需要等待几分钟传播）

### ✅ 步骤 2：检查 Google Cloud Verification Center
**路径**：Google Cloud Console → APIs & Services → OAuth consent screen → Verification Center

**检查项**：
- [ ] 红色的 "Homepage Requirements" 是否消失或变为处理中？
- [ ] App status 是否显示为 "In production"？

### ✅ 步骤 3：测试不在 Test users 的账号（关键测试）
1. 使用一个**不在你 Test users 列表的 Gmail** 账号（或让客户测试）
2. 打开**无痕窗口**（避免缓存干扰）
3. 访问：`https://sora2aivideos.com/login`
4. 点击 "Sign in with Google"（如果已恢复按钮）
5. ✅ 如果成功登录，说明已从 Testing 模式切换到 Production

### ✅ 步骤 4：检查 Supabase Auth Logs
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：`hgzpzsiafycwlqrkzbis`
3. 进入：**Authentication** → **Logs**
4. 查看是否有 provider error 或 `redirect_uri_mismatch`
5. ✅ 应该看到成功的登录记录，没有错误

### ✅ 步骤 5：浏览器 Network 检查（可选，用于诊断）
1. 打开浏览器开发者工具（F12）
2. 切换到 **Network** 标签
3. 点击 Google 登录
4. 查找请求到 `supabase.co/auth/v1/callback` 的请求
5. ✅ 状态码应该是 200，不是 400/401
6. 如果有 302 重定向到你的站点，说明 OAuth flow 正常

---

## 🔄 恢复 Google 登录按钮

修复完上述所有配置并通过验证后，恢复登录页的 Google 登录按钮：

**文件**：`app/login/page.tsx`

1. **删除黄色警告框**（第 111-126 行）：
   ```tsx
   // 删除这段
   <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 backdrop-blur-sm">
     ...
   </div>
   ```

2. **取消注释 Google 登录按钮**（第 130 行）：
   ```tsx
   <LoginButton className="celestial-cta shadow-[0_30px_100px_-45px_rgba(59,130,246,1)] hover:-translate-y-1" />
   ```

3. **取消注释 "Or continue with" 分割线**（第 133-140 行）：
   ```tsx
   <div className="relative my-6">
     <div className="absolute inset-0 flex items-center">
       <div className="w-full border-t border-white/20"></div>
     </div>
     <div className="relative flex justify-center text-xs uppercase">
       <span className="bg-[#030b2c] px-2 text-white/60">Or continue with</span>
     </div>
   </div>
   ```

4. **恢复描述文案**（可选）：
   将 "Sign in with your email" 改回 "Sign in with your Google account"（如果需要）

5. **恢复状态指示器**（第 161-168 行）：
   将 "Email sign-in · Encrypted" 改回 "Google sign-in · Encrypted"（如果需要）

6. **部署到 Vercel**：
   ```bash
   git add app/login/page.tsx
   git commit -m "Restore Google OAuth login button"
   git push
   ```
   Vercel 会自动部署

---

## 📝 最可能的根因（按概率排序）

根据你遇到的 `access_denied` 错误，最可能的原因是：

1. **OAuth consent screen 还在 Testing 模式**（概率：80%）⭐ **最可能**
   - 客户账号不在 Test users 列表
   - **解决**：
     - **临时**：添加所有客户邮箱到 Test users（步骤 1.1）
     - **永久**：改为 In production（步骤 4.1）

2. **Homepage Requirements 未通过验证**（概率：15%）⭐ **你的截图显示这个**
   - Google 验证中心显示红色警告："您的网站首页未注册到您的名下"
   - **解决**：
     - 用 Search Console 验证域名所有权（步骤 2）
     - 确保首页公开可访问 + 有 Privacy/Terms 链接（步骤 3）

3. **Redirect URI 不匹配**（概率：5%）
   - 通常报 `redirect_uri_mismatch`，但你的是 `access_denied`
   - **解决**：检查 Google Cloud Console 和 Supabase 的 Redirect URLs 配置（步骤 1.4、5.2）

---

## ⚠️ 重要提醒

### 配置生效时间
- ✅ **Supabase 配置**：即时生效（无需重新部署）
- ⏳ **Google Cloud Console 配置**：可能需要 **5 分钟到几小时** 才能生效
- ⏳ **Search Console 验证**：通常立即生效，但 DNS 传播可能需要几分钟
- ⏳ **Verification Center 更新**：Search Console 验证成功后，可能需要手动刷新或等待自动更新

### 执行顺序建议
**最快恢复客户登录的 3 步**（照这个走）：

1. ✅ **把客户邮箱加入 Test users**（立刻恢复一部分客户可用）
2. ✅ **Search Console → Cloudflare TXT 验证域名**（解决 Homepage Requirements 根因）
3. ✅ **把 Google Redirect URIs 精简到只留 Supabase callback**（避免后续出现 mismatch）

> 💡 **提示**：你现在先回去把 Google Redirect URIs 改成只保留 Supabase callback，再把 Test users 加客户，通常当场就能让客户重新登录。

### ❌ 常见错误

❌ **错误 1**：Google Redirect URIs 添加了站点回调 `https://sora2aivideos.com/auth/callback`
- ✅ **解决**：Google Redirect URIs 只保留 Supabase 回调。站点回调应该放在 Supabase 的 Redirect URLs 白名单，不是 Google 的 Redirect URIs。
- ⚠️ **为什么**：因为你用的是 Supabase Google Provider，流程是 `Google → Supabase → 站点`，不是 `Google → 站点`。

❌ **错误 2**：Supabase Redirect URLs 使用了 `/**` 通配符
- ✅ **解决**：Supabase 推荐使用 `/*`（不是 `/**`），虽然 `/**` 可能在某些系统有效，但 `/*` 更标准更稳妥。

❌ **错误 3**：Supabase callback URI 末尾多了斜杠
- ✅ **解决**：必须是 `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`（不要末尾斜杠）

❌ **错误 4**：Authorized redirect URIs 只写了主域名，没写完整路径
- ✅ **解决**：必须包含完整路径 `/auth/v1/callback`

❌ **错误 5**：使用了错误的 Supabase project ref
- ✅ **解决**：确认你使用的是 `hgzpzsiafycwlqrkzbis`，不是其他项目

❌ **错误 6**：误以为 Cloudflare TXT 记录需要关闭 Proxy
- ✅ **解决**：Cloudflare 的 TXT 记录没有 Proxy 开关（橙云/灰云只对 A/CNAME 生效），不需要特别设置，直接添加 TXT 记录即可。

---

## 📞 如果照做了还 access_denied：发送这 2 个截图即可直接定位

### 截图 1：Google Cloud OAuth Consent Screen
**路径**：Google Cloud Console → APIs & Services → OAuth consent screen

**需要看到的**：
- Publishing status（是 Testing 还是 In production？）
- Verification Center 的红项状态（是否还有红色的 Homepage Requirements？）
- Test users 列表（是否有客户邮箱？）

### 截图 2：Supabase Auth Logs
**路径**：Supabase Dashboard → Authentication → Logs

**需要看到的**：
- 具体的 provider error 信息
- 错误发生的具体时间
- 错误类型（是 `access_denied` 还是 `redirect_uri_mismatch`？）

---

**提供以下信息（按优先级）**：

1. **Google Cloud Verification Center 截图**（看红色警告的具体内容）
2. **Search Console 验证状态**（是否显示已验证）
3. **测试用户操作步骤**（从点击登录到失败）
4. **浏览器 Network 请求**（OAuth 回调的 status code 和 response）
5. **Supabase Auth Logs 截图**（看具体错误信息）

---

## ⚠️ 重要提醒

- 修改 Google Cloud Console 配置后，可能需要 **5分钟到几小时** 才能生效
- 修改 Supabase 配置通常是**即时生效**
- Search Console 域名验证成功后，Verification Center 的红色警告可能会自动更新（也可能需要手动刷新）

