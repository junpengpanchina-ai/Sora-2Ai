# 修改 Google OAuth 登录页面显示的 URL（安全方案）

## 目标
将 Google 登录页面中显示的"继续前往"URL 从 `hgzpzsiafycwlqrkzbis.supabase.co` 改为 `https://sora2aivideos.com/`

## ✅ 为什么这样做是安全的？

**重要说明**：修改 Supabase 的 Site URL **不会影响 OAuth 流程的安全性**，原因如下：

1. **OAuth 流程保持不变**
   - 实际的 OAuth 回调仍然通过 Supabase（`hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`）
   - Google Cloud Console 中的回调地址保持不变
   - 只是 Google 显示的 URL 会改变

2. **安全性不受影响**
   - OAuth 的安全性依赖于回调 URL 的验证（在 Google Cloud Console 中配置）
   - 授权码通过 HTTPS 安全传输
   - 令牌安全存储

3. **其他功能不受影响**
   - Site URL 主要用于：
     - OAuth 重定向 URL 的显示
     - 邮件中的链接生成
     - 某些重定向验证
   - 只要确保 Redirect URLs 正确配置，其他功能不会受影响

## 📋 配置步骤

### 步骤 1: 修改 Supabase Dashboard 中的 Site URL（安全操作）

1. **访问 Supabase Dashboard**
   - 网址：https://supabase.com/dashboard
   - 选择项目：`hgzpzsiafycwlqrkzbis`

2. **修改 Site URL（这是安全的）**
   - 进入 **Settings** > **API**
   - 找到 **Site URL** 字段
   - 点击 **Edit**
   - 修改为：`https://sora2aivideos.com`
   - 点击 **Save**
   - ✅ **这是安全的**：只影响显示的 URL，不影响实际的 OAuth 流程

3. **确保 Redirect URLs 已配置（重要）**
   - 进入 **Authentication** > **URL Configuration**
   - 在 **Redirect URLs** 中确保包含：
     ```
     https://sora2aivideos.com/**
     https://sora2aivideos.com/auth/callback
     ```
   - 如果缺少，点击 **Add URL** 添加
   - ⚠️ **重要**：必须同时保留 Supabase 的回调地址在 Google Cloud Console 中

### 步骤 2: 验证 Google Cloud Console 配置

1. **访问 Google Cloud Console**
   - 网址：https://console.cloud.google.com/
   - 选择项目：`222103705593`

2. **检查 OAuth 2.0 客户端配置**
   - 进入 **APIs & Services** > **Credentials**
   - 点击你的 OAuth 2.0 客户端 ID
   - 在 **Authorized redirect URIs** 中确保包含：
     ```
     https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
     https://sora2aivideos.com/auth/callback
     ```
   - ⚠️ **重要**：必须保留 Supabase 的回调地址，否则 OAuth 流程会失败

### 步骤 3: 检查 OAuth 同意屏幕（可选）

1. **进入 OAuth 同意屏幕**
   - 在 Google Cloud Console 中，进入 **APIs & Services** > **OAuth consent screen**

2. **更新应用信息**
   - **应用名称**：设置为 "Sora2Ai Videos"
   - **应用主页链接**：设置为 `https://sora2aivideos.com`
   - **应用隐私政策链接**：设置为 `https://sora2aivideos.com/privacy`
   - **应用服务条款链接**：设置为 `https://sora2aivideos.com/terms`

3. **保存更改**
   - 点击 **Save and Continue**
   - 等待几分钟让更改生效

## ✅ 验证步骤

1. **清除浏览器缓存和 Cookie**
2. **重新测试登录流程**
   - 访问登录页面
   - 点击 "使用 Google 账号登录"
   - 检查 Google 登录页面是否显示 `https://sora2aivideos.com/`

## ✅ 为什么这样做不会"乱"？

### 1. OAuth 流程完全不变
- **实际的 OAuth 回调**：仍然通过 Supabase（`hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`）
- **Google Cloud Console 配置**：保持不变，仍然使用 Supabase 的回调地址
- **只是显示的 URL**：从 `hgzpzsiafycwlqrkzbis.supabase.co` 改为 `https://sora2aivideos.com/`

### 2. 其他功能不受影响
- **邮件链接**：会使用新的 Site URL（这是好事，显示你的域名）
- **重定向验证**：只要 Redirect URLs 正确配置，不会有问题
- **API 调用**：不受影响，仍然使用 `NEXT_PUBLIC_SUPABASE_URL`

### 3. 必须保留的配置
- ✅ **Google Cloud Console** 中的 `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback` **必须保留**
- ✅ 这是 OAuth 流程实际使用的回调地址
- ✅ 不能删除，否则 OAuth 会失败

### 4. 配置生效时间
- Supabase 配置：通常立即生效（几秒钟）
- Google 显示更新：可能需要几分钟到几小时（Google 缓存）

## 🔍 如果仍然显示 Supabase URL

如果修改后仍然显示 `hgzpzsiafycwlqrkzbis.supabase.co`，可能是因为：

1. **Google 缓存**
   - Google 可能会缓存 OAuth 应用的显示信息
   - 等待 24-48 小时让缓存更新

2. **Supabase 配置未生效**
   - 确认 Site URL 已正确保存
   - 等待几分钟后重新测试
   - 清除浏览器缓存和 Cookie

3. **redirect_uri 参数**
   - Google 显示的 URL 是从实际的 `redirect_uri` 参数中提取的
   - 如果 Supabase 仍然使用自己的 URL 作为 redirect_uri，Google 会显示那个 URL
   - 这可能需要联系 Supabase 支持，询问如何自定义 OAuth 请求中的 redirect_uri 显示

## 📋 总结：为什么这样做不会"乱"？

### ✅ 安全的修改
- **只修改显示的 URL**：从 `hgzpzsiafycwlqrkzbis.supabase.co` 改为 `https://sora2aivideos.com/`
- **OAuth 流程不变**：实际的回调仍然通过 Supabase
- **其他功能不受影响**：只要 Redirect URLs 正确配置

### ✅ 必须保留的配置
- **Google Cloud Console** 中的 Supabase 回调地址必须保留
- **Supabase Redirect URLs** 中必须包含你的域名

### ✅ 这样做的好处
- **提升用户体验**：用户看到的是你的域名，而不是 Supabase 的域名
- **增强信任度**：用户不会担心为什么是 Supabase 的域名
- **品牌一致性**：所有链接都显示你的域名

### ⚠️ 注意事项
- 确保 Redirect URLs 正确配置
- 不要删除 Google Cloud Console 中的 Supabase 回调地址
- 等待配置生效（可能需要几分钟）

3. **检查 Supabase 配置**
   - 确认 Site URL 已正确设置为 `https://sora2aivideos.com`
   - 确认 Redirect URLs 已正确配置
   - 等待几分钟后重新测试

