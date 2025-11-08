# Supabase 配置指南

## 📋 配置步骤概览

1. 创建 Supabase 项目
2. 获取 API 凭据
3. 配置环境变量
4. 执行数据库迁移
5. 配置 Google OAuth Provider
6. 测试连接

---

## 步骤 1: 创建 Supabase 项目

### 1.1 访问 Supabase

1. 打开浏览器访问 [Supabase](https://supabase.com)
2. 点击 **Sign In** 登录（如果没有账号，先注册）
3. 登录后，点击 **New Project** 创建新项目

### 1.2 填写项目信息

在创建项目页面填写：

- **Name**: `Sora-2Ai`（或您喜欢的名称）
- **Database Password**: 
  - ⚠️ **重要**: 设置一个强密码并**妥善保存**
  - 建议使用密码管理器保存
  - 如果忘记密码，需要重置数据库
- **Region**: 选择离您最近的区域
  - 推荐：`Southeast Asia (Singapore)` 或 `East Asia (Tokyo)`
- **Pricing Plan**: 选择 **Free**（免费计划足够开发使用）

### 1.3 等待项目创建

- 点击 **Create new project**
- 等待 2-3 分钟，项目创建完成后会自动跳转到 Dashboard

---

## 步骤 2: 获取 API 凭据

### 2.1 进入 API 设置

1. 在 Supabase Dashboard 左侧菜单中，点击 **Settings**（齿轮图标）
2. 点击 **API**

### 2.2 复制凭据

在 API 设置页面，您会看到以下信息：

#### Project URL
- 位置：**Project URL** 部分
- 格式：`https://xxxxxxxxxxxxx.supabase.co`
- 用途：`NEXT_PUBLIC_SUPABASE_URL`
- 操作：点击复制按钮复制

#### API Keys

##### anon public key
- 位置：**Project API keys** > **anon public**
- 用途：`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 说明：公开密钥，用于客户端访问
- 操作：点击 **Reveal** 显示，然后复制

##### service_role key
- 位置：**Project API keys** > **service_role**
- 用途：`SUPABASE_SERVICE_ROLE_KEY`
- 说明：⚠️ **保密**，仅用于服务器端，不要暴露给客户端
- 操作：点击 **Reveal** 显示，然后复制

### 2.3 记录凭据

将以下信息复制到安全的地方（或直接填入 `.env.local`）：

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 步骤 3: 配置环境变量

### 3.1 创建或编辑 `.env.local` 文件

在项目根目录创建 `.env.local` 文件（如果还没有）：

```bash
# 在项目根目录执行
touch .env.local
```

### 3.2 填写 Supabase 配置

编辑 `.env.local` 文件，添加 Supabase 相关配置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth（已配置）
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

⚠️ **重要**: 
- 将 `your-project-id` 替换为您的实际项目 ID
- 将 `your_anon_key_here` 替换为实际的 anon key
- 将 `your_service_role_key_here` 替换为实际的 service_role key

---

## 步骤 4: 执行数据库迁移

### 4.1 打开 SQL Editor

1. 在 Supabase Dashboard 左侧菜单中，点击 **SQL Editor**
2. 点击 **New query** 创建新查询

### 4.2 执行第一个迁移文件

1. 打开项目中的 `supabase/migrations/001_create_users_table.sql` 文件
2. 复制全部内容
3. 在 Supabase SQL Editor 中粘贴
4. 点击 **Run** 或按 `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac) 执行
5. 确认执行成功（应该显示 "Success. No rows returned"）

### 4.3 执行第二个迁移文件

1. 在 SQL Editor 中点击 **New query** 创建新查询
2. 打开项目中的 `supabase/migrations/002_handle_new_user_trigger.sql` 文件
3. 复制全部内容
4. 在 Supabase SQL Editor 中粘贴
5. 点击 **Run** 执行
6. 确认执行成功

### 4.4 验证表创建

1. 在 Supabase Dashboard 左侧菜单中，点击 **Table Editor**
2. 应该能看到 `users` 表
3. 点击 `users` 表，查看表结构是否正确

---

## 步骤 5: 配置 Google OAuth Provider

### 5.1 进入 Authentication 设置

1. 在 Supabase Dashboard 左侧菜单中，点击 **Authentication**
2. 点击 **Providers**

### 5.2 启用 Google Provider

