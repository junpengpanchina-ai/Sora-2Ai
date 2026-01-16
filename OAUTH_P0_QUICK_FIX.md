# P0: Google OAuth 登录修复（10分钟止血）

**问题**：客户无法登录，`access_denied` 错误，营收归零

**根因**：
1. OAuth consent screen 还在 `Testing` 状态
2. Homepage requirements 未完成（红色）
3. 客户邮箱不在 Test users 列表

---

## ⚡ 10分钟止血（立即执行）

### 步骤 0：确认当前状态

1. 打开 Google Cloud Console → APIs & Services → OAuth consent screen
2. 检查 **Publishing status**：
   - `Testing` = 需要修复
   - `In production` = 已解决
3. 检查 **Verification Center** → Homepage requirements：
   - 红色 = 需要修复
   - 绿色 = 已解决

---

### 步骤 1：添加客户邮箱到 Test users（立刻能登）

**路径**：Google Cloud Console → APIs & Services → OAuth consent screen → **Test users**

1. 点击 **Add users**
2. 输入所有需要登录的客户 Gmail 地址（每行一个）
3. 点击 **Save**

✅ **效果**：客户立刻可以登录（无痕模式重试）

> ⚠️ 这只是临时止血，不等验证就能赚钱

---

### 步骤 2：修复 Homepage requirements（DNS 验证）

#### 2.1 Google Search Console 做 Domain 验证

1. 打开 [Google Search Console](https://search.google.com/search-console)
2. 点击 **Add property** → 选择 **Domain**
3. 输入：`sora2aivideos.com`
4. 复制 **TXT 记录**：`google-site-verification=xxxxx`

#### 2.2 Cloudflare 添加 TXT 记录

1. 打开 Cloudflare Dashboard → 选择域名 `sora2aivideos.com`
2. 进入 **DNS** → **Records**
3. 点击 **Add record**：
   - **Type**: `TXT`
   - **Name**: `@`（或留空）
   - **Content**: `google-site-verification=xxxxx`（从 Search Console 复制）
   - **Proxy status**: **DNS only**（灰云 ☁️，不是橙色云）
4. 点击 **Save**

#### 2.3 验证

1. 等待 1-5 分钟（DNS 传播）
2. 回到 Google Search Console → 点击 **Verify**
3. ✅ 成功后，回到 OAuth consent screen → Verification Center → Homepage requirements 应该变绿

---

### 步骤 3：确保 OAuth 同意屏幕的 3 个 URL 可访问

**路径**：Google Cloud Console → APIs & Services → OAuth consent screen

确保以下 URL 在**无痕模式**下都能打开：

1. **Application home page**: `https://sora2aivideos.com/`
2. **Privacy Policy link**: `https://sora2aivideos.com/privacy`
3. **Terms of Service link**: `https://sora2aivideos.com/terms`

**检查**：
- 打开无痕窗口
- 访问这 3 个 URL
- 如果 404，需要创建这些页面

**Authorized domains**（在 OAuth consent screen 底部）：
- 确保包含：`sora2aivideos.com`

---

### 步骤 4：改为 In production（彻底放开）

**路径**：Google Cloud Console → APIs & Services → OAuth consent screen

1. 确认所有验证都通过（绿色 ✅）
2. 点击 **PUBLISH APP**
3. 选择 **In production**
4. 确认发布

✅ **效果**：所有用户都可以登录，不再需要 Test users

---

## 🔍 验证修复

1. **无痕模式**打开 `https://sora2aivideos.com`
2. 点击 **Sign in with Google**
3. 选择 Google 账号
4. ✅ 应该成功登录，不再报 `access_denied`

---

## 📝 检查清单

- [ ] 步骤 1：客户邮箱已添加到 Test users（临时止血）
- [ ] 步骤 2.1：Search Console 已添加 Domain property
- [ ] 步骤 2.2：Cloudflare 已添加 TXT 记录（DNS only）
- [ ] 步骤 2.3：Search Console 验证通过
- [ ] 步骤 3：3 个 URL 在无痕模式下可访问
- [ ] 步骤 4：OAuth consent screen 改为 In production
- [ ] 验证：无痕模式测试登录成功

---

## 🆘 如果还是失败

1. **检查 Redirect URIs**：
   - Google Cloud Console → Credentials → OAuth 2.0 Client IDs
   - **Authorized redirect URIs** 应该包含：
     - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
   - **不要**包含 `https://sora2aivideos.com/auth/callback`（那是 Supabase 回跳的，不是 Google 的）

2. **检查 Supabase Redirect URLs**：
   - Supabase Dashboard → Authentication → URL Configuration
   - **Additional Redirect URLs** 应该包含：
     - `https://sora2aivideos.com/*`
     - `https://sora2aivideos.com/auth/callback`

3. **清除浏览器缓存**：
   - 使用无痕模式测试
   - 清除 Google 账号的授权记录（Google Account → Security → Third-party apps）

---

**完成时间**：10-15 分钟  
**优先级**：P0（营收归零，立即修复）
