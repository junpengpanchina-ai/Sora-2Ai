# 🔥 登录问题关键修复清单（按优先级）

## ⚠️ 一句话结论

**你的问题不是"没有用户愿意买"，而是"愿意尝试的用户一个都进不来"。**

这不是营销问题，不是 SEO 问题，这是一个典型的「SaaS 死在登录」问题。

---

## 🔴 今天必须做（不做 = 一切白搭）

### ✅ 1️⃣ 检查 Google OAuth Consent Screen 状态（最高优先级）

**问题**：Google Auth 客户端页面加载失败 = Google Cloud 项目状态异常

**操作步骤**：
1. 访问：https://console.cloud.google.com/
2. 选择项目：`skilled-acolyte-476516-g8`（项目编号：222103705593）
3. 进入：**APIs & Services** → **OAuth consent screen**
4. **检查以下项**：

   ✅ **应用状态**：
   - 必须是 **Published**（已发布）
   - 如果是 **Testing**，确保你的 Google 账号在测试用户列表中
   - ❌ 不能是 **Unpublished** 或显示红色警告

   ✅ **应用信息**：
   - 应用名称已填写
   - 用户支持电子邮件已填写
   - 应用徽标（可选但推荐）

   ✅ **作用域**：
   - 至少包含 `openid`、`email`、`profile`
   - 如果添加了自定义作用域，需要验证

   ✅ **测试用户**（如果状态是 Testing）：
   - 你的 Google 账号必须在测试用户列表中
   - 添加测试用户：**OAuth consent screen** → **Test users** → **+ ADD USERS**

**验证**：状态应该是 **Published**，没有红色警告

---

### ✅ 2️⃣ 修正 OAuth Redirect URI（只留生产域名）

**问题**：Redirect URI 与 Vercel 域名不一致 = Google 直接拒绝登录

**操作步骤**：
1. 访问：https://console.cloud.google.com/
2. 选择项目：`skilled-acolyte-476516-g8`
3. 进入：**APIs & Services** → **Credentials**
4. 点击你的 **OAuth 2.0 客户端 ID**：
   ```
   222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
   ```
5. 在 **Authorized redirect URIs** 部分：
   - ❌ **删除所有旧的 URI**（如 `localhost:3000`、旧的 Vercel 域名等）
   - ✅ **只保留以下两个 URI**（完全匹配，包括协议）：
     ```
     https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
     https://sora2aivideos.com/auth/callback
     ```
6. 在 **Authorized JavaScript origins** 部分：
   - ❌ **删除所有旧的 origin**
   - ✅ **只保留以下 origin**：
     ```
     https://sora2aivideos.com
     ```
7. 点击 **Save**

**验证**：
- Authorized redirect URIs 列表只有上述两个 URI
- Authorized JavaScript origins 只有 `https://sora2aivideos.com`
- 没有 `http://` 或 `localhost` 的 URI

---

### ✅ 3️⃣ 检查 Supabase Site URL 和 Redirect URLs

**操作步骤**：
1. 访问：https://supabase.com/dashboard
2. 选择项目：`hgzpzsiafycwlqrkzbis`
3. 进入：**Settings** → **API**
4. **检查 Site URL**：
   - ✅ 必须是：`https://sora2aivideos.com`
   - ❌ 不能是 `localhost:3000` 或旧的域名
   - 点击 **Save**（如果需要修改）

5. 进入：**Authentication** → **URL Configuration**
6. **检查 Redirect URLs**：
   - ✅ 必须包含：
     ```
     https://sora2aivideos.com/**
     https://sora2aivideos.com/auth/callback
     ```
   - ❌ 删除所有 `localhost` 或旧的 Vercel 域名
   - 点击 **Save**

**验证**：
- Site URL = `https://sora2aivideos.com`
- Redirect URLs 包含上述两个 URL

---

### ✅ 4️⃣ 确认 Google Provider 已启用

**操作步骤**：
1. 在 Supabase Dashboard 中，进入：**Authentication** → **Providers**
2. 找到 **Google** provider
3. **检查**：
   - ✅ 开关是**绿色/启用**状态
   - ✅ **Client ID (for OAuth)** 正确：
     ```
     222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
     ```
   - ✅ **Client Secret (for OAuth)** 正确：
     ```
     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
     ```
4. 如果未启用或配置错误，点击 **Save**

**验证**：Google Provider 开关是绿色，配置正确

---

### ✅ 5️⃣ 验证网站使用 HTTPS

**检查**：
- 访问 `https://sora2aivideos.com`（不是 `http://`）
- 浏览器地址栏应该显示锁图标 🔒
- 如果使用 HTTP，Vercel 默认提供 HTTPS，检查部署配置

---

## ⚠️ 接下来 48 小时

### ✅ 6️⃣ 登录页性能专项优化

**目标**：移动端 LCP < 3s

**已实施**：
- ✅ 延迟加载登录视觉效果（`LoginVisual` 组件）
- ✅ 延迟加载登录按钮组件（`dynamic import`）
- ✅ 添加 Email Magic Link 登录（兜底方案）

