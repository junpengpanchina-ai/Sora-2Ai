# Google 登录失败 - 快速修复指南

## 🔍 诊断结果

✅ **环境变量**: 全部正确
✅ **代码配置**: 全部正确
⚠️  **需要检查**: Supabase 和 Google Cloud Console 配置

## 🎯 最可能的原因（按优先级）

### 1. Supabase Site URL 配置错误 ⚠️ **最可能**

**问题**: Supabase Dashboard 中的 Site URL 可能不包含你的生产 URL

**检查步骤**:
1. 访问 https://supabase.com/dashboard
2. 选择项目 `hgzpzsiafycwlqrkzbis`
3. 进入 **Settings** > **API**
4. 查看 **Site URL** 字段

**应该包含**:
```
http://sora2aivideos.com
```
或
```
https://sora2aivideos.com
```

**如果缺少，修复**:
1. 点击 **Edit**
2. 添加或修改为: `http://sora2aivideos.com`
3. 点击 **Save**
4. 等待几秒钟让配置生效

### 2. Supabase Redirect URLs 配置错误

**检查步骤**:
1. 进入 **Authentication** > **URL Configuration**
2. 查看 **Redirect URLs** 列表

**必须包含**:
```
http://sora2aivideos.com/**
http://sora2aivideos.com/auth/callback
```

**如果缺少，修复**:
1. 点击 **Add URL**
2. 添加上述 URL
3. 点击 **Save**

### 3. Google Cloud Console 重定向 URI 不完整

**检查步骤**:
1. 访问 https://console.cloud.google.com/
2. 选择项目 `222103705593`
3. 进入 **APIs & Services** > **Credentials**
4. 点击 OAuth 2.0 客户端 ID
5. 查看 **Authorized redirect URIs**

**必须包含**（完全匹配）:
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
http://sora2aivideos.com/auth/callback
```

**注意**:
- 路径是 `/auth/callback`（不是 `/api/auth/callback`）
- 协议必须匹配（http vs https）
- 不能有多余的斜杠

**如果缺少，修复**:
1. 点击 **+ ADD URI**
2. 添加缺失的 URI
3. 点击 **Save**
4. 等待几分钟让更改生效

### 4. code_verifier 保存失败（已知问题）

这是之前一直遇到的问题。已添加验证逻辑，但如果仍然失败：

**可能原因**:
- 浏览器清除了 localStorage
- 跨域重定向问题
- Supabase 配置不匹配

**解决方案**:
1. 清除浏览器缓存和 Cookie
2. 确保未使用无痕模式
3. 检查浏览器是否允许 localStorage
4. 确认 Supabase Site URL 配置正确

## 🚀 快速修复步骤（按顺序执行）

### 步骤 1: 检查 Supabase 配置（5分钟）

1. **访问**: https://supabase.com/dashboard
2. **检查 Site URL**:
   - Settings > API > Site URL
   - 应该包含: `http://sora2aivideos.com`
3. **检查 Redirect URLs**:
   - Authentication > URL Configuration
   - 应该包含: `http://sora2aivideos.com/**`
4. **检查 Google Provider**:
   - Authentication > Providers > Google
   - 确认已启用
   - 确认 Client ID 和 Secret 正确

### 步骤 2: 检查 Google Cloud Console（5分钟）

1. **访问**: https://console.cloud.google.com/
2. **检查重定向 URI**:
   - APIs & Services > Credentials > OAuth 2.0 客户端
   - 必须包含:
     - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
     - `http://sora2aivideos.com/auth/callback`
3. **保存更改**（如果有修改）

### 步骤 3: 清除浏览器数据并测试（2分钟）

1. **清除浏览器数据**:
   - Chrome: 设置 > 隐私和安全 > 清除浏览数据
   - 选择: Cookie、缓存、本地存储
2. **测试登录**:
   - 访问 `http://sora2aivideos.com/login`
   - 打开开发者工具（F12）
   - 点击登录按钮
   - 查看控制台输出

### 步骤 4: 检查错误日志（如果仍然失败）

1. **浏览器控制台**:
   - 查看 Console 标签的错误信息
   - 查看 Network 标签的请求状态
2. **Vercel 日志**（如果已部署）:
   - 查看 `/api/log-error` 的日志
   - 搜索 `[Client Error]`
3. **Supabase 日志**:
   - Dashboard > Logs > Auth Logs
   - 查看最近的认证尝试

## 📋 检查清单

完成以下所有检查项：

- [ ] Supabase Site URL 包含 `http://sora2aivideos.com`
- [ ] Supabase Redirect URLs 包含 `http://sora2aivideos.com/**`
- [ ] Supabase Google Provider 已启用
- [ ] Google Cloud Console 重定向 URI 包含 Supabase 回调
- [ ] Google Cloud Console 重定向 URI 包含应用回调
- [ ] 浏览器已清除缓存和 Cookie
- [ ] 未使用无痕模式
- [ ] 浏览器允许 Cookie 和 localStorage

## 🔧 如果仍然失败

### 查看详细错误信息

1. **浏览器控制台**:
   ```javascript
   // 查看 localStorage 中的 Supabase 数据
   Object.keys(localStorage).filter(key => key.includes('supabase'))
   ```

2. **网络请求**:
   - 开发者工具 > Network 标签
   - 查找失败的请求
   - 查看请求和响应详情

3. **运行诊断脚本**:
   ```bash
   node scripts/diagnose-google-login.js
   ```

### 常见错误消息

| 错误消息 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `redirect_uri_mismatch` | Google 重定向 URI 不匹配 | 检查 Google Cloud Console |
| `code_verifier not found` | localStorage 问题 | 清除缓存，检查浏览器设置 |
| `invalid request` | PKCE 流程失败 | 检查 Supabase 配置 |
| `OAuth 配置错误` | Supabase Provider 未启用 | 启用 Google Provider |

## 📞 需要帮助？

如果完成所有检查后仍然失败，请提供：

1. **浏览器控制台错误信息**（截图或文本）
2. **网络请求详情**（失败的请求）
3. **Vercel 日志**（如果有）
4. **Supabase Auth Logs**（最近的认证尝试）

