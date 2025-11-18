# Google 登录问题完整排查指南

## 🚀 快速开始

### 步骤 1: 运行诊断脚本

```bash
npm run test:google-oauth
```

这个脚本会自动检查：
- ✅ 环境变量配置
- ✅ Supabase 连接
- ✅ Google OAuth 配置格式
- ✅ 配置完整性

### 步骤 2: 检查配置清单

根据诊断脚本的输出，检查以下配置：

## 📋 配置检查清单

### 1. Supabase Dashboard 配置

1. **访问 Supabase Dashboard**
   - 网址：https://supabase.com/dashboard
   - 选择你的项目

2. **检查 Google Provider**
   - 进入 **Authentication** > **Providers**
   - 找到 **Google** provider
   - 确认开关已**启用**（绿色）

3. **验证凭据**
   - **Client ID (for OAuth)**: 
     ```
     222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
     ```
   - **Client Secret (for OAuth)**: 
     ```
     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
     ```
   - 点击 **Save** 保存

4. **检查项目状态**
   - 确认项目状态为 **Active**
   - 检查是否有任何警告或错误

### 2. Google Cloud Console 配置

1. **访问 Google Cloud Console**
   - 网址：https://console.cloud.google.com/
   - 选择项目（项目编号：222103705593）

2. **检查 OAuth 2.0 客户端**
   - 进入 **APIs & Services** > **Credentials**
   - 点击你的 OAuth 2.0 客户端 ID

3. **验证重定向 URI**
   
   必须包含以下 URI（**完全匹配**，包括协议和路径）：
   
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```
   
   **重要提示**：
   - 如果使用生产环境，还需要添加生产环境的回调 URL
   - 确保没有多余的斜杠
   - 确保协议正确（http vs https）

4. **检查 OAuth 同意屏幕**
   - 进入 **OAuth consent screen**
   - 确认应用状态为 **Published** 或 **Testing**
   - 如果处于 Testing 状态，确保你的 Google 账号已添加到测试用户列表

### 3. 本地环境配置

1. **检查环境变量文件**
   ```bash
   # 检查 .env.local 文件是否存在
   ls -la .env.local
   
   # 运行环境变量检查
   npm run check-env
   ```

2. **必需的环境变量**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://hgzpzsiafycwlqrkzbis.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
   SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key
   GOOGLE_CLIENT_ID=222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   ```

3. **重启开发服务器**
   ```bash
   # 停止当前服务器 (Ctrl+C)
   npm run dev
   ```

## 🔍 常见问题诊断

### 问题 1: "invalid request: both auth code and code verifier should be non-empty"

**原因**: PKCE 的 `code_verifier` 丢失

**解决方案**:
1. **清除浏览器缓存和 Cookie**
   - Chrome: `设置` > `隐私和安全` > `清除浏览数据`
   - 选择"Cookie 和其他网站数据"和"缓存的图片和文件"
   
2. **确保未使用隐私/无痕模式**
   - 切换到正常浏览模式
   - 隐私模式可能限制 localStorage

3. **检查浏览器控制台**
   - 打开开发者工具（F12）
   - 查看 Console 标签页
   - 查找是否有 `code_verifier` 相关的警告

4. **检查 localStorage**
   ```javascript
   // 在浏览器控制台运行
   Object.keys(localStorage).filter(key => key.includes('supabase'))
   ```
   - 应该能看到包含 `code-verifier` 的键

**详细说明**: 参考 `OAUTH_PKCE_FIX.md`

### 问题 2: "redirect_uri_mismatch"

**原因**: Google Cloud Console 中的重定向 URI 配置不正确

**解决方案**:
1. 检查回调 URL 是否完全匹配
2. 确保已添加所有必需的重定向 URI
3. 等待几分钟让 Google 的更改生效
4. 清除浏览器缓存后重试

### 问题 3: "OAuth 配置错误" 或点击登录没有反应

**原因**: Supabase 中的 Google Provider 未正确配置

**解决方案**:
1. 检查 Supabase Dashboard 中的 Google Provider 是否已启用
2. 验证 Client ID 和 Client Secret 是否正确
3. 保存配置后等待几秒钟
4. 重启开发服务器

### 问题 4: 登录后立即退出或无法保持登录状态

**原因**: 会话存储问题

**解决方案**:
1. 检查浏览器是否允许 Cookie
2. 确保未使用隐私模式
3. 检查 Supabase 客户端配置中的 `persistSession` 设置

### 问题 5: 在 Vercel 生产环境中登录失败

**原因**: 生产环境配置不完整

