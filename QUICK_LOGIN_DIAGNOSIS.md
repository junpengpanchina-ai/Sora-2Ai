# Google 登录快速诊断指南

## 🔍 第一步：查看错误信息

### 在登录页面查看
登录失败时，页面顶部会显示红色错误框，请记录具体的错误信息。

### 在浏览器控制台查看（重要）
1. 打开浏览器开发者工具（按 `F12` 或 `Cmd+Option+I`）
2. 切换到 **Console**（控制台）标签页
3. 点击登录按钮
4. 查看所有红色错误信息

**请告诉我你看到的错误信息是什么？**

## 📋 常见错误及解决方案

### 错误 1: "验证码丢失" 或 "code_verifier not found"

**原因**: PKCE 验证码在重定向过程中丢失

**解决方案**:
1. **清除浏览器缓存和 Cookie**
   - Chrome: `设置` > `隐私和安全` > `清除浏览数据`
   - 选择"Cookie 和其他网站数据"和"缓存的图片和文件"
   - 时间范围选择"全部时间"

2. **确保未使用无痕模式**
   - 关闭无痕/隐私浏览窗口
   - 使用正常浏览模式

3. **重新登录**

### 错误 2: "redirect_uri_mismatch"

**原因**: Google Cloud Console 中的重定向 URI 配置不正确

**解决方案**:
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 进入 **APIs & Services** > **Credentials**
3. 点击你的 OAuth 2.0 客户端 ID
4. 检查 **Authorized redirect URIs** 是否包含：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback  (开发环境)
   ```
5. 如果缺少，添加后保存
6. 等待几分钟让更改生效

### 错误 3: "OAuth 配置错误" 或点击登录没有反应

**原因**: Supabase 中的 Google Provider 未正确配置

**解决方案**:
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入 **Authentication** > **Providers**
3. 找到 **Google** provider
4. 确认已启用（开关为绿色）
5. 检查 Client ID 和 Client Secret 是否正确：
   - Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - Client Secret: `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`
6. 点击 **Save** 保存

### 错误 4: "no_code" 或 "No code parameter"

**原因**: Google 授权后没有返回授权码

**解决方案**:
1. 检查是否完成了 Google 授权（点击了"允许"）
2. 检查浏览器是否阻止了重定向
3. 清除浏览器缓存后重试

### 错误 5: "验证码已过期或无效"

**原因**: 授权码已过期（通常是因为等待时间过长）

**解决方案**:
1. 重新点击登录按钮
2. 快速完成授权流程（不要等待太久）

## 🧪 诊断步骤

### 步骤 1: 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页，应该看到：

```
✅ localStorage is available
Initiating OAuth login... { redirectTo: '...' }
✅ code_verifier saved successfully
Callback received: { code: '...', codeLength: ... }
Supabase storage keys: [...]
Found code_verifier key: ...
✅ Session created by automatic detection
```

**如果看到红色错误，请告诉我具体的错误信息。**

### 步骤 2: 检查网络请求

1. 在开发者工具中，切换到 **Network**（网络）标签页
2. 点击登录按钮
3. 查看是否有失败的请求（红色）
4. 点击失败的请求，查看详细信息

### 步骤 3: 检查 localStorage

在浏览器控制台中运行：

```javascript
// 查看所有 Supabase 相关的存储
Object.keys(localStorage).filter(key => key.includes('supabase'))

// 应该能看到类似这样的键：
// "sb-hgzpzsiafycwlqrkzbis-auth-token"
// "sb-hgzpzsiafycwlqrkzbis-auth-code-verifier"
```

**如果没有看到 `code-verifier` 相关的键，说明验证码没有保存。**

### 步骤 4: 运行诊断脚本

```bash
npm run test:google-oauth
```

这个脚本会检查所有配置是否正确。

## 🔧 快速修复尝试

### 方法 1: 完全清除并重试

1. **清除浏览器数据**
   - 清除所有 Cookie 和缓存
   - 清除本地存储

2. **关闭所有相关标签页**

3. **重新打开浏览器**

4. **重新访问登录页面并登录**

### 方法 2: 使用不同的浏览器

如果当前浏览器有问题，尝试：
- Chrome
- Firefox
- Safari
- Edge

### 方法 3: 检查浏览器扩展

某些浏览器扩展可能会干扰 OAuth 流程：
- 广告拦截器
- 隐私保护扩展
- Cookie 管理扩展

**临时禁用这些扩展后重试。**

## 📝 需要提供的信息

如果以上方法都无法解决，请提供：

1. **具体的错误信息**
   - 登录页面显示的错误
   - 浏览器控制台的错误

2. **浏览器信息**
   - 浏览器类型和版本
   - 是否使用无痕模式

3. **控制台日志**
   - 复制所有相关的日志信息

4. **网络请求信息**
   - 是否有失败的请求
   - 失败请求的状态码和错误信息

5. **环境信息**
   - 是本地开发环境还是生产环境
   - URL 是什么

## ✅ 成功标志

登录成功时应该看到：

1. ✅ 点击登录按钮后跳转到 Google 授权页面
2. ✅ 授权后自动返回应用
3. ✅ 自动重定向到首页
4. ✅ 浏览器控制台显示成功日志
5. ✅ 没有错误信息

## 🆘 仍然无法解决？

如果以上步骤都无法解决问题，请：

1. 运行完整诊断：`npm run test:google-oauth`
2. 查看详细指南：`GOOGLE_LOGIN_TROUBLESHOOTING.md`
3. 提供具体的错误信息，我可以进一步帮助

