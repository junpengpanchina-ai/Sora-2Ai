# 诊断后的下一步操作

## ✅ 诊断结果

所有**本地配置**都正确：
- ✅ 环境变量正确
- ✅ Google OAuth 凭据正确
- ✅ 代码配置正确

## 🔴 需要立即检查的 3 个配置

### 1. Supabase Dashboard 配置（最重要）

**访问**: https://supabase.com/dashboard

#### 检查 1: Site URL
1. 进入 **Settings** > **API**
2. 查看 **Site URL** 字段
3. **必须包含**: `http://sora2aivideos.com`
4. **如果缺少**: 点击 **Edit**，添加 `http://sora2aivideos.com`，点击 **Save**

#### 检查 2: Redirect URLs
1. 进入 **Authentication** > **URL Configuration**
2. 查看 **Redirect URLs** 列表
3. **必须包含**:
   ```
   http://sora2aivideos.com/**
   http://sora2aivideos.com/auth/callback
   ```
4. **如果缺少**: 点击 **Add URL**，添加上述 URL，点击 **Save**

#### 检查 3: Google Provider
1. 进入 **Authentication** > **Providers**
2. 找到 **Google** provider
3. **确认**:
   - ✅ 开关已启用（绿色）
   - ✅ Client ID: `222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com`
   - ✅ Client Secret: `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`
   - ✅ 已点击 **Save**

### 2. Google Cloud Console 配置

**访问**: https://console.cloud.google.com/

1. 选择项目: `222103705593`
2. 进入 **APIs & Services** > **Credentials**
3. 点击你的 **OAuth 2.0 客户端 ID**
4. 查看 **Authorized redirect URIs** 部分

**必须包含以下 URI**（完全匹配，包括协议）:
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
http://sora2aivideos.com/auth/callback
```

**重要提示**:
- ✅ 路径是 `/auth/callback`（不是 `/api/auth/callback`）
- ✅ 协议必须匹配（http vs https）
- ✅ 不能有多余的斜杠
- ✅ 保存后等待几分钟让更改生效

**如果缺少，添加**:
1. 点击 **+ ADD URI**
2. 输入缺失的 URI
3. 点击 **Save**
4. 等待 2-5 分钟让更改生效

### 3. 浏览器设置

**清除浏览器数据**:
1. Chrome: `设置` > `隐私和安全` > `清除浏览数据`
2. 选择:
   - ✅ Cookie 和其他网站数据
   - ✅ 缓存的图片和文件
   - ✅ 本地存储的数据
3. 时间范围: `全部时间`
4. 点击 **清除数据**

**检查浏览器设置**:
- ✅ 未使用无痕/隐私模式
- ✅ 允许 Cookie 和网站数据
- ✅ 没有扩展程序阻止 localStorage

## 🧪 测试步骤

完成上述配置后：

1. **清除浏览器缓存**（如上）
2. **访问登录页面**: `http://sora2aivideos.com/login`
3. **打开开发者工具**: 按 `F12`
4. **查看 Console 标签**: 准备查看日志
5. **点击登录按钮**: "Sign in with Google"
6. **观察**:
   - 是否跳转到 Google 登录页面
   - 控制台是否有错误信息
   - 授权后是否成功返回

## 📊 预期行为

### 成功流程：
1. ✅ 点击登录按钮
2. ✅ 控制台显示: `✅ localStorage is available`
3. ✅ 控制台显示: `✅ code_verifier saved successfully`
4. ✅ 跳转到 Google 登录页面
5. ✅ 选择 Google 账号并授权
6. ✅ 自动返回应用并登录成功

### 如果失败，查看错误：

**浏览器控制台错误**:
- 复制完整的错误消息
- 查看 Network 标签的失败请求

**常见错误**:
- `redirect_uri_mismatch` → Google Cloud Console 配置问题
- `code_verifier not found` → localStorage 或 Supabase 配置问题
- `OAuth 配置错误` → Supabase Provider 未启用

## 🔧 如果仍然失败

### 收集调试信息

1. **浏览器控制台**:
   ```javascript
   // 在控制台运行
   console.log('localStorage keys:', Object.keys(localStorage).filter(k => k.includes('supabase')))
   console.log('Current URL:', window.location.href)
   console.log('Origin:', window.location.origin)
   ```

2. **网络请求**:
   - 开发者工具 > Network 标签
   - 查找失败的请求（红色）
   - 查看请求 URL 和响应

3. **Supabase 日志**:
   - Supabase Dashboard > Logs > Auth Logs
   - 查看最近的认证尝试

## 📝 检查清单

完成所有检查后，确认：

- [ ] Supabase Site URL 包含 `http://sora2aivideos.com`
- [ ] Supabase Redirect URLs 包含 `http://sora2aivideos.com/**`
- [ ] Supabase Google Provider 已启用
- [ ] Google Cloud Console 重定向 URI 包含 Supabase 回调
- [ ] Google Cloud Console 重定向 URI 包含应用回调
- [ ] 浏览器已清除缓存和 Cookie
- [ ] 未使用无痕模式
- [ ] 已测试登录流程

## 🎯 优先级

**最高优先级**（先检查）:
1. Supabase Site URL 配置
2. Google Cloud Console 重定向 URI

**中等优先级**:
3. Supabase Redirect URLs
4. 浏览器缓存清除

**如果仍然失败**:
5. 查看详细错误日志
6. 检查 Supabase Auth Logs

