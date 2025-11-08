# 配置指南

## Google OAuth 凭据

您的 Google OAuth 凭据已准备好：

- **客户端 ID**: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
- **客户端密钥**: `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`

## 快速配置步骤

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```bash
# 复制模板（如果存在）
cp .env.local.template .env.local

# 或手动创建
touch .env.local
```

### 2. 填写环境变量

编辑 `.env.local` 文件，填入以下内容：

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase（需要从 Supabase Dashboard 获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Google OAuth（已提供）
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# grsai.com API（后续使用）
GRSAI_API_KEY=your_grsai_api_key
GRSAI_API_URL=https://grsai.com/api/v1
```

### 3. 配置 Google OAuth 重定向 URI

在 [Google Cloud Console](https://console.cloud.google.com/) 中：

1. 进入 **APIs & Services** > **Credentials**
2. 点击您的 OAuth 2.0 客户端 ID
3. 在 **Authorized redirect URIs** 中添加：

```
http://localhost:3000/api/auth/callback
https://your-project-id.supabase.co/auth/v1/callback
```

⚠️ **重要**: 将 `your-project-id` 替换为您的 Supabase 项目 ID

### 4. 配置 Supabase

1. 在 Supabase Dashboard 中，进入 **Authentication** > **Providers**
2. 启用 **Google** provider
3. 填写：
   - **Client ID**: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - **Client Secret**: `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`
4. 点击 **Save**

### 5. 运行数据库迁移

在 Supabase Dashboard 的 SQL Editor 中执行：

1. `supabase/migrations/001_create_users_table.sql`
2. `supabase/migrations/002_handle_new_user_trigger.sql`

### 6. 检查配置

运行配置检查脚本：

```bash
npm run check-env
```

### 7. 启动开发服务器

```bash
npm install
npm run dev
```

访问 `http://localhost:3000` 测试登录功能。

## 安全提示

⚠️ **重要**:
- `.env.local` 文件已添加到 `.gitignore`，不会被提交到 Git
- 不要在公开场合分享客户端密钥
- 如果密钥泄露，请立即在 Google Cloud Console 中重新生成

## 详细文档

- `SETUP.md` - 完整的设置指南
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth 详细配置
- `QUICK_START.md` - 快速开始指南

