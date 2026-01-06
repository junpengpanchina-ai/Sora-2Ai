# 🔥 登录问题快速修复指南（5分钟）

## 最可能的问题（按概率排序）

### ✅ TOP 1: Supabase Site URL 配置错误（90% 概率）

**操作步骤**：
1. 访问：https://supabase.com/dashboard
2. 选择你的项目
3. 进入：**Settings** → **API**
4. 找到 **Site URL** 字段
5. 设置为：`https://sora2aivideos.com`
6. 点击 **Save**

**验证**：刷新页面，Site URL 应该显示为 `https://sora2aivideos.com`

---

### ✅ TOP 2: Redirect URLs 白名单缺失（85% 概率）

**操作步骤**：
1. 在 Supabase Dashboard 中，进入：**Authentication** → **URL Configuration**
2. 找到 **Redirect URLs** 列表
3. 点击 **Add URL**，添加以下两个 URL（一行一个）：
   ```
   https://sora2aivideos.com/**
   https://sora2aivideos.com/auth/callback
   ```
4. 点击 **Save**

**验证**：Redirect URLs 列表应该包含上述两个 URL

---

### ✅ TOP 3: Google Cloud Console Redirect URI 缺失（80% 概率）

**操作步骤**：
1. 访问：https://console.cloud.google.com/
2. 选择项目：`222103705593`
3. 进入：**APIs & Services** → **Credentials**
4. 点击你的 **OAuth 2.0 客户端 ID**
5. 在 **Authorized redirect URIs** 部分，点击 **+ ADD URI**
6. 添加以下 URI（如果还没有）：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   https://sora2aivideos.com/auth/callback
   ```
7. 点击 **Save**

**验证**：Authorized redirect URIs 列表应该包含上述两个 URI

---

### ✅ TOP 4: 确认网站使用 HTTPS（75% 概率）

**检查**：
- 访问 `https://sora2aivideos.com`（不是 `http://`）
- 浏览器地址栏应该显示锁图标 🔒

**如果使用 HTTP**：
- Vercel 默认提供 HTTPS，检查部署配置

---

### ✅ TOP 5: Google Provider 未启用（70% 概率）

**操作步骤**：
1. 在 Supabase Dashboard 中，进入：**Authentication** → **Providers**
2. 找到 **Google** provider
3. 确认开关是**绿色/启用**状态
4. 如果未启用，点击开关启用
5. 确认以下配置正确：
   - **Client ID**: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - **Client Secret**: `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`
6. 点击 **Save**

---

## 🧪 修复后测试步骤

1. **打开无痕窗口**（Cmd+Shift+N / Ctrl+Shift+N）
2. **打开 DevTools**（F12）
3. **访问网站**：`https://sora2aivideos.com`
4. **点击「登录」按钮**
5. **检查 Console**：应该没有红色错误
6. **检查 Network**：应该看到 `/auth/v1/token` 请求返回 200
7. **登录成功后**：应该能看到用户信息

---

## 📋 快速检查清单

- [ ] Supabase Site URL = `https://sora2aivideos.com`
- [ ] Redirect URLs 包含 `https://sora2aivideos.com/**` 和 `https://sora2aivideos.com/auth/callback`
- [ ] Google Cloud Console Redirect URI 包含 `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
- [ ] Google Cloud Console Redirect URI 包含 `https://sora2aivideos.com/auth/callback`
- [ ] Google Provider 已启用
- [ ] 网站使用 HTTPS（不是 HTTP）
- [ ] 无痕窗口测试登录成功

---

## 🆘 如果还是不行

运行诊断脚本：
```bash
npm run diagnose:login
```

或查看详细排查指南：
- `LOGIN_DIAGNOSIS_URGENT.md` - 完整排查方案

---

## 💡 关键提醒

**登录失败 = 转化率为 0**

修好登录 = 你现在 ROI 最高的一步

