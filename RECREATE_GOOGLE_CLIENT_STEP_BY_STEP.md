# 重新创建 Google OAuth 客户端 - 详细步骤

## 📋 前置准备

在开始之前，确保你准备好以下信息：
- ✅ Google Cloud Console 访问权限（项目：`222103705593` 或 `My First Project`）
- ✅ Supabase Dashboard 访问权限（项目：`hgzpzsiafycwlqrkzbis`）
- ✅ 域名：`sora2aivideos.com`
- ✅ Supabase 回调 URI：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`

---

## 🆕 步骤 1：创建新的 OAuth 客户端（5 分钟）

### 1.1 访问 Google Cloud Console

1. **打开 Google Cloud Console**
   - https://console.cloud.google.com/
   - 确保选择正确的项目：`My First Project`（项目编号：`222103705593`）

2. **导航到 Credentials 页面**
   - 左侧菜单：**APIs & Services** → **Credentials**
   - 或者直接访问：https://console.cloud.google.com/apis/credentials?project=222103705593

### 1.2 删除旧客户端（可选但推荐）

如果你决定删除旧的 "sora2.0" 客户端：

1. 在 OAuth 2.0 Client IDs 列表中找到 "sora2.0"
2. 点击右侧的 **垃圾桶图标**（删除）
3. 确认删除
4. ⚠️ **注意**：删除后无法恢复，确保你已经备份了 Client ID 和 Secret（如果需要）

> 💡 **建议**：如果你想保留旧客户端作为备份，可以先不删除，创建新客户端后再删除旧客户端。

### 1.3 创建新客户端

1. **点击创建按钮**
   - 点击页面顶部的 **+ CREATE CREDENTIALS** 按钮
   - 选择 **OAuth client ID**

2. **选择应用类型**
   - **Application type**: 选择 **Web application**
   - **Name**: 输入 `Sora2Ai Web Client`（或任何你喜欢的名称，例如 `sora2ai-production`）

3. **配置 Authorized JavaScript origins**（⚠️ 先配置这个）
   
   点击 **+ ADD URI** 添加以下 origins：
   ```
   https://sora2aivideos.com
   https://www.sora2aivideos.com
   http://localhost:3000
   ```
   
   > ⚠️ **重要**：
   > - 不要末尾斜杠（`/`）
   > - 生产环境必须使用 `https`
   > - `localhost:3000` 用于本地开发

4. **配置 Authorized redirect URIs**（⚠️ 最关键：只添加 Supabase 回调）
   
   点击 **+ ADD URI** **只添加**以下 URI：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   ```
   
   > ⚠️ **为什么只添加 Supabase 回调？**
   > 因为你使用的是 **Supabase Google Provider**，OAuth 流程是：
   > ```
   > Google → 回调到 Supabase → Supabase 再把用户重定向回你的站点
   > ```
   > 
   > **不要添加**以下 URI（这些是错误的）：
   > - ❌ `https://sora2aivideos.com/auth/callback`
   > - ❌ `http://localhost:3000/auth/callback`
   > - ❌ 任何其他站点回调 URI
   > 
   > 如果你添加了站点回调到 Google Redirect URIs，可能会导致 `redirect_uri_mismatch` 错误。

5. **创建客户端**
   - 点击 **CREATE** 按钮
   - 会弹出一个对话框显示新的 **Client ID** 和 **Client Secret**
   - ⚠️ **立即复制并保存这两个值**（Client Secret 只会显示一次！）

### 1.4 保存新的凭据

**复制并保存以下信息**（建议保存到安全的密码管理器）：

```
Client ID: [新生成的 Client ID，格式类似：222103705593-xxxxxxxxx.apps.googleusercontent.com]
Client Secret: [新生成的 Client Secret，格式类似：GOCSPX-xxxxxxxxx]
```

> ⚠️ **重要**：Client Secret 只会显示一次！如果你错过了，需要重置 Secret（但不需要重新创建客户端）。

---

## 🔧 步骤 2：更新 Supabase Dashboard 配置（3 分钟）

### 2.1 进入 Supabase Dashboard

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 选择项目：`hgzpzsiafycwlqrkzbis`（或项目名称：Sora AI Platform）

2. **导航到 Google Provider 配置**
   - **Authentication** → **Providers**
   - 找到 **Google** provider
   - 点击 **Google** 或右侧的编辑图标

### 2.2 更新 Google Provider 配置

1. **启用 Google Provider**（如果还没启用）
   - 确保 **Enable Sign in with Google** 开关是 **ON**

2. **更新 Client ID**
   - **Client ID (Hosted)** 或 **Client ID (for OAuth)**：粘贴新的 Client ID

