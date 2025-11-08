# 最后配置步骤

## ✅ 已完成

- [x] Supabase 项目已创建
- [x] 环境变量已配置
- [x] 数据库迁移已执行
- [x] users 表已创建
- [x] 触发器已配置
- [x] Supabase 连接测试通过

## 📋 剩余配置（2步）

### 步骤 1: 在 Supabase 中配置 Google OAuth Provider

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **Authentication** > **Providers**
4. 找到 **Google** provider
5. 点击启用（切换开关打开）
6. 填写以下信息：
   - **Client ID (for OAuth)**: 
     ```
     222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: 
     ```
     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
     ```
7. 点击 **Save** 保存

### 步骤 2: 更新 Google Cloud Console 重定向 URI

⚠️ **重要**: 必须添加 Supabase 的回调地址

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择项目（项目编号：222103705593）
3. 进入 **APIs & Services** > **Credentials**
4. 点击您的 OAuth 2.0 客户端 ID
5. 在 **Authorized redirect URIs** 部分，点击 **+ ADD URI**
6. 添加以下 URI：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   ```
7. 点击 **Save** 保存

## 🧪 测试登录功能

完成上述配置后，启动开发服务器测试：

```bash
# 启动开发服务器
npm run dev
```

然后：

1. 打开浏览器访问 `http://localhost:3000`
2. 应该自动重定向到登录页面
3. 点击 "使用 Google 账号登录"
4. 选择 Google 账号并授权
5. 应该能成功登录并看到用户信息

## ✅ 验证清单

- [ ] Google Provider 已在 Supabase 中启用
- [ ] Google OAuth 凭据已填入 Supabase
- [ ] Google Cloud Console 中已添加 Supabase 回调 URI
- [ ] 开发服务器已启动
- [ ] 登录功能测试成功
- [ ] 用户信息已保存到 users 表

## 🎉 完成！

完成以上步骤后，您的 Google OAuth 登录功能就可以正常工作了！

如果遇到任何问题，请查看：
- `CURRENT_STATUS.md` - 当前状态
- `NEXT_STEPS.md` - 详细步骤
- Supabase Dashboard 的日志

