# 设置指南

## 1. Supabase 配置

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并登录
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: Sora-2Ai
   - **Database Password**: 设置一个强密码（请保存好）
   - **Region**: 选择离您最近的区域
4. 等待项目创建完成（约 2 分钟）

### 步骤 2: 获取 Supabase 凭据

1. 在项目 Dashboard 中，进入 **Settings** > **API**
2. 复制以下信息：
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`（请保密，仅用于服务器端）

### 步骤 3: 运行数据库迁移

1. 在 Supabase Dashboard 中，进入 **SQL Editor**
2. 点击 "New query"
3. 复制 `supabase/migrations/001_create_users_table.sql` 的内容并执行
4. 复制 `supabase/migrations/002_handle_new_user_trigger.sql` 的内容并执行

### 步骤 4: 配置 Google OAuth Provider

1. 在 Supabase Dashboard 中，进入 **Authentication** > **Providers**
2. 找到 **Google** provider 并点击启用
3. 填写以下信息（稍后从 Google Cloud Console 获取）：
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
4. 点击 "Save"

## 2. Google OAuth 配置

### 步骤 1: 创建 Google Cloud 项目

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 点击项目选择器，然后点击 "New Project"
3. 输入项目名称（如 "Sora-2Ai"）并点击 "Create"

### 步骤 2: 启用 Google+ API

1. 在左侧菜单中，进入 **APIs & Services** > **Library**
2. 搜索 "Google+ API" 或 "People API"
3. 点击并启用该 API

### 步骤 3: 创建 OAuth 2.0 凭据

1. 进入 **APIs & Services** > **Credentials**
2. 点击 "Create Credentials" > "OAuth client ID"
3. 如果是第一次，需要先配置 OAuth 同意屏幕：
   - **User Type**: External（除非您有 Google Workspace）
   - **App name**: Sora-2Ai
   - **User support email**: 您的邮箱
   - **Developer contact information**: 您的邮箱
   - 点击 "Save and Continue"
   - 在 Scopes 页面，点击 "Save and Continue"
   - 在 Test users 页面，可以添加测试用户（可选）
   - 点击 "Save and Continue" > "Back to Dashboard"

4. 创建 OAuth 客户端 ID：
   - **Application type**: Web application
   - **Name**: Sora-2Ai Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`（开发环境）
     - `https://yourdomain.com`（生产环境，稍后添加）
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback`（开发环境）
     - `https://your-project-id.supabase.co/auth/v1/callback`（Supabase 回调，替换为您的项目 ID）
     - `https://yourdomain.com/api/auth/callback`（生产环境，稍后添加）
   - 点击 "Create"
5. 复制 **Client ID** 和 **Client Secret**

### 步骤 4: 配置环境变量

1. 在项目根目录创建 `.env.local` 文件
2. 复制 `.env.example` 的内容到 `.env.local`
3. 填写所有必需的环境变量：

```env
# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase（从步骤 2 获取）
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth（从步骤 3 获取）
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

### 步骤 5: 在 Supabase 中配置 Google Provider

回到 Supabase Dashboard 的 Google Provider 设置，填入：
- **Client ID (for OAuth)**: 您的 Google Client ID
- **Client Secret (for OAuth)**: 您的 Google Client Secret

## 3. 安装依赖并运行

```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

## 4. 测试登录流程

1. 打开浏览器访问 `http://localhost:3000`
2. 应该会自动重定向到登录页面
3. 点击 "使用 Google 账号登录"
4. 选择 Google 账号并授权
5. 应该会重定向回应用并显示用户信息

## 常见问题

### 问题 1: "redirect_uri_mismatch" 错误

**解决方案**: 确保在 Google Cloud Console 中配置的所有重定向 URI 都正确，包括：
- `http://localhost:3000/api/auth/callback`
- `https://your-project-id.supabase.co/auth/v1/callback`

### 问题 2: 用户信息未保存到 users 表

**解决方案**: 
1. 检查数据库迁移是否已执行
2. 检查触发器是否已创建（`002_handle_new_user_trigger.sql`）
3. 查看 Supabase 日志确认是否有错误

### 问题 3: 认证后无法获取用户信息

**解决方案**:
1. 检查环境变量是否正确配置
2. 检查 Supabase 客户端配置
3. 查看浏览器控制台和服务器日志

## 下一步

完成 Google OAuth 登录后，您可以继续实现：
- 视频生成功能
- 历史记录页面
- 用户中心

参考 `PRD.md` 了解完整的功能规划。

