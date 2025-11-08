# 登录功能测试指南

## ✅ 配置完成

所有配置步骤已完成：
- [x] Supabase 项目已创建
- [x] 数据库迁移已执行
- [x] users 表已创建
- [x] Google OAuth Provider 已配置
- [x] Google Cloud Console 重定向 URI 已添加
- [x] 开发服务器已启动

## 🧪 测试步骤

### 1. 访问应用

打开浏览器访问：
```
http://localhost:3000
```

### 2. 预期行为

1. **自动重定向到登录页**
   - 如果未登录，应该自动重定向到 `/login`
   - 看到登录页面，显示 "使用 Google 账号登录" 按钮

2. **点击登录按钮**
   - 点击 "使用 Google 账号登录"
   - 应该跳转到 Google OAuth 授权页面

3. **Google 授权**
   - 选择 Google 账号
   - 点击 "允许" 授权
   - 应该自动重定向回应用

4. **登录成功**
   - 应该看到首页，显示用户信息
   - 导航栏显示用户头像和名称
   - 显示 "退出登录" 按钮

### 3. 验证数据库

登录成功后，验证用户数据是否已保存：

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **Table Editor**
4. 点击 `users` 表
5. 应该能看到您的用户记录，包含：
   - `google_id`: Google 用户 ID
   - `email`: 您的邮箱
   - `name`: 您的名称
   - `avatar_url`: 头像 URL
   - `created_at`: 创建时间
   - `last_login_at`: 最后登录时间

## 🐛 常见问题排查

### 问题 1: 点击登录后没有反应

**可能原因**:
- Supabase 中的 Google Provider 未正确配置
- 环境变量未正确加载

**解决方案**:
1. 检查 Supabase Dashboard 中的 Google Provider 是否已启用
2. 检查 `.env.local` 文件中的配置
3. 重启开发服务器：`npm run dev`

### 问题 2: 授权后无法返回应用

**可能原因**:
- Google Cloud Console 中的重定向 URI 未正确配置
- Supabase 回调地址未添加

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI 列表
2. 确认已添加：`https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
3. 确认已添加：`http://localhost:3000/api/auth/callback`

### 问题 3: 登录成功但用户信息未显示

**可能原因**:
- 用户数据未保存到数据库
- 触发器未正常工作

**解决方案**:
1. 检查 Supabase Dashboard 中的 `users` 表是否有记录
2. 检查 `auth.users` 表中是否有用户记录
3. 查看 Supabase 日志了解错误信息

### 问题 4: 出现 "redirect_uri_mismatch" 错误

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI
2. 确保包含以下所有 URI：
   - `http://localhost:3000/api/auth/callback`
   - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
3. 保存后等待几分钟让更改生效

## ✅ 成功标志

如果看到以下内容，说明登录功能正常工作：

1. ✅ 能够成功跳转到 Google 授权页面
2. ✅ 授权后能返回应用
3. ✅ 首页显示用户信息（头像、名称、邮箱）
4. ✅ `users` 表中有用户记录
5. ✅ 可以正常退出登录

## 🎉 完成！

如果所有测试都通过，恭喜您！Google OAuth 登录功能已完全配置成功。

接下来可以：
- 开始开发视频生成功能
- 添加更多用户功能
- 完善 UI 界面

## 📚 相关文档

- `FINAL_SETUP.md` - 配置步骤
- `CURRENT_STATUS.md` - 当前状态
- `SUPABASE_SETUP.md` - Supabase 详细配置

