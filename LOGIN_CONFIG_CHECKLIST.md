# Google 登录配置检查清单

## ✅ 环境变量检查（已完成）

根据 `npm run test:google-oauth` 的结果，所有环境变量都已正确配置。

## 📋 需要手动检查的配置

### 1. Supabase Dashboard 配置

**访问**: https://supabase.com/dashboard

**检查步骤**:
1. 选择你的项目（项目 ID: `hgzpzsiafycwlqrkzbis`）
2. 进入 **Authentication** > **Providers**
3. 找到 **Google** provider
4. 确认以下配置：

   - [ ] **开关已启用**（应该是绿色/打开状态）
   - [ ] **Client ID (for OAuth)** 正确：
     ```
     222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
     ```
   - [ ] **Client Secret (for OAuth)** 正确：
     ```
     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
     ```
   - [ ] 已点击 **Save** 保存

**如果配置不正确**:
- 更新配置后，等待几秒钟让配置生效
- 重新测试登录

### 2. Google Cloud Console 配置

**访问**: https://console.cloud.google.com/

**检查步骤**:
1. 选择项目（项目编号：222103705593）
2. 进入 **APIs & Services** > **Credentials**
3. 点击你的 OAuth 2.0 客户端 ID
4. 检查 **Authorized redirect URIs** 部分

**必须包含以下 URI**（完全匹配，包括协议）:

   - [ ] `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
   - [ ] `http://localhost:3000/auth/callback`（开发环境）
   - [ ] `http://sora2aivideos.com/auth/callback`（如果使用生产域名）
   - [ ] `https://sora2aivideos.com/auth/callback`（如果使用 HTTPS）

**重要提示**:
- URI 必须完全匹配（包括协议 http/https）
- 不能有多余的斜杠
- 保存后等待几分钟让更改生效

### 3. 浏览器设置检查

**检查项**:
- [ ] 未使用无痕/隐私浏览模式
- [ ] 浏览器允许 Cookie 和网站数据
- [ ] 没有扩展程序阻止 localStorage
- [ ] 已清除旧的缓存和 Cookie

### 4. 测试登录流程

**步骤**:
1. 清除浏览器缓存和 Cookie
2. 打开浏览器开发者工具（F12）
3. 切换到 **Console** 标签页
4. 访问登录页面
5. 点击 "使用 Google 账号登录"
6. 观察控制台日志

**应该看到的日志**:
```
✅ localStorage is available
Initiating OAuth login... { redirectTo: '...' }
⏳ Waiting for code_verifier... (attempt 1/5)
✅ code_verifier saved successfully (attempt X)
code_verifier key: sb-hgzpzsiafycwlqrkzbis-auth-code-verifier
Redirecting to Google OAuth...
```

**如果看到错误**:
- 记录具体的错误信息
- 查看 Network 标签页的失败请求
- 检查 Supabase 和 Google Cloud Console 配置

## 🔍 常见问题

### 问题 1: code_verifier 仍然没有保存

**可能原因**:
- Supabase 客户端配置问题
- 浏览器阻止了 localStorage
- 重定向太快

**解决方案**:
1. 检查浏览器控制台是否有 localStorage 相关的错误
2. 尝试不同的浏览器
3. 检查浏览器扩展程序

### 问题 2: 重定向到 Google 后出错

**可能原因**:
- Google Cloud Console 中的重定向 URI 配置错误
- OAuth 客户端配置问题

**解决方案**:
1. 检查 Google Cloud Console 中的重定向 URI
2. 确认 OAuth 同意屏幕已配置
3. 检查应用状态（Testing 或 Published）

### 问题 3: 授权后返回应用时出错

**可能原因**:
- 回调 URL 不匹配
- code_verifier 在重定向过程中丢失

**解决方案**:
1. 检查回调 URL 是否与配置的 redirectTo 完全匹配
2. 清除浏览器缓存后重试
3. 确保未使用无痕模式

## 📝 配置验证清单

完成以下所有检查项：

- [x] 环境变量已配置（`npm run test:google-oauth` 通过）
- [ ] Supabase Dashboard 中 Google Provider 已启用
- [ ] Supabase 中 Client ID 和 Secret 正确
- [ ] Google Cloud Console 中重定向 URI 已添加
- [ ] 浏览器未使用无痕模式
- [ ] 浏览器缓存已清除
- [ ] 浏览器控制台没有错误
- [ ] 登录流程能正常完成

## 🚀 下一步

完成以上检查后：

1. **重新测试登录**
   - 清除浏览器缓存
   - 打开开发者工具
   - 尝试登录
   - 查看控制台日志

2. **如果仍然失败**
   - 提供具体的错误信息
   - 提供浏览器控制台的日志
   - 检查 Supabase Dashboard 的 Auth Logs

3. **验证成功标志**
   - 能跳转到 Google 授权页面
   - 授权后能返回应用
   - 能成功登录并看到用户信息

## 📞 需要帮助？

如果完成所有检查后仍然无法登录，请提供：

1. **Supabase Dashboard 截图**
   - Authentication > Providers > Google 的配置页面

2. **Google Cloud Console 截图**
   - OAuth 2.0 客户端 ID 的配置页面
   - 特别是 Authorized redirect URIs 部分

3. **浏览器控制台日志**
   - 完整的 Console 输出
   - Network 标签页的失败请求

4. **具体错误信息**
   - 登录页面显示的错误
   - 浏览器控制台的错误