**待验证**：
- 在 Vercel Speed Insights 中查看 `/login` 路径的性能
- 移动端 LCP 应该 < 3s
- FCP 应该 < 1.8s

---

### ✅ 7️⃣ 移除登录页无关 JS

**检查清单**：
- [ ] 登录页没有加载 analytics（Google Analytics、Vercel Analytics 等）
- [ ] 登录页没有加载 heatmap 工具
- [ ] 登录页没有加载 chat widget
- [ ] 登录页没有加载 AB test 工具

**如何检查**：
1. 打开浏览器 DevTools → Network
2. 访问 `https://sora2aivideos.com/login`
3. 筛选 JS 文件
4. 检查是否有 analytics、heatmap、chat、AB test 相关的 JS

**如果发现**：在 `app/login/page.tsx` 中添加条件加载，或使用 `next/script` 的 `strategy="lazyOnload"`

---

### ✅ 8️⃣ 验证真实用户是否能成功登录

**测试步骤**：
1. **打开无痕窗口**（Cmd+Shift+N / Ctrl+Shift+N）
2. **打开 DevTools**（F12）
3. **访问**：`https://sora2aivideos.com/login`
4. **点击「Sign in with Google」**
5. **检查 Console**：应该没有红色错误
6. **检查 Network**：应该看到 `/auth/v1/token` 请求返回 200
7. **登录成功后**：应该能看到用户信息并重定向到首页

**如果失败**：
- 截图 Console 错误
- 截图 Network 请求
- 检查错误信息，对照上述清单

---

## 🧪 快速诊断脚本

在浏览器 Console 中运行以下代码，检查配置：

```javascript
// 检查 localStorage 是否可用
try {
  localStorage.setItem('test', 'test')
  localStorage.removeItem('test')
  console.log('✅ localStorage is available')
} catch (e) {
  console.error('❌ localStorage is not available:', e)
}

// 检查 Supabase 环境变量
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

// 检查当前域名
console.log('Current origin:', window.location.origin)
console.log('Expected origin:', 'https://sora2aivideos.com')
console.log('Match:', window.location.origin === 'https://sora2aivideos.com' ? '✅' : '❌')
```

---

## 📋 完整检查清单

### Google Cloud Console
- [ ] OAuth consent screen 状态是 **Published**
- [ ] Authorized redirect URIs 只包含：
  - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
  - `https://sora2aivideos.com/auth/callback`
- [ ] Authorized JavaScript origins 只包含：
  - `https://sora2aivideos.com`
- [ ] 没有 `localhost` 或旧的 Vercel 域名

### Supabase Dashboard
- [ ] Site URL = `https://sora2aivideos.com`
- [ ] Redirect URLs 包含：
  - `https://sora2aivideos.com/**`
  - `https://sora2aivideos.com/auth/callback`
- [ ] Google Provider 已启用
- [ ] Google Provider Client ID 和 Secret 正确

### 网站
- [ ] 网站使用 HTTPS（不是 HTTP）
- [ ] 域名是 `sora2aivideos.com`（不是 `www.sora2aivideos.com`）
- [ ] 登录页性能良好（移动端 LCP < 3s）

### 测试
- [ ] 无痕窗口测试登录成功
- [ ] Console 没有红色错误
- [ ] Network 请求返回 200
- [ ] 登录后能正常使用系统

---

## 🆘 如果还是不行

### 1. 检查浏览器 Console 错误
- 打开 DevTools → Console
- 截图所有红色错误
- 对照错误信息查找解决方案

### 2. 检查 Network 请求
- 打开 DevTools → Network
- 筛选 `auth` 或 `token`
- 检查请求状态码和响应

### 3. 检查 Cookie 设置
- 打开 DevTools → Application → Cookies
- 检查是否有 Supabase 相关的 Cookie
- 检查 Cookie 的 Domain、SameSite、Secure 设置

### 4. 联系支持
如果以上都检查过了还是不行，提供以下信息：
- 浏览器 Console 错误截图
- Network 请求截图
- 配置检查清单的完成情况

---

## 💡 关键提醒

**登录失败 = 转化率为 0**

修好登录 = 你现在 ROI 最高的一步

**优先级排序**：
1. Google OAuth Consent Screen 状态（最高）
2. Redirect URI 配置（最高）
3. Supabase Site URL（高）
4. Email Magic Link 兜底（高）
5. 性能优化（中）
6. 错误提示改进（中）

---

## ✅ 修复后验证

完成上述所有步骤后，运行以下验证：

1. **无痕窗口测试**：
   ```bash
   # 打开无痕窗口
   # 访问 https://sora2aivideos.com/login
   # 点击登录
   # 应该能成功登录
   ```

2. **检查 Vercel Speed Insights**：
   - 访问 Vercel Dashboard → Speed Insights
   - 查看 `/login` 路径的性能
   - 移动端 RES 应该 > 50（至少）

3. **检查真实用户反馈**：
   - 让 2-3 个真实用户测试登录
   - 收集反馈
   - 如果还有问题，对照清单再次检查

---

**最后更新**：2025-01-06
**优先级**：🔥 最高优先级 - 影响 100% 用户转化

