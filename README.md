# Sora-2Ai - AI 视频生成平台

基于 Next.js 14 的现代化 AI 视频生成工具网站。

## 技术栈

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (数据库和认证)
- **Google OAuth 2.0**

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并填写配置。**Google OAuth 凭据已准备好**，请参考 `CONFIG.md` 快速配置。

```bash
# 查看配置指南
cat CONFIG.md
```

**Google OAuth 凭据**（已提供）：
- 客户端 ID: `*********.apps.googleusercontent.com`
- 客户端密钥: `************`

⚠️ **重要**: 需要在 Google Cloud Console 中配置重定向 URI（见 `CONFIG.md`）

### 3. Supabase 设置

**📖 详细配置指南请参考: `SUPABASE_SETUP.md`**

#### 快速步骤：

1. **创建 Supabase 项目**
   - 访问 [Supabase](https://supabase.com) 并创建新项目
   - 获取 Project URL、Anon Key 和 Service Role Key

2. **配置环境变量**
   - 在 `.env.local` 中填入 Supabase 凭据

3. **执行数据库迁移**
   - 在 Supabase SQL Editor 中运行迁移文件

4. **配置 Google OAuth Provider**
   - 在 Supabase 中启用 Google provider
   - 填入 Google OAuth 凭据

5. **测试连接**
   ```bash
   npm run test:supabase
   ```

### 4. Google OAuth 设置

#### 4.1 创建 Google OAuth 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 **Google+ API**
4. 进入 **Credentials** > **Create Credentials** > **OAuth client ID**
5. 选择 **Web application**
6. 配置授权重定向 URI：
   - 开发环境：`http://localhost:3000/api/auth/callback`
   - 生产环境：`https://yourdomain.com/api/auth/callback`
   - Supabase 回调：`https://your-project.supabase.co/auth/v1/callback`
7. 获取 **Client ID** 和 **Client Secret**

#### 4.2 配置环境变量

将获取的 Client ID 和 Client Secret 填入 `.env.local`：

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### 4.3 在 Supabase 中配置

在 Supabase Dashboard 的 Google Provider 设置中填入相同的 Client ID 和 Client Secret。

### 5. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
sora-2ai/
├── app/                    # Next.js App Router
│   ├── api/                 # API 路由
│   │   └── auth/            # 认证相关 API
│   ├── login/               # 登录页面
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   └── globals.css          # 全局样式
├── components/              # React 组件
│   └── LogoutButton.tsx     # 退出登录按钮
├── lib/                     # 工具函数
│   └── supabase/           # Supabase 客户端
│       ├── client.ts        # 浏览器客户端
│       ├── server.ts        # 服务器客户端
│       └── middleware.ts   # 中间件
├── supabase/               # Supabase 相关
│   └── migrations/         # 数据库迁移文件
├── middleware.ts           # Next.js 中间件
└── .env.example            # 环境变量示例
```

## 功能特性

### ✅ 已实现

- [x] Google OAuth 登录
- [x] 用户信息存储到 Supabase
- [x] 会话管理
- [x] 受保护路由
- [x] 响应式 UI 设计
- [ ] 视频生成功能
- [ ] 历史记录页面
- [ ] 用户中心
- [ ] grsai.com API 集成

## 开发指南

### 认证流程

1. 用户点击登录按钮
2. 重定向到 `/api/auth/login`
3. 调用 Supabase Auth 的 `signInWithOAuth` 方法
4. 重定向到 Google OAuth 授权页面
5. 用户授权后，Google 重定向到 Supabase 回调
6. Supabase 处理认证并重定向到 `/api/auth/callback`
7. 应用获取用户信息并保存到 `users` 表
8. 重定向到首页

### 数据库表结构

#### users 表

- `id`: UUID (主键)
- `google_id`: TEXT (唯一，Google 用户 ID)
- `email`: TEXT (唯一，用户邮箱)
- `name`: TEXT (用户名称)
- `avatar_url`: TEXT (头像 URL)
- `created_at`: TIMESTAMP (创建时间)
- `updated_at`: TIMESTAMP (更新时间)
- `last_login_at`: TIMESTAMP (最后登录时间)
- `status`: TEXT (账户状态: active/inactive/banned)

## 部署

### Vercel 部署

1. 将代码推送到 GitHub
2. 在 [Vercel](https://vercel.com) 中导入项目
3. 配置环境变量
4. 部署

### 环境变量配置

确保在生产环境中配置所有必需的环境变量。

## 许可证

MIT

