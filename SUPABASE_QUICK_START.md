# Supabase 快速开始

## 🚀 5 分钟快速配置

### 步骤 1: 创建项目（2分钟）

1. 访问 https://supabase.com 并登录
2. 点击 **New Project**
3. 填写：
   - Name: `Sora-2Ai`
   - Password: `[设置强密码]`
   - Region: `[选择最近的]`
4. 等待创建完成

### 步骤 2: 获取凭据（1分钟）

1. 进入 **Settings** > **API**
2. 复制以下三个值：
   - **Project URL**
   - **anon public** key
   - **service_role** key

### 步骤 3: 配置环境变量（30秒）

编辑 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 步骤 4: 执行数据库迁移（1分钟）

1. 进入 **SQL Editor**
2. 新建查询，粘贴 `supabase/migrations/001_create_users_table.sql` 内容
3. 点击 **Run**
4. 新建查询，粘贴 `supabase/migrations/002_handle_new_user_trigger.sql` 内容
5. 点击 **Run**

### 步骤 5: 配置 Google OAuth（30秒）

1. 进入 **Authentication** > **Providers**
2. 启用 **Google**
3. 填写：
   - Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - Client Secret: `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`
4. 点击 **Save**

### 步骤 6: 测试（30秒）

```bash
# 检查环境变量
npm run check-env

# 测试 Supabase 连接
npm run test:supabase

# 启动开发服务器
npm run dev
```

## ✅ 完成！

如果所有测试通过，您就可以开始使用 Supabase 了！

## 📚 需要帮助？

- `SUPABASE_SETUP.md` - 详细配置指南
- `scripts/supabase-quick-setup.md` - 配置清单