**解决方案**:
1. **在 Vercel 中配置环境变量**
   - 进入项目设置 > Environment Variables
   - 确保所有必需的环境变量都已设置
   - 特别是 `NEXT_PUBLIC_APP_URL` 应该设置为实际的 Vercel 域名

2. **更新 Google Cloud Console 重定向 URI**
   - 添加生产环境的回调 URL：
     ```
     https://your-project.vercel.app/auth/callback
     ```

3. **更新 Supabase 配置**
   - 如果使用自定义域名，也需要添加相应的回调 URL

## 🧪 测试步骤

### 1. 本地测试

```bash
# 1. 启动开发服务器
npm run dev

# 2. 打开浏览器访问
http://localhost:3000/login

# 3. 点击 "使用 Google 账号登录"

# 4. 观察以下行为：
#    - 应该跳转到 Google 授权页面
#    - 授权后应该自动返回应用
#    - 应该显示用户信息
```

### 2. 浏览器控制台检查

打开浏览器开发者工具（F12），查看：

**Console 标签页**:
- 应该看到 "Initiating OAuth login..."
- 应该看到 "Callback received: { code: '...' }"
- 应该看到 "Found code_verifier key: ..." 或相关日志
- 不应该有红色错误信息

**Network 标签页**:
- 检查到 Supabase 的请求是否成功
- 检查到 Google OAuth 的重定向是否正常

### 3. Supabase Dashboard 检查

1. 进入 **Authentication** > **Users**
   - 应该能看到新创建的用户记录

2. 进入 **Logs** > **Auth Logs**
   - 查看最近的认证尝试
   - 检查是否有错误信息

## 🔧 高级调试

### 启用详细日志

在浏览器控制台中，你应该能看到详细的日志信息：

```javascript
// 登录流程日志
"Initiating OAuth login..." 
"OAuth URL generated: Yes"
"Callback received: { code: '...', codeLength: ... }"
"Supabase storage keys: [...]"
"Found code_verifier key: ..." 或 "No code_verifier found..."
"Exchanging code for session..."
"Exchange result: { hasSession: true, hasUser: true }"
```

### 检查 Supabase 存储

```javascript
// 在浏览器控制台运行
// 查看所有 Supabase 相关的存储
Object.keys(localStorage).filter(key => key.includes('supabase')).forEach(key => {
  console.log(key, localStorage.getItem(key).substring(0, 50) + '...')
})
```

### 手动测试 Supabase 连接

```bash
npm run test:supabase
```

## 📝 配置验证清单

完成以下所有检查项：

- [ ] `.env.local` 文件存在且配置正确
- [ ] 运行 `npm run test:google-oauth` 所有检查通过
- [ ] Supabase Dashboard 中 Google Provider 已启用
- [ ] Supabase 中 Client ID 和 Secret 正确填写
- [ ] Google Cloud Console 中重定向 URI 已添加
- [ ] 开发服务器已重启
- [ ] 浏览器缓存已清除
- [ ] 未使用隐私/无痕模式
- [ ] 浏览器控制台没有错误
- [ ] 登录流程能正常完成

## 🆘 仍然无法解决？

如果以上步骤都无法解决问题，请收集以下信息：

1. **浏览器控制台错误**
   - 截图或复制所有错误信息

2. **开发服务器日志**
   - 终端中的错误输出

3. **Supabase Auth Logs**
   - 从 Supabase Dashboard > Logs > Auth Logs 中复制相关日志

4. **环境信息**
   - 操作系统
   - 浏览器类型和版本
   - Node.js 版本

5. **配置信息**（隐藏敏感部分）
   - `.env.local` 中的变量名（不包含值）
   - Supabase 项目 ID
   - Google OAuth 客户端 ID（不包含 Secret）

## ✅ 成功标志

登录成功时应该看到：

1. ✅ 点击登录按钮后跳转到 Google 授权页面
2. ✅ 授权后自动返回应用（`/auth/callback`）
3. ✅ 自动重定向到首页（`/`）
4. ✅ 显示用户信息（如果首页有用户信息显示）
5. ✅ Supabase `users` 表中有用户记录
6. ✅ 浏览器控制台显示成功日志
7. ✅ 可以正常退出登录

## 📚 相关文档

- `OAUTH_PKCE_FIX.md` - PKCE 问题详细修复指南
- `TROUBLESHOOTING.md` - 通用故障排除指南
- `GOOGLE_OAUTH_SETUP.md` - Google OAuth 初始设置指南
- `FINAL_SETUP.md` - 最终配置步骤