1. 在 Provider 列表中找到 **Google**
2. 点击 **Google** 卡片或切换开关启用

### 5.3 填写 OAuth 凭据

在 Google Provider 配置页面填写：

- **Client ID (for OAuth)**: 
  ```
  222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
  ```

- **Client Secret (for OAuth)**: 
  ```
  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
  ```

### 5.4 保存配置

1. 点击页面底部的 **Save** 按钮
2. 确认保存成功

### 5.5 更新 Google Cloud Console 重定向 URI

⚠️ **重要**: 需要在 Google Cloud Console 中添加 Supabase 的回调地址

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** > **Credentials**
3. 点击您的 OAuth 2.0 客户端 ID
4. 在 **Authorized redirect URIs** 中添加：
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
   ⚠️ 将 `your-project-id` 替换为您的 Supabase 项目 ID
5. 点击 **Save**

---

## 步骤 6: 测试连接

### 6.1 检查环境变量

运行配置检查脚本：

```bash
npm run check-env
```

应该显示所有必需的环境变量已配置。

### 6.2 测试 Supabase 连接

运行测试脚本（如果已创建）：

```bash
npm run test:supabase
```

或手动测试：

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 访问 `http://localhost:3000`
3. 应该自动重定向到登录页面
4. 点击 "使用 Google 账号登录"
5. 完成 Google 授权
6. 应该能成功登录并看到用户信息

### 6.3 验证数据库记录

1. 登录成功后，在 Supabase Dashboard 中进入 **Table Editor**
2. 点击 `users` 表
3. 应该能看到您的用户记录
4. 检查数据是否正确：
   - `google_id`: 您的 Google 用户 ID
   - `email`: 您的邮箱
   - `name`: 您的名称
   - `avatar_url`: 头像 URL（如果有）

---

## ✅ 配置完成检查清单

- [ ] Supabase 项目已创建
- [ ] 已获取并配置 `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 已获取并配置 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 已获取并配置 `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 环境变量已填入 `.env.local` 文件
- [ ] 数据库迁移文件 `001_create_users_table.sql` 已执行
- [ ] 数据库迁移文件 `002_handle_new_user_trigger.sql` 已执行
- [ ] `users` 表已创建并验证
- [ ] Google Provider 已在 Supabase 中启用
- [ ] Google OAuth 凭据已填入 Supabase
- [ ] Google Cloud Console 中已添加 Supabase 回调 URI
- [ ] 测试登录功能成功
- [ ] 用户数据已保存到 `users` 表

---

## 🐛 常见问题

### 问题 1: 无法连接到 Supabase

**症状**: 启动应用时出现连接错误

**解决方案**:
1. 检查 `.env.local` 文件中的 URL 和 Key 是否正确
2. 确认 Supabase 项目状态为 "Active"
3. 检查网络连接
4. 验证环境变量名称是否正确（注意大小写）

### 问题 2: 数据库迁移失败

**症状**: 执行 SQL 时出现错误

**解决方案**:
1. 检查 SQL 语法是否正确
2. 确认是否有权限执行（应该使用默认的 postgres 用户）
3. 如果表已存在，可能需要先删除：`DROP TABLE IF EXISTS users CASCADE;`
4. 查看 Supabase 日志了解详细错误信息

### 问题 3: 用户信息未保存到数据库

**症状**: 登录成功但 `users` 表中没有记录

**解决方案**:
1. 检查触发器是否已创建（执行 `002_handle_new_user_trigger.sql`）
2. 检查 `users` 表的权限设置
3. 查看 Supabase 日志
4. 手动检查 `auth.users` 表中是否有用户记录

### 问题 4: Google 登录后无法返回应用

**症状**: Google 授权后停留在 Supabase 页面

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI 配置
2. 确认 Supabase 回调地址已添加
3. 检查 Supabase 中的 Google Provider 配置是否正确

---

## 📚 相关文档

- [Supabase 官方文档](https://supabase.com/docs)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- `CONFIG.md` - 完整配置指南
- `CHECKLIST.md` - 配置检查清单

---

## 🎉 下一步

Supabase 配置完成后，您可以：

1. ✅ 测试完整的登录流程
2. 🚀 开始开发视频生成功能
3. 📊 查看用户数据统计
4. 🔧 根据需要调整数据库结构

如有问题，请查看 Supabase Dashboard 的日志或联系支持。

