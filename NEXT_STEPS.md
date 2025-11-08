# 下一步操作指南

## ✅ 已完成

- [x] Google OAuth 凭据已配置
- [x] Supabase 环境变量已配置
  - Project URL: `https://hgzpzsiafycwlqrkzbis.supabase.co`
  - Anon Key: 已配置

## 📋 待完成步骤

### 1. 获取 Service Role Key（可选但推荐）

**位置**: Supabase Dashboard > Settings > API > service_role

**用途**: 服务器端操作需要（如数据库迁移、管理员操作等）

**步骤**:
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **Settings** > **API**
4. 找到 **service_role** key
5. 点击 **Reveal** 显示
6. 复制并添加到 `.env.local` 文件：
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

### 2. 执行数据库迁移 ⚠️ 重要

**必须在 Supabase Dashboard 中执行**：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **SQL Editor**
4. 点击 **New query**

#### 迁移 1: 创建 users 表

1. 打开项目中的文件：`supabase/migrations/001_create_users_table.sql`
2. 复制全部内容
3. 在 Supabase SQL Editor 中粘贴
4. 点击 **Run** 执行
5. 确认显示 "Success"

#### 迁移 2: 创建用户触发器

1. 在 SQL Editor 中点击 **New query**
2. 打开项目中的文件：`supabase/migrations/002_handle_new_user_trigger.sql`
3. 复制全部内容
4. 在 Supabase SQL Editor 中粘贴
5. 点击 **Run** 执行
6. 确认显示 "Success"

#### 验证表创建

1. 在 Supabase Dashboard 中，进入 **Table Editor**
2. 应该能看到 `users` 表
3. 点击查看表结构是否正确

### 3. 配置 Google OAuth Provider

1. 在 Supabase Dashboard 中，进入 **Authentication** > **Providers**
2. 找到 **Google** provider
3. 点击启用（切换开关）
4. 填写以下信息：
   - **Client ID (for OAuth)**: 
     ```
     222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: 
     ```
     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
     ```
5. 点击 **Save**

### 4. 更新 Google Cloud Console 重定向 URI

⚠️ **重要**: 必须添加 Supabase 的回调地址

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** > **Credentials**
3. 点击您的 OAuth 2.0 客户端 ID
4. 在 **Authorized redirect URIs** 中添加：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   ```
5. 点击 **Save**

### 5. 测试连接

```bash
# 检查环境变量（已完成 ✅）
npm run check-env

# 测试 Supabase 连接
npm run test:supabase

# 如果测试失败，可能是：
# 1. 数据库迁移未执行
# 2. 表权限问题
```

### 6. 启动开发服务器

```bash
# 安装依赖（如果还没安装）
npm install

# 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 测试登录功能。

## 🎯 快速检查清单

- [ ] Service Role Key 已添加到 `.env.local`（可选）
- [ ] 数据库迁移 `001_create_users_table.sql` 已执行
- [ ] 数据库迁移 `002_handle_new_user_trigger.sql` 已执行
- [ ] `users` 表已创建并验证
- [ ] Google Provider 已在 Supabase 中启用
- [ ] Google OAuth 凭据已填入 Supabase
- [ ] Google Cloud Console 中已添加 Supabase 回调 URI
- [ ] 运行 `npm run test:supabase` 测试通过
- [ ] 启动开发服务器并测试登录

## 🐛 常见问题

### 问题: 测试 Supabase 连接失败

**可能原因**:
1. 数据库迁移未执行 → 执行迁移文件
2. 表权限问题 → 检查 RLS 策略
3. 网络问题 → 检查 Supabase 项目状态

### 问题: 登录后用户信息未保存

**解决方案**:
1. 检查触发器是否已创建（迁移 2）
2. 查看 Supabase 日志
3. 验证 `auth.users` 表中是否有用户记录

### 问题: Google 登录后无法返回

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI
2. 确认 Supabase 回调地址已添加
3. 验证 Supabase 中的 Google Provider 配置

## 📚 相关文档

- `SUPABASE_SETUP.md` - 详细配置指南
- `SUPABASE_CREDENTIALS.md` - 凭据信息
- `SUPABASE_QUICK_START.md` - 快速开始

---

**完成以上步骤后，您的 Google OAuth 登录功能就可以正常工作了！** 🎉

