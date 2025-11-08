# 配置检查清单

使用此清单确保所有配置都已完成。

## ✅ Google OAuth 配置

- [x] Google OAuth 凭据已提供
  - 客户端 ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
  - 客户端密钥: `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`

- [ ] 在 Google Cloud Console 中配置重定向 URI
  - [ ] `http://localhost:3000/api/auth/callback` (开发环境)
  - [ ] `https://your-project-id.supabase.co/auth/v1/callback` (Supabase 回调)
  - [ ] 生产环境 URI（部署后添加）

## ✅ 环境变量配置

- [ ] 创建 `.env.local` 文件
- [ ] 填写 `GOOGLE_CLIENT_ID`
- [ ] 填写 `GOOGLE_CLIENT_SECRET`
- [ ] 填写 Supabase 相关变量（见下方）
- [ ] 运行 `npm run check-env` 验证配置

## ✅ Supabase 配置

**📖 详细步骤请参考: `SUPABASE_SETUP.md`**

- [ ] 创建 Supabase 项目
- [ ] 获取 Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- [ ] 获取 Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 获取 Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 在 `.env.local` 中配置 Supabase 环境变量
- [ ] 执行数据库迁移：
  - [ ] `supabase/migrations/001_create_users_table.sql`
  - [ ] `supabase/migrations/002_handle_new_user_trigger.sql`
- [ ] 验证 `users` 表已创建
- [ ] 在 Supabase 中配置 Google Provider：
  - [ ] 启用 Google provider
  - [ ] 填写 Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
  - [ ] 填写 Client Secret: `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`
  - [ ] 保存配置
- [ ] 在 Google Cloud Console 中添加 Supabase 回调 URI
- [ ] 运行 `npm run test:supabase` 测试连接

## ✅ 项目设置

- [ ] 运行 `npm install` 安装依赖
- [ ] 运行 `npm run check-env` 检查环境变量
- [ ] 运行 `npm run dev` 启动开发服务器
- [ ] 访问 `http://localhost:3000` 测试登录

## 📝 快速命令

```bash
# 1. 安装依赖
npm install

# 2. 检查环境变量配置
npm run check-env

# 3. 启动开发服务器
npm run dev
```

## 🔗 相关文档

- `CONFIG.md` - 快速配置指南（**推荐先看这个**）
- `SETUP.md` - 详细设置步骤
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth 详细说明
- `QUICK_START.md` - 快速开始指南

## ⚠️ 常见问题

### 重定向 URI 配置错误

如果看到 "redirect_uri_mismatch" 错误：
1. 检查 Google Cloud Console 中的重定向 URI 列表
2. 确保包含 Supabase 的回调地址
3. 确保 URI 完全匹配（包括协议 http/https）

### 用户信息未保存

如果登录成功但用户信息未保存到数据库：
1. 检查数据库迁移是否已执行
2. 检查 Supabase 日志
3. 验证 `users` 表的权限设置

### 环境变量未生效

如果环境变量未生效：
1. 确保文件名为 `.env.local`（不是 `.env`）
2. 重启开发服务器
3. 运行 `npm run check-env` 验证配置

