# 登录问题排查指南

## 🔍 常见登录失败原因

### 1. Supabase Google Provider 未正确配置

**症状**: 点击登录后没有反应，或显示 "OAuth 配置错误"

**检查步骤**:
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 "Sora AI Platform"
3. 进入 **Authentication** > **Providers**
4. 确认 **Google** provider 已启用（开关打开）
5. 检查 Client ID 和 Client Secret 是否正确填写
6. 确认已点击 **Save** 保存

**解决方案**:
- 如果未启用，点击启用
- 如果凭据错误，重新填写：
  - Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
  - Client Secret: `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`
- 保存后等待几秒钟让配置生效

### 2. Google Cloud Console 重定向 URI 配置错误

**症状**: 显示 "redirect_uri_mismatch" 错误

**检查步骤**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** > **Credentials**
3. 点击您的 OAuth 2.0 客户端 ID
4. 检查 **Authorized redirect URIs** 列表

**必须包含的 URI**:
```
http://localhost:3000/api/auth/callback
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

**解决方案**:
- 如果缺少任何一个，点击 **+ ADD URI** 添加
- 确保 URI 完全匹配（包括协议 http/https）
- 点击 **Save** 保存
- 等待几分钟让更改生效

### 3. 环境变量未正确加载

**症状**: 连接 Supabase 失败

**检查步骤**:
```bash
npm run check-env
```

**解决方案**:
- 确认 `.env.local` 文件存在
- 确认文件中的值正确
- 重启开发服务器：`npm run dev`

### 4. 代码错误或网络问题

**症状**: 其他未知错误

**检查步骤**:
1. 打开浏览器开发者工具（F12）
2. 查看 **Console** 标签页的错误信息
3. 查看 **Network** 标签页的请求状态
4. 查看开发服务器的终端输出

**解决方案**:
- 根据错误信息定位问题
- 检查网络连接
- 检查 Supabase 项目状态

## 🛠️ 调试步骤

### 步骤 1: 检查 Supabase 配置

```bash
# 测试 Supabase 连接
npm run test:supabase
```

应该显示所有测试通过。

### 步骤 2: 检查环境变量

```bash
# 检查环境变量配置
npm run check-env
```

应该显示所有必需变量已配置。

### 步骤 3: 查看详细错误

1. 打开浏览器开发者工具（F12）
2. 访问登录页面
3. 点击登录按钮
4. 查看 Console 和 Network 标签页的错误信息

### 步骤 4: 检查 Supabase 日志

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 **Logs** > **Auth Logs**
3. 查看最近的认证尝试记录
4. 查找错误信息

## 📋 快速检查清单

- [ ] Supabase 项目状态为 "Active"
- [ ] Google Provider 已启用
- [ ] Google Provider 的 Client ID 和 Secret 已正确填写
- [ ] Google Cloud Console 中的重定向 URI 已添加
- [ ] `.env.local` 文件存在且配置正确
- [ ] 开发服务器正在运行
- [ ] 浏览器控制台没有错误
- [ ] 网络连接正常

## 🔧 重置配置

如果问题持续，可以尝试重置：

1. **重新配置 Supabase Google Provider**:
   - 在 Supabase 中禁用 Google Provider
   - 等待几秒钟
   - 重新启用并填写凭据
   - 保存

2. **清除浏览器缓存**:
   - 清除浏览器缓存和 Cookie
   - 或使用隐私模式测试

3. **重启开发服务器**:
   ```bash
   # 停止服务器 (Ctrl+C)
   # 重新启动
   npm run dev
   ```

## 📞 获取帮助

如果以上步骤都无法解决问题，请提供以下信息：

1. 浏览器控制台的错误信息
2. 开发服务器的终端输出
3. Supabase Dashboard 中的 Auth Logs
4. 具体的错误消息

## ✅ 验证成功标志

登录成功时应该看到：

1. ✅ 点击登录按钮后跳转到 Google 授权页面
2. ✅ 授权后自动返回应用
3. ✅ 显示用户信息（头像、名称、邮箱）
4. ✅ Supabase `users` 表中有用户记录
5. ✅ 可以正常退出登录

