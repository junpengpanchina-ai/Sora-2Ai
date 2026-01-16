# 🔥 OAuth 登录紧急修复（10 分钟让客户能登录）

## 🎯 问题诊断

**错误**: `access_denied`  
**根因**: OAuth 同意屏幕还在 Testing/未完成验证，不在 Test users 的客户会被直接拒绝

## ✅ A) 先止血：10 分钟让客户立刻能登录（不等审核）

### 步骤 1: 把客户邮箱加进 Test users

1. **访问 Google Cloud Console**
   - https://console.cloud.google.com/
   - 选择项目：`skilled-acolyte-476516-g8`

2. **进入 OAuth Consent Screen**
   - APIs & Services → OAuth consent screen

3. **添加 Test users**
   - 点击 **Test users** 标签
   - 点击 **+ ADD USERS**
   - 添加所有客户的 Google 邮箱（至少先加正在报错的那几个）
   - 点击 **SAVE**

✅ **这一步通常立刻生效，客户马上能登。**

---

## ✅ B) 根治：把 "Homepage requirements" 红点干掉

### 步骤 2: Google Search Console 域名验证

1. **访问 Google Search Console**
   - https://search.google.com/search-console
   - 使用**同一个 Google 账号**（管理 OAuth 的账号）

2. **添加 Domain 资源**
   - 点击 **Add property**
   - **选择 Domain**（不要选 URL-prefix）
   - 输入：`sora2aivideos.com`
   - 点击 **Continue**

3. **获取 DNS 验证记录**
   - 选择 **DNS 验证**
   - 复制 TXT 记录（类似：`google-site-verification=xxxxx...`）

### 步骤 3: Cloudflare 添加 TXT 记录

1. **访问 Cloudflare Dashboard**
   - https://dash.cloudflare.com/
   - 选择域名 `sora2aivideos.com`

2. **添加 DNS 记录**
   - 进入 **DNS** → **Records**
   - 点击 **Add record**
   - 配置：
     - **Type**: `TXT`
     - **Name**: `@`（根域名，不要输入 URL）
     - **Content**: 粘贴完整的 TXT 值（包括 `google-site-verification=` 前缀）
     - **Proxy status**: **DNS only**（灰云，不是橙云）
     - **TTL**: `Auto`
   - 点击 **Save**

3. **回到 Search Console 验证**
   - 等待 1-2 分钟（DNS 传播）
   - 点击 **Verify**

### 步骤 4: 确保同意屏幕写对 3 个 URL

**必须可公开访问（无痕窗口能打开）**：
- ✅ `https://sora2aivideos.com/`
- ✅ `https://sora2aivideos.com/privacy`
- ✅ `https://sora2aivideos.com/terms`

**在 Google Cloud Console → OAuth consent screen**：
- **App domain / Authorized domains**: 包含 `sora2aivideos.com`
- **Homepage**: `https://sora2aivideos.com/`
- **Privacy Policy**: `https://sora2aivideos.com/privacy`
- **Terms of Service**: `https://sora2aivideos.com/terms`

### 步骤 5: 重新提交验证

1. **访问 Verification Center**
   - https://console.cloud.google.com/apis/credentials/consent
   - 点击 **Verification Center**

2. **等待状态变绿**
   - 当 Homepage requirements 不红了
   - 就可以把 Publishing status 改成 **In production**

✅ **一旦 In production：客户不需要 Test users 也能登录。**

---

## ✅ C) 最容易漏的点：Supabase + Google OAuth Redirect URIs

### 步骤 6: 检查 Authorized redirect URIs

**Google Cloud Console → Credentials → OAuth 2.0 Client IDs**

**必须包含**（只保留这两个）：
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

**不要添加**：
- ❌ `https://sora2aivideos.com/auth/callback`（这是 Supabase 回跳的，不是 Google 的 redirect_uri）

**Supabase Dashboard → Authentication → URL Configuration**：
- **Site URL**: `https://sora2aivideos.com`
- **Redirect URLs**: 
  ```
  https://sora2aivideos.com/*
  https://sora2aivideos.com/auth/callback
  ```

---

## 📋 检查清单

- [ ] 步骤 1: 客户邮箱已加入 Test users（立即生效）
- [ ] 步骤 2: Google Search Console 已添加 Domain 资源
- [ ] 步骤 3: Cloudflare 已添加 TXT 记录（DNS only）
- [ ] 步骤 4: 3 个 URL 可公开访问且已填入同意屏幕
- [ ] 步骤 5: Verification Center 状态已变绿
- [ ] 步骤 6: Redirect URIs 配置正确（只保留 Supabase callback）

---

## ⚡ 最快恢复流程

1. **立即执行步骤 1**（10 分钟）→ 客户马上能登录
2. **并行执行步骤 2-4**（15 分钟）→ 解决根因
3. **等待步骤 5**（24-48 小时）→ 完成验证
4. **切换到 In production** → 所有用户可用
