# OAuth PKCE 登录问题修复指南

## 🔴 错误信息

```
登录失败：invalid request: both auth code and code verifier should be non-empty
```

## 📋 问题原因

这个错误表示 OAuth PKCE（Proof Key for Code Exchange）流程中的 `code_verifier` 丢失了。PKCE 是一种安全机制，用于防止授权码被拦截。

### 可能的原因：

1. **浏览器 localStorage 被清除**
   - 用户在登录过程中清除了浏览器数据
   - 浏览器扩展程序清除了存储

2. **隐私/无痕模式**
   - 某些浏览器在隐私模式下限制 localStorage
   - 跨标签页数据共享受限

3. **重定向 URL 不匹配**
   - 登录时的 `redirectTo` 与回调 URL 不完全匹配
   - 协议不匹配（http vs https）

4. **跨域问题**
   - 从不同域名重定向回来
   - 端口号变化

## ✅ 已实施的修复

### 1. 启用自动会话检测

在 `lib/supabase/client.ts` 中：
- 将 `detectSessionInUrl` 设置为 `true`
- `createBrowserClient` 默认使用 PKCE 流程，无需显式设置

### 2. 改进回调处理

在 `app/auth/callback/page.tsx` 中：
- 先检查 Supabase 是否已自动处理会话
- 如果未自动处理，则手动交换 code
- 添加详细的错误诊断信息
- 提供用户友好的错误消息

### 3. 确保重定向 URL 匹配

在 `components/LoginButton.tsx` 中：
- 确保 `redirectTo` URL 完全匹配回调 URL
- PKCE 流程由 Supabase 客户端自动处理

## 🔧 用户解决方案

### 方案 1: 清除浏览器缓存并重试（推荐）

1. **清除浏览器缓存和 Cookie**
   - Chrome/Edge: `设置` > `隐私和安全` > `清除浏览数据`
   - Firefox: `设置` > `隐私与安全` > `Cookie 和网站数据` > `清除数据`
   - Safari: `偏好设置` > `隐私` > `管理网站数据` > `全部移除`

2. **重新登录**
   - 访问登录页面
   - 点击 "使用 Google 账号登录"
   - 完成授权流程

### 方案 2: 检查浏览器设置

1. **确保未使用隐私/无痕模式**
   - 使用正常浏览模式
   - 隐私模式可能限制 localStorage

2. **检查浏览器扩展**
   - 禁用可能清除存储的扩展程序
   - 特别是隐私保护扩展

### 方案 3: 检查 URL 匹配

1. **确认重定向 URL**
   - 登录时使用的 URL 必须与回调 URL 完全匹配
   - 例如：`http://localhost:3000/auth/callback`
   - 不能是：`http://localhost:3000/auth/callback/`（注意末尾斜杠）

2. **检查协议一致性**
   - 确保登录和回调使用相同的协议（http 或 https）

## 🧪 测试步骤

### 1. 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页：

```javascript
// 应该能看到这些日志：
// "Initiating OAuth login..."
// "Callback received: { code: '...', codeLength: ... }"
// "Supabase storage keys: [...]"
// "Found code_verifier key: ..." 或 "No code_verifier found..."
```

### 2. 检查 localStorage

在浏览器控制台中运行：

```javascript
// 查看所有 Supabase 相关的键
Object.keys(localStorage).filter(key => key.includes('supabase'))

// 应该能看到类似这样的键：
// "sb-<project-id>-auth-token"
// "sb-<project-id>-auth-code-verifier"
```

### 3. 验证重定向 URL

1. 点击登录按钮
2. 在重定向到 Google 之前，检查控制台日志中的 `redirectTo` 值
3. 确认回调 URL 与 `redirectTo` 完全匹配

## 🔍 诊断信息

修复后的代码会在控制台输出详细的诊断信息：

- ✅ **找到 code_verifier**: 登录应该能正常工作
- ⚠️ **未找到 code_verifier**: 会显示可能的原因和建议

## 📝 开发者注意事项

### 如果问题持续存在：

1. **检查 Supabase 配置**
   - 确认 Google OAuth Provider 已正确配置
   - 验证 Client ID 和 Client Secret

2. **检查环境变量**
   ```bash
   npm run check-env
   ```

3. **查看 Supabase 日志**
   - 在 Supabase Dashboard 中查看 Authentication 日志
   - 检查是否有相关错误

4. **测试不同的浏览器**
   - 某些浏览器可能有特殊行为
   - 尝试 Chrome、Firefox、Safari

## 🎯 预防措施

为了避免将来出现此问题：

1. ✅ **始终使用完整的 URL**
   - 使用 `window.location.origin` 而不是硬编码
   - 确保协议、域名、端口都正确

2. ✅ **避免在登录过程中清除缓存**
   - 提醒用户不要在登录过程中清除浏览器数据

3. ✅ **提供清晰的错误消息**
   - 当检测到 PKCE 问题时，提供具体的解决步骤

## 📚 相关文档

- [Supabase Auth PKCE Flow](https://supabase.com/docs/guides/auth/auth-pkce-flow)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## ✅ 验证修复

修复后，登录流程应该：

1. ✅ 成功保存 `code_verifier` 到 localStorage
2. ✅ 在回调时正确读取 `code_verifier`
3. ✅ 成功交换 code 获取 session
4. ✅ 创建或更新用户记录
5. ✅ 重定向到首页

如果仍然遇到问题，请检查：
- 浏览器控制台的详细日志
- Supabase Dashboard 的认证日志
- 网络请求是否成功