3. **更新 Client Secret**
   - **Client Secret (Hosted)** 或 **Client Secret (for OAuth)**：粘贴新的 Client Secret

4. **保存配置**
   - 点击 **Save** 按钮
   - 等待确认消息（通常显示 "Settings saved successfully"）

### 2.3 验证 Supabase Redirect URLs 配置（重要）

1. **检查 Redirect URLs 配置**
   - 同一页面：**Authentication** → **URL Configuration**
   - 或者：**Authentication** → **Settings** → **Redirect URLs**

2. **确保 Site URL 正确**
   ```
   https://sora2aivideos.com
   ```

3. **确保 Redirect URLs 包含以下所有 URL**（✅ 使用 `/*` 通配符）
   ```bash
   https://sora2aivideos.com/*
   https://sora2aivideos.com/auth/callback
   https://www.sora2aivideos.com/*
   http://localhost:3000/*
   http://localhost:3000/auth/callback
   ```

4. **如果缺少任何 URL，添加并保存**

---

## ☁️ 步骤 3：更新 Vercel 环境变量（5 分钟）

如果你使用 Vercel 部署，需要更新环境变量：

### 3.1 访问 Vercel Dashboard

1. **打开 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 选择你的项目（例如：`Sora-2Ai` 或 `sora2aivideos`）

2. **进入环境变量设置**
   - **Settings** → **Environment Variables**
   - 或者：**Project Settings** → **Environment Variables**

### 3.2 更新环境变量

1. **找到现有变量**
   - 查找 `GOOGLE_CLIENT_ID`
   - 查找 `GOOGLE_CLIENT_SECRET`

2. **更新 GOOGLE_CLIENT_ID**
   - 点击 `GOOGLE_CLIENT_ID` 右侧的编辑图标（铅笔）
   - 或者删除后重新添加
   - **Value**: 粘贴新的 Client ID
   - **Environment**: 确保选择了所有环境（Production, Preview, Development）
   - 点击 **Save**

3. **更新 GOOGLE_CLIENT_SECRET**
   - 点击 `GOOGLE_CLIENT_SECRET` 右侧的编辑图标（铅笔）
   - 或者删除后重新添加
   - **Value**: 粘贴新的 Client Secret
   - **Environment**: 确保选择了所有环境（Production, Preview, Development）
   - 点击 **Save**

4. **验证环境变量**
   - 确保两个变量都已更新
   - 确保它们在所有环境（Production, Preview, Development）中都存在

### 3.3 重新部署应用

⚠️ **重要**：更新环境变量后，**必须重新部署应用**才能使新的环境变量生效。

1. **触发重新部署**
   - **Deployments** 标签页
   - 找到最新的部署
   - 点击右侧的 **三点菜单**（...）→ **Redeploy**
   - 或者：**Deployments** → **Redeploy**

2. **等待部署完成**
   - 部署完成后，新的 Client ID 和 Secret 就会生效

---

## 💻 步骤 4：更新本地环境变量（可选）

如果你有本地开发环境，需要更新本地 `.env.local` 文件：

### 4.1 更新 .env.local 文件

1. **打开 `.env.local` 文件**（项目根目录）

2. **更新以下变量**：
   ```env
   GOOGLE_CLIENT_ID=新的_Client_ID
   GOOGLE_CLIENT_SECRET=新的_Client_Secret
   ```

3. **保存文件**

4. **重启开发服务器**（如果正在运行）
   ```bash
   # 停止当前服务器（Ctrl+C）
   # 重新启动
   npm run dev
   ```

---

## ✅ 步骤 5：验证配置（5 分钟）

### 5.1 验证 Google Cloud Console 配置

1. **检查 Authorized Redirect URIs**
   - 回到 Google Cloud Console → **APIs & Services** → **Credentials**
   - 点击你新创建的 OAuth Client
   - 验证 **Authorized redirect URIs** 只包含：
     ```
     https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
     ```

2. **检查 Authorized JavaScript Origins**
   - 验证 **Authorized JavaScript origins** 包含：
     ```
     https://sora2aivideos.com
     https://www.sora2aivideos.com
     http://localhost:3000
     ```

### 5.2 验证 Supabase 配置

1. **检查 Google Provider 配置**
   - Supabase Dashboard → **Authentication** → **Providers** → **Google**
   - 验证 Client ID 和 Client Secret 已更新为新值

2. **检查 Redirect URLs 配置**
   - Supabase Dashboard → **Authentication** → **URL Configuration**
   - 验证 Site URL 和 Redirect URLs 都正确

### 5.3 测试登录（本地或生产）

1. **本地测试**（如果更新了本地环境变量）
   ```bash
   npm run dev
   ```
   - 访问 `http://localhost:3000/login`
   - 尝试使用 Google 登录（注意：登录按钮可能还是临时禁用状态）

