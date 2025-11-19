# 本地开发环境 OAuth 登录修复指南

## 🔴 问题

在本地开发环境中，Google 登录失败，`code_verifier` 无法保存。

## 🔍 逆向思维分析

### 问题根源

1. **环境变量配置错误**
   - `NEXT_PUBLIC_APP_URL` 设置为生产环境 URL (`http://sora2aivideos.com`)
   - 本地开发应该使用 `http://localhost:3000`

2. **重定向 URL 不匹配**
   - 登录时使用的 `redirectTo` 是 `window.location.origin`（本地是 `http://localhost:3000`）
   - 但 Supabase 可能配置了不同的 Site URL

3. **Supabase Site URL 配置**
   - Supabase Dashboard 中的 Site URL 可能没有包含 `http://localhost:3000`

## ✅ 解决方案

### 步骤 1: 修复本地环境变量

编辑 `.env.local` 文件，确保本地开发使用正确的 URL：

```env
# 本地开发环境
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 生产环境（部署时使用）
# NEXT_PUBLIC_APP_URL=http://sora2aivideos.com
```

### 步骤 2: 检查 Supabase Dashboard 配置

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 选择你的项目

2. **检查 Site URL 配置**
   - 进入 **Settings** > **API**
   - 找到 **Site URL** 设置
   - 确保包含：`http://localhost:3000`

3. **检查 Redirect URLs**
   - 进入 **Authentication** > **URL Configuration**
   - 在 **Redirect URLs** 中添加：
     ```
     http://localhost:3000/**
     http://localhost:3000/auth/callback
     ```

### 步骤 3: 检查 Google Cloud Console

确保 Google Cloud Console 中的重定向 URI 包含本地开发环境：

```
http://localhost:3000/auth/callback
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

### 步骤 4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

## 🧪 测试步骤

1. **确认环境变量**
   ```bash
   npm run check-env
   ```

2. **清除浏览器缓存**
   - 清除所有 Cookie 和缓存
   - 确保使用 `http://localhost:3000` 访问

3. **测试登录**
   - 访问 `http://localhost:3000/login`
   - 打开浏览器开发者工具（F12）
   - 点击登录按钮
   - 查看控制台日志

## 📝 本地开发环境变量模板

创建 `.env.local` 文件（如果还没有）：

```env
# Next.js - 本地开发
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

## 🔧 快速修复命令

```bash
# 1. 检查当前环境变量
cat .env.local | grep APP_URL

# 2. 如果显示的是生产 URL，更新为本地 URL
# 编辑 .env.local，将 NEXT_PUBLIC_APP_URL 改为 http://localhost:3000

# 3. 重启开发服务器
npm run dev
```

## ⚠️ 重要提示

- **本地开发**：使用 `http://localhost:3000`
- **生产环境**：使用 `http://sora2aivideos.com` 或实际域名
- **环境变量**：确保 `.env.local` 中的 URL 与当前环境匹配

## 🎯 验证

修复后，登录流程应该：

1. ✅ 使用 `http://localhost:3000` 作为基础 URL
2. ✅ `redirectTo` 为 `http://localhost:3000/auth/callback`
3. ✅ `code_verifier` 正确保存到 localStorage
4. ✅ 回调时能正确读取 `code_verifier`
5. ✅ 成功完成登录

