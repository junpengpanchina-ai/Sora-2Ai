# Supabase 快速配置清单

## 📝 配置步骤（按顺序执行）

### 1️⃣ 创建 Supabase 项目

- [ ] 访问 https://supabase.com 并登录
- [ ] 点击 "New Project"
- [ ] 填写项目信息：
  - Name: `Sora-2Ai`
  - Database Password: `[设置强密码并保存]`
  - Region: `[选择最近的区域]`
- [ ] 等待项目创建完成（2-3分钟）

### 2️⃣ 获取 API 凭据

- [ ] 进入 **Settings** > **API**
- [ ] 复制 **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 复制 **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 复制 **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### 3️⃣ 配置环境变量

- [ ] 创建 `.env.local` 文件
- [ ] 填入 Supabase 配置：
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  ```

### 4️⃣ 执行数据库迁移

- [ ] 进入 **SQL Editor**
- [ ] 执行 `supabase/migrations/001_create_users_table.sql`
- [ ] 执行 `supabase/migrations/002_handle_new_user_trigger.sql`
- [ ] 验证 `users` 表已创建（进入 **Table Editor** 查看）

### 5️⃣ 配置 Google OAuth Provider

- [ ] 进入 **Authentication** > **Providers**
- [ ] 启用 **Google** provider
- [ ] 填写：
  - Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
  - Client Secret: `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`
- [ ] 点击 **Save**

### 6️⃣ 更新 Google Cloud Console

- [ ] 访问 Google Cloud Console
- [ ] 进入 **APIs & Services** > **Credentials**
- [ ] 编辑 OAuth 2.0 客户端
- [ ] 添加重定向 URI: `https://your-project-id.supabase.co/auth/v1/callback`
- [ ] 点击 **Save**

### 7️⃣ 测试连接

- [ ] 运行 `npm run check-env` 检查环境变量
- [ ] 运行 `npm run test:supabase` 测试 Supabase 连接
- [ ] 运行 `npm run dev` 启动开发服务器
- [ ] 访问 http://localhost:3000 测试登录

---

## 🎯 快速命令

```bash
# 检查环境变量
npm run check-env

# 测试 Supabase 连接
npm run test:supabase

# 启动开发服务器
npm run dev
```

---

## 📚 详细文档

- `SUPABASE_SETUP.md` - 完整配置指南
- `CONFIG.md` - 综合配置说明
- `CHECKLIST.md` - 配置检查清单

