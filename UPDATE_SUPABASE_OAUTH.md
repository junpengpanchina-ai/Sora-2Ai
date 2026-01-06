# 🔄 更新 Supabase Google OAuth 配置

## 新的 OAuth 凭据

> ⚠️ **安全提示**: 实际的 Client ID 和 Secret 请从 Google Cloud Console 获取，不要提交到 Git。

- **Client ID**: `YOUR_NEW_CLIENT_ID.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-YOUR_NEW_CLIENT_SECRET`
- **创建日期**: 2026年1月6日
- **状态**: ✅ 已启用

---

## 📋 更新步骤

### Step 1: 更新 Supabase Google Provider 配置

1. **访问 Supabase Dashboard**
   - 网址：https://supabase.com/dashboard
   - 选择你的项目

2. **进入 Google Provider 配置**
   - 左侧菜单：**Authentication** → **Providers**
   - 找到 **Google** provider

3. **更新配置**
   - **Client ID (for OAuth)**: 
     ```
     从 Google Cloud Console 复制新的 Client ID
     ```
   - **Client Secret (for OAuth)**: 
     ```
     从 Google Cloud Console 复制新的 Client Secret
     ```

4. **确认开关已启用**（应该是绿色/打开状态）

5. **点击 "Save" 保存**

---

### Step 2: 确认 Redirect URIs 配置

#### 在 Google Cloud Console 中确认：

1. **访问**: https://console.cloud.google.com/
2. **进入**: APIs & Services → Credentials
3. **点击新的 OAuth 客户端 ID**（你刚创建的）
4. **检查 "已获授权的重定向 URI"**，应该包含：
   ```
   https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
   https://sora2aivideos.com/auth/callback
   ```

#### 在 Supabase Dashboard 中确认：

1. **进入**: Authentication → URL Configuration
2. **检查 Redirect URLs**，应该包含：
   ```
   https://sora2aivideos.com/**
   https://sora2aivideos.com/auth/callback
   ```

---

### Step 3: 测试登录

1. **打开无痕窗口**（Cmd+Shift+N / Ctrl+Shift+N）
2. **访问**: `https://sora2aivideos.com`
3. **打开 DevTools**（F12）
4. **点击「登录」按钮**
5. **检查**:
   - Console 是否有错误
   - Network 请求是否成功
   - 是否能成功登录

---

## ✅ 配置检查清单

- [ ] Supabase Google Provider Client ID 已更新
- [ ] Supabase Google Provider Client Secret 已更新
- [ ] Google Provider 开关已启用
- [ ] Google Cloud Console Redirect URIs 包含 Supabase 回调地址
- [ ] Google Cloud Console Redirect URIs 包含网站回调地址
- [ ] Supabase Redirect URLs 包含通配符和精确路径
- [ ] 无痕窗口测试登录成功

---

## 🆘 如果还有问题

1. **清除浏览器缓存和 Cookie**
2. **等待 1-2 分钟让配置生效**
3. **检查 Console 和 Network 的错误信息**
4. **确认所有 URL 都使用 HTTPS**

---

## 💡 重要提醒

- 旧的 Client ID 和 Secret 已失效
- 必须更新 Supabase 配置才能登录
- 配置更新后可能需要等待几秒钟生效

