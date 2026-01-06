# OAuth "Unable to exchange external code" 错误修复指南

## 🔴 错误信息

```
Unable to exchange external code: 4/0ATX87lM6U1OHNrrOWtG4QPnpo-FM3UioYrcwVymg_SJM0K_EK8UgzV73agdRohX5cgLdoQ
```

## 📋 问题原因

这个错误通常发生在以下情况：

1. **OAuth code 已过期**
   - OAuth code 通常只有 5-10 分钟的有效期
   - 如果用户在授权后等待太久才返回，code 会过期

2. **code_verifier 和 code 不匹配**
   - code_verifier 和 code 必须来自同一个登录会话
   - 如果用户多次点击登录按钮，可能会产生不匹配的情况

3. **浏览器存储被清除**
   - localStorage 或 sessionStorage 中的 code_verifier 被清除
   - 浏览器扩展程序或隐私设置清除了存储

4. **跨域或重定向问题**
   - 从不同域名重定向回来
   - 重定向 URL 配置不匹配

## ✅ 快速修复步骤

### 方法 1: 使用调试脚本（推荐）

1. **打开浏览器开发者工具**（F12）
2. **切换到 Console 标签**
3. **复制并粘贴以下代码**：

```javascript
// 快速清除 OAuth 存储
(() => { 
  const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
    .filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth') || k.includes('code_verifier'))
  const uniqueKeys = [...new Set(keys)]
  uniqueKeys.forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
  console.log(`✅ 已清除 ${uniqueKeys.length} 个 OAuth 键，请重新登录`)
})()
```

4. **按回车执行**
5. **重新点击"使用 Google 账号登录"按钮**

### 方法 2: 手动清除浏览器存储

1. **Chrome/Edge**:
   - 按 `F12` 打开开发者工具
   - 切换到 `Application` 标签
   - 左侧选择 `Local Storage` > 你的网站域名
   - 删除所有以 `sb-` 或包含 `supabase` 的键
   - 同样删除 `Session Storage` 中的相关键

2. **Firefox**:
   - 按 `F12` 打开开发者工具
   - 切换到 `存储` 标签
   - 删除 `本地存储` 和 `会话存储` 中的 Supabase 相关键

3. **Safari**:
   - 按 `Cmd+Option+I` 打开开发者工具
   - 切换到 `存储` 标签
   - 删除相关存储

### 方法 3: 清除浏览器缓存和 Cookie

1. **Chrome/Edge**: `设置` > `隐私和安全` > `清除浏览数据` > 选择"Cookie 和其他网站数据"和"缓存的图片和文件"
2. **Firefox**: `设置` > `隐私与安全` > `Cookie 和网站数据` > `清除数据`
3. **Safari**: `偏好设置` > `隐私` > `管理网站数据` > `全部移除`

## 🔧 预防措施

1. **不要多次点击登录按钮**
   - 点击一次后等待重定向完成
   - 不要在授权页面停留太久

2. **检查浏览器设置**
   - 确保未使用隐私/无痕模式
   - 禁用可能清除存储的浏览器扩展

3. **检查 Supabase 配置**
   - 确保重定向 URL 在 Supabase Dashboard 中正确配置
   - URL 必须完全匹配（包括协议、域名、路径）

## 📝 技术细节

### 错误发生的位置

错误发生在 `/auth/callback` 页面，当尝试调用 `supabase.auth.exchangeCodeForSession(code)` 时。

### 错误处理改进

代码已更新，现在会：
- 检测 "Unable to exchange external code" 错误
- 提供更友好的错误消息
- 建议用户清除存储并重试

### 调试工具

已创建以下调试脚本：
- `CONSOLE_OAUTH_LOGIN_DEBUG.js` - 完整版调试脚本
- `CONSOLE_OAUTH_QUICK_FIX.js` - 快速修复版（推荐）
- `CONSOLE_OAUTH_ONE_LINER.js` - 单行命令版

## 🚀 如果问题持续

如果清除存储后仍然失败，请检查：

1. **Supabase Dashboard 配置**
   - 登录 Supabase Dashboard
   - 进入 `Authentication` > `URL Configuration`
   - 确保 `Redirect URLs` 中包含你的回调 URL：
     - `https://sora2aivideos.com/auth/callback`
     - `http://localhost:3000/auth/callback` (开发环境)

2. **网络连接**
   - 确保可以访问 Supabase API
   - 检查防火墙或代理设置

3. **浏览器控制台**
   - 查看是否有其他错误信息
   - 检查 Network 标签中的请求是否成功

4. **使用邮箱魔法链接**
   - 如果 OAuth 持续失败，可以使用邮箱魔法链接登录作为替代方案

