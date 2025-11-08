# 快速开始指南

## ✅ 已完成的功能

Google OAuth 登录功能已完全实现，包括：

1. ✅ Next.js 14 项目初始化（App Router）
2. ✅ Tailwind CSS 配置
3. ✅ Supabase 客户端配置（浏览器端、服务器端、中间件）
4. ✅ Google OAuth 认证流程
5. ✅ 用户信息自动保存到 Supabase 数据库
6. ✅ 登录/登出功能
7. ✅ 受保护路由（未登录自动重定向）
8. ✅ 响应式 UI 设计
9. ✅ 数据库表结构和触发器

## 🚀 快速启动（3 步）

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件，参考 `.env.example` 填写：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可看到登录页面。

## 📋 详细设置步骤

请参考 `SETUP.md` 文件获取完整的配置指南，包括：
- Supabase 项目创建和配置
- Google OAuth 客户端创建
- 数据库迁移执行
- 常见问题排查

## 📁 项目结构

```
sora-2ai/
├── app/
│   ├── api/auth/          # 认证 API 路由
│   │   ├── callback/      # OAuth 回调处理
│   │   ├── login/         # 登录入口
│   │   └── logout/        # 登出处理
│   ├── login/             # 登录页面
│   ├── page.tsx           # 首页（受保护）
│   ├── layout.tsx         # 根布局
│   └── globals.css        # 全局样式
├── components/
│   └── LogoutButton.tsx   # 登出按钮组件
├── lib/supabase/
│   ├── client.ts          # 浏览器端 Supabase 客户端
│   ├── server.ts          # 服务器端 Supabase 客户端
│   └── middleware.ts      # 中间件 Supabase 客户端
├── supabase/migrations/   # 数据库迁移文件
│   ├── 001_create_users_table.sql
│   └── 002_handle_new_user_trigger.sql
├── types/
│   └── database.ts        # TypeScript 类型定义
└── middleware.ts          # Next.js 中间件
```

## 🔐 认证流程

1. 用户访问网站 → 自动检查登录状态
2. 未登录 → 重定向到 `/login`
3. 点击 "使用 Google 账号登录" → 调用 `/api/auth/login`
4. 重定向到 Google OAuth 授权页面
5. 用户授权 → Google 重定向到 Supabase
6. Supabase 处理认证 → 重定向到 `/api/auth/callback`
7. 应用获取用户信息 → 保存到 `users` 表
8. 重定向到首页 → 显示用户信息

## 🎨 UI 特性

- 现代化渐变背景
- 响应式设计（支持移动端）
- 暗色模式支持（自动检测系统偏好）
- Google 品牌按钮样式
- 友好的错误提示

## 🔧 下一步开发

根据 PRD 文档，接下来可以实现：

1. **视频生成模块**
   - 视频生成表单
   - grsai.com API 集成
   - 任务状态管理

2. **历史记录模块**
   - 视频列表展示
   - 搜索和筛选
   - 分页功能

3. **用户中心**
   - 个人资料编辑
   - 使用统计
   - 账户设置

## 📝 注意事项

1. **环境变量安全**：`.env.local` 文件已添加到 `.gitignore`，不会提交到 Git
2. **数据库迁移**：首次部署前必须在 Supabase 中执行迁移文件
3. **Google OAuth**：确保重定向 URI 配置正确，包括 Supabase 回调地址
4. **生产环境**：部署前更新所有生产环境的重定向 URI

## 🐛 问题排查

如果遇到问题，请检查：

1. ✅ 环境变量是否正确配置
2. ✅ Supabase 项目是否已创建并配置
3. ✅ 数据库迁移是否已执行
4. ✅ Google OAuth 客户端是否已创建
5. ✅ 重定向 URI 是否已正确配置
6. ✅ 浏览器控制台是否有错误信息

更多帮助请参考 `SETUP.md` 中的"常见问题"部分。

