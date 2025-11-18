# 获取 Supabase Service Role Key 指南

## 📋 为什么需要 Service Role Key？

Service Role Key 用于：
- ✅ 管理员功能（访问所有数据，包括未发布的提示词）
- ✅ 服务器端操作（webhook、支付处理等）
- ✅ 测试 RLS 策略
- ✅ 数据库迁移和管理

## 🔑 获取步骤

### 步骤 1: 访问 Supabase Dashboard

1. 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. 登录你的账号
3. 选择项目：**Sora AI Platform** (hgzpzsiafycwlqrkzbis)

### 步骤 2: 进入 API 设置

1. 在左侧菜单中，点击 **Settings**（设置）
2. 点击 **API**
3. 找到 **Project API keys** 部分

### 步骤 3: 获取 Service Role Key

1. 找到 **service_role** key（通常在 anon public key 下方）
2. 点击 **Reveal**（显示）按钮
3. **复制** 整个 key（以 `eyJ` 开头的长字符串）

⚠️ **重要提示**：
- Service Role Key 具有**完全访问权限**，可以绕过所有 RLS 策略
- **不要**将 Service Role Key 提交到 Git 仓库
- **不要**在客户端代码中使用 Service Role Key
- 仅用于服务器端操作

### 步骤 4: 配置到 .env.local

1. 打开项目根目录的 `.env.local` 文件
2. 找到被注释的行：
   ```env
   # SUPABASE_SERVICE_ROLE_KEY=需要从 Supabase Dashboard > Settings > API 获取
   ```
3. 取消注释并填入你的 key：
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.你的完整key...
   ```

### 步骤 5: 验证配置

运行测试脚本验证配置：

```bash
npm run test:admin-prompts
```

如果配置正确，应该看到：
- ✅ service_role 可以访问 prompt_library
- ✅ 可以获取所有提示词（包括未发布的）
- ✅ 可以创建和更新提示词

## 🔒 安全注意事项

1. **永远不要**将 Service Role Key 提交到 Git
2. **确保** `.env.local` 在 `.gitignore` 中
3. **仅在服务器端**使用 Service Role Key
4. **定期轮换** Service Role Key（如果可能）

## 📝 示例配置

`.env.local` 文件应该包含：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ❓ 常见问题

### Q: 找不到 service_role key？
A: 确保你登录的是项目所有者账号，某些权限可能需要项目所有者才能查看。

### Q: 配置后仍然报错？
A: 
1. 检查 key 是否完整复制（没有遗漏字符）
2. 确保 `.env.local` 文件格式正确（没有多余的空格）
3. 重启开发服务器（如果正在运行）

### Q: 可以分享 Service Role Key 吗？
A: **绝对不要！** Service Role Key 等同于数据库的 root 权限，泄露会导致严重的安全问题。

