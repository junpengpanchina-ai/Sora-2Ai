# Google OAuth 配置说明

## 您的 Google OAuth 凭据

**项目编号**: 222103705593  
**项目名称**: skilled-acolyte-476516-g8

**客户端 ID**: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`  
**客户端密钥**: `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`

## ⚠️ 重要安全提示

1. **不要将 `.env.local` 文件提交到 Git**（已添加到 .gitignore）
2. **不要在公开场合分享客户端密钥**
3. **如果密钥泄露，请立即在 Google Cloud Console 中重新生成**

## 配置步骤

### 1. 配置重定向 URI

在 [Google Cloud Console](https://console.cloud.google.com/) 中：

1. 进入 **APIs & Services** > **Credentials**
2. 点击您的 OAuth 2.0 客户端 ID
3. 在 **Authorized redirect URIs** 中添加以下 URI：

#### 开发环境
```
http://localhost:3000/api/auth/callback
```

#### Supabase 回调（必需）
```
https://your-project-id.supabase.co/auth/v1/callback
```
⚠️ 将 `your-project-id` 替换为您的 Supabase 项目 ID

#### 生产环境（部署后添加）
```
https://yourdomain.com/api/auth/callback
```

### 2. 配置环境变量

创建 `.env.local` 文件（参考 `.env.local.template`）：

```env
GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### 3. 在 Supabase 中配置

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入您的项目
3. 进入 **Authentication** > **Providers**
4. 找到 **Google** provider 并启用
5. 填写以下信息：
   - **Client ID (for OAuth)**: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: `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`
6. 点击 **Save**

### 4. 验证配置

1. 运行开发服务器：`npm run dev`
2. 访问 `http://localhost:3000`
3. 点击 "使用 Google 账号登录"
4. 应该能正常跳转到 Google 授权页面

## 常见问题

### Q: 出现 "redirect_uri_mismatch" 错误

**A**: 确保在 Google Cloud Console 中已添加所有必需的重定向 URI，特别是 Supabase 的回调地址。

### Q: 授权后无法返回应用

**A**: 检查 Supabase 中的 Google Provider 配置是否正确，确保 Client ID 和 Secret 都已正确填写。

### Q: 用户信息未保存到数据库

**A**: 
1. 确保已执行数据库迁移（`supabase/migrations/001_create_users_table.sql`）
2. 检查 Supabase 日志查看是否有错误
3. 验证 `users` 表的权限设置

## 下一步

完成 Google OAuth 配置后，您可以：
1. 测试登录功能
2. 继续开发视频生成功能
3. 参考 `SETUP.md` 完成 Supabase 配置

   NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q
   NEXT_PUBLIC_APP_URL=https://sora2aivideos.com