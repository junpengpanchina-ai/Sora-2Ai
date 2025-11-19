# code_verifier 保存问题修复

## 🔴 问题

Google 登录失败，错误信息："登录失败：验证码丢失检查浏览器是否允许 Cookie 和本地存储"

## 🔍 根本原因

当 `skipBrowserRedirect: false` 时，Supabase 会自动处理重定向，但我们又手动调用了 `window.location.href`，导致：
1. **冲突**：Supabase 的自动重定向和手动重定向冲突
2. **时机问题**：可能在 Supabase 保存 `code_verifier` 之前就重定向了
3. **存储丢失**：重定向时 `code_verifier` 可能还未保存到 localStorage

## ✅ 修复方案

### 修改 `components/LoginButton.tsx`

1. **使用 `skipBrowserRedirect: true`**
   - 手动控制重定向时机
   - 确保在重定向前验证 `code_verifier` 已保存

2. **添加验证循环**
   - 等待 Supabase 保存 `code_verifier`
   - 最多尝试 10 次，每次间隔 100ms
   - 如果 1 秒后仍未保存，显示错误

3. **验证后再重定向**
   - 只有在确认 `code_verifier` 已保存后才重定向
   - 避免在存储完成前就跳转

## 🧪 测试步骤

1. **清除浏览器缓存**
   ```bash
   # Chrome/Edge: 设置 > 隐私和安全 > 清除浏览数据
   # 选择"Cookie 和其他网站数据"和"缓存的图片和文件"
   ```

2. **确保环境变量正确**
   ```bash
   # 检查 .env.local
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # 本地开发
   ```

3. **重启开发服务器**
   ```bash
   npm run dev
   ```

4. **测试登录**
   - 访问 `http://localhost:3000/login`
   - 打开浏览器开发者工具（F12）
   - 点击"使用 Google 账号登录"
   - 查看控制台日志：
     ```
     ✅ localStorage is available
     OAuth URL generated: Yes
     ⏳ Waiting for code_verifier... (attempt 1/10)
     ✅ code_verifier saved successfully
     ✅ Redirecting to Google OAuth with verified code_verifier...
     ```

## 📝 关键代码变更

```typescript
// 之前：skipBrowserRedirect: false + 手动重定向（冲突）
skipBrowserRedirect: false,
window.location.href = data.url  // 可能在 code_verifier 保存前就重定向

// 现在：skipBrowserRedirect: true + 验证后重定向
skipBrowserRedirect: true,
// 等待并验证 code_verifier 保存
while (attempts < maxAttempts && !hasVerifier) {
  // 检查 localStorage
  // 如果找到，跳出循环
}
// 确认保存后才重定向
window.location.href = data.url
```

## ⚠️ 如果仍然失败

### 检查清单

1. **浏览器设置**
   - ✅ 未使用无痕/隐私模式
   - ✅ 允许 Cookie 和本地存储
   - ✅ 未安装阻止存储的扩展程序

2. **Supabase 配置**
   - ✅ Site URL 包含 `http://localhost:3000`
   - ✅ Redirect URLs 包含 `http://localhost:3000/**`

3. **Google Cloud Console**
   - ✅ 重定向 URI 包含 `http://localhost:3000/auth/callback`

4. **环境变量**
   - ✅ `NEXT_PUBLIC_APP_URL=http://localhost:3000`（本地开发）

## 🔧 调试信息

如果问题仍然存在，查看浏览器控制台：

1. **检查 localStorage**
   ```javascript
   // 在控制台运行
   Object.keys(localStorage).filter(key => key.includes('supabase'))
   ```

2. **检查重定向 URL**
   ```javascript
   // 应该显示
   redirectTo: 'http://localhost:3000/auth/callback'
   ```

3. **检查 Supabase 客户端**
   ```javascript
   // 确认 createBrowserClient 正确初始化
   console.log('Supabase client created')
   ```

## 🎯 预期行为

修复后，登录流程应该：

1. ✅ 点击登录按钮
2. ✅ 检查 localStorage 可用性
3. ✅ 调用 `signInWithOAuth` 生成 OAuth URL
4. ✅ **等待并验证 `code_verifier` 保存**（新增）
5. ✅ 重定向到 Google 登录页面
6. ✅ 用户授权后重定向回 `/auth/callback`
7. ✅ 回调页面读取 `code_verifier` 并完成登录