2. **生产环境测试**（在 Vercel 重新部署后）
   - 访问 `https://sora2aivideos.com/login`
   - 尝试使用 Google 登录

3. **检查错误**
   - 如果出现 `redirect_uri_mismatch`：检查 Google Redirect URIs 配置
   - 如果出现 `access_denied`：检查 OAuth Consent Screen 状态和 Homepage Requirements

---

## 🎯 完整配置检查清单

完成后，确保以下所有项都正确：

### Google Cloud Console
- [ ] 新 OAuth Client 已创建
- [ ] Client ID 和 Secret 已保存
- [ ] Authorized Redirect URIs **只包含**：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
- [ ] Authorized JavaScript Origins 包含：`https://sora2aivideos.com`, `https://www.sora2aivideos.com`, `http://localhost:3000`
- [ ] 旧客户端已删除（可选，但推荐）

### Supabase Dashboard
- [ ] Google Provider → Client ID 已更新
- [ ] Google Provider → Client Secret 已更新
- [ ] Site URL 设置为：`https://sora2aivideos.com`
- [ ] Redirect URLs 包含所有必要的 URL（使用 `/*` 通配符）

### Vercel（如果使用）
- [ ] `GOOGLE_CLIENT_ID` 环境变量已更新
- [ ] `GOOGLE_CLIENT_SECRET` 环境变量已更新
- [ ] 环境变量在所有环境（Production, Preview, Development）中都存在
- [ ] 应用已重新部署

### 本地开发环境（如果使用）
- [ ] `.env.local` 文件中的 `GOOGLE_CLIENT_ID` 已更新
- [ ] `.env.local` 文件中的 `GOOGLE_CLIENT_SECRET` 已更新
- [ ] 开发服务器已重启

---

## 🔍 常见问题

### Q1: Client Secret 显示后我错过了，怎么办？

**A**: 不需要重新创建客户端。只需要：
1. 回到 Google Cloud Console → **APIs & Services** → **Credentials**
2. 点击你的 OAuth Client
3. 在 **Client secret** 部分，点击 **Reset secret**
4. 复制新的 Secret
5. 更新 Supabase 和 Vercel 中的配置

### Q2: 删除旧客户端会影响现有用户吗？

**A**: 会影响。如果旧客户端正在使用中，删除后：
- 使用旧 Client ID 的登录请求会失败
- 需要立即更新 Supabase 和 Vercel 配置并重新部署

**建议**：先创建新客户端，更新所有配置并验证工作正常后，再删除旧客户端。

### Q3: 创建新客户端后，还需要解决 Homepage Requirements 吗？

**A**: 是的。创建新客户端只是更新了 OAuth 凭据，但 **Homepage Requirements** 仍然是独立的要求：
- 需要在 Google Search Console 验证域名所有权
- 确保首页满足所有要求（见 `GOOGLE_OAUTH_FIX_CHECKLIST.md` 步骤 2 和 3）

### Q4: 重新创建客户端后，access_denied 错误会消失吗？

**A**: 可能不会。`access_denied` 通常是因为：
1. OAuth Consent Screen 还在 **Testing** 状态（只有 Test users 能登录）
2. **Homepage Requirements** 未通过验证

重新创建客户端只是更新了凭据，不会改变这些状态。你仍然需要：
- 解决 Homepage Requirements（步骤 2-3）
- 将 OAuth Consent Screen 改为 **In production**，或添加客户邮箱到 Test users（步骤 1.1）

---

## 📚 相关文档

完成客户端重新创建后，继续按照以下文档修复其他问题：

1. **`GOOGLE_OAUTH_FIX_CHECKLIST.md`** - 完整的 OAuth 修复清单
   - 步骤 1：修复 OAuth Consent Screen 状态
   - 步骤 2：Search Console 域名验证
   - 步骤 3：Homepage Requirements 修复

2. **`SHOULD_I_RECREATE_GOOGLE_CLIENT.md`** - 是否需要重新创建的决策指南

---

## ⚠️ 重要提醒

1. **Client Secret 安全**：不要将 Client Secret 提交到 Git 或分享给他人
2. **配置一致性**：确保 Google Cloud Console、Supabase、Vercel、本地环境中的 Client ID 和 Secret 都一致
3. **测试顺序**：建议先测试本地环境，确认工作正常后再更新生产环境
4. **备份旧配置**：在删除旧客户端前，确保已保存新配置并验证工作正常

---

完成以上步骤后，你的新 Google OAuth 客户端应该就配置好了！接下来按照 `GOOGLE_OAUTH_FIX_CHECKLIST.md` 继续修复其他 OAuth 相关的问题。

