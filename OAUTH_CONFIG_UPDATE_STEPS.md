# OAuth 配置更新步骤

## ✅ 已完成的配置

### Google Cloud Console
- ✅ Authorized redirect URI 已添加：
  ```
  https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
  ```
- ✅ 新客户端密钥已生成：
  ```
  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
  ```

## 🔧 下一步：更新 Supabase 配置

### Step 1: 登录 Supabase Dashboard
1. 访问：https://supabase.com/dashboard
2. 选择项目：`hgzpzsiafycwlqrkzbis`

### Step 2: 更新 Google Provider 配置
1. 导航到：**Authentication** → **Providers** → **Google**
2. 确认/更新以下字段：

   **Client ID (Hosted)**：
   ```
   222103705593-a327264an5kuogc8f4n5tlc7c83d4313.apps.googleusercontent.com
   ```
   （应该与 Google Cloud Console 中的一致）

   **Client Secret (Hosted)**：
   ```
   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
   ```
   （粘贴新生成的密钥）

3. 点击 **"Save"** 保存

### Step 3: 验证 URL 配置
1. 导航到：**Authentication** → **URL Configuration**
2. 确认以下配置：

   **Site URL**：
   ```
   https://sora2aivideos.com
   ```

   **Redirect URLs**：
   ```
   https://sora2aivideos.com/**
   ```
   （或更具体的路径，如 `https://sora2aivideos.com/auth/callback`）

3. 点击 **"Save"** 保存

## ⏱️ 配置生效时间

- **Supabase 配置**：即时生效（无需重新部署）
- **Google Cloud Console 配置**：可能需要 5 分钟到几小时

## ✅ 验证修复（3 步测试）

### Step 1: 清除浏览器存储
在控制台运行：
```javascript
(() => { 
  const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)]
    .filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth'))
  [...new Set(keys)].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k) })
  console.log(`✅ 已清除 ${[...new Set(keys)].length} 个键`)
})()
```

### Step 2: 无痕窗口测试
1. 打开无痕窗口
2. 访问：`https://sora2aivideos.com/login`
3. 点击 "Sign in with Google"
4. 完成 Google 授权

### Step 3: 检查 Network 请求
1. F12 → Network 标签
2. 过滤：`token`
3. 找到：`auth/v1/token?grant_type=pkce`
4. **Status 应该是：200 OK** ✅

如果 Status 是 200，问题已解决！

## 🔍 如果仍然失败

如果 Status 不是 200，请检查：

1. **Network Response**：
   - 查看 Response Body 中的 `error` 和 `error_description`
   - 截图或复制给我

2. **Supabase Logs**：
   - Supabase Dashboard → Logs Explorer
   - 搜索：`oauth` / `google` / `exchange`
   - 查看详细错误

3. **等待配置生效**：
   - Google Cloud Console 配置可能需要时间生效
   - 等待 5-10 分钟后重试

## 📋 配置检查清单

### Google Cloud Console
- [x] Authorized redirect URI 包含 Supabase callback
- [x] 新客户端密钥已生成
- [ ] 旧密钥已停用（如果不再使用）

### Supabase Dashboard
- [ ] Google Provider → Client ID 正确
- [ ] Google Provider → Client Secret 已更新为新密钥
- [ ] URL Configuration → Site URL 正确
- [ ] URL Configuration → Redirect URLs 正确

### 测试验证
- [ ] 清除浏览器存储
- [ ] 无痕窗口测试
- [ ] Network → `auth/v1/token` → Status: **200 OK**
- [ ] 成功登录并获取 session

