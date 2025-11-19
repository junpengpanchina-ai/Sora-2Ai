# 本地开发 OAuth 登录修复 - 关键问题

## 🔴 发现的问题

你的 `.env.local` 中 `NEXT_PUBLIC_APP_URL` 设置为：
```
NEXT_PUBLIC_APP_URL=http://sora2aivideos.com
```

**但你在本地开发环境中测试！**

## ⚠️ 这会导致的问题

1. **重定向 URL 不匹配**
   - 登录时 `window.location.origin` 是 `http://localhost:3000`
   - 但 Supabase 可能期望 `http://sora2aivideos.com`
   - 导致 `code_verifier` 无法正确保存

2. **Supabase Site URL 配置**
   - Supabase Dashboard 中的 Site URL 可能没有包含 `localhost:3000`
   - 导致重定向被拒绝

## ✅ 立即修复步骤

### 步骤 1: 修改本地环境变量

编辑 `.env.local` 文件：

```bash
# 将这一行：
NEXT_PUBLIC_APP_URL=http://sora2aivideos.com

# 改为（本地开发）：
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 步骤 2: 检查 Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 检查 **Site URL**：
   - 应该包含 `http://localhost:3000` 或设置为 `http://localhost:3000`
5. 进入 **Authentication** > **URL Configuration**
6. 在 **Redirect URLs** 中添加：
   ```
   http://localhost:3000/**
   http://localhost:3000/auth/callback
   ```

### 步骤 3: 检查 Google Cloud Console

确保重定向 URI 包含：
```
http://localhost:3000/auth/callback
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

### 步骤 4: 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

## 🧪 测试

1. 访问 `http://localhost:3000/login`
2. 打开浏览器开发者工具（F12）
3. 点击登录按钮
4. 查看控制台，应该看到：
   ```
   Initiating OAuth login... { redirectTo: 'http://localhost:3000/auth/callback' }
   ✅ code_verifier saved successfully
   ```

## 📝 环境变量分离建议

为了区分开发和生产环境，建议：

**`.env.local` (本地开发)**:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Vercel 环境变量** (生产环境):
```
NEXT_PUBLIC_APP_URL=http://sora2aivideos.com
```

## 🎯 关键点

- ✅ **本地开发**：必须使用 `http://localhost:3000`
- ✅ **Supabase Site URL**：必须包含 `http://localhost:3000`
- ✅ **Google 重定向 URI**：必须包含 `http://localhost:3000/auth/callback`
- ✅ **重启服务器**：修改环境变量后必须重启

