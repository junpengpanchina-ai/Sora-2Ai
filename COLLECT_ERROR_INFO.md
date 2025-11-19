# 收集错误信息 - 详细指南

## 🔍 步骤 1: 收集浏览器控制台错误

### 方法 1: 手动收集

1. **打开浏览器开发者工具**
   - Chrome/Edge: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Firefox: 按 `F12` 或 `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
   - Safari: 需要先启用开发者工具（偏好设置 > 高级 > 显示开发菜单）

2. **切换到 Console 标签**
   - 查看所有红色错误信息
   - 查看黄色警告信息

3. **复制错误信息**
   - 右键点击错误 > Copy > Copy message
   - 或手动复制完整的错误文本

4. **运行诊断命令**（在控制台中）
   ```javascript
   // 复制以下代码到控制台，然后复制输出结果
   console.log('=== 诊断信息 ===');
   console.log('URL:', window.location.href);
   console.log('Origin:', window.location.origin);
   console.log('localStorage keys:', Object.keys(localStorage));
   console.log('Supabase keys:', Object.keys(localStorage).filter(k => k.includes('supabase')));
   console.log('Cookies:', document.cookie);
   ```

### 方法 2: 使用网络标签

1. **切换到 Network 标签**
2. **清除网络日志**（点击 🚫 图标）
3. **尝试登录**
4. **查找失败的请求**（红色）
5. **点击失败的请求**，查看：
   - Request URL
   - Request Headers
   - Response（如果有）
   - Status Code

## 🔍 步骤 2: 检查 Supabase Auth Logs

1. **访问 Supabase Dashboard**
   - https://supabase.com/dashboard
   - 选择项目 `hgzpzsiafycwlqrkzbis`

2. **查看认证日志**
   - 进入 **Logs** > **Auth Logs**
   - 或 **Authentication** > **Logs**

3. **查找最近的登录尝试**
   - 查看时间戳
   - 查看错误消息
   - 查看状态（成功/失败）

4. **截图或复制错误信息**

## 🔍 步骤 3: 检查 Vercel 日志（如果已部署）

1. **访问 Vercel Dashboard**
   - https://vercel.com/dashboard
   - 选择你的项目

2. **查看函数日志**
   - 进入 **Deployments** > 最新部署
   - 点击 **Functions** 标签
   - 找到 `/api/log-error` 函数
   - 查看日志输出

3. **搜索错误**
   - 搜索 `[Client Error]`
   - 搜索 `code_verifier`
   - 搜索 `PKCE`

## 🔍 步骤 4: 运行详细诊断

在项目目录运行：

```bash
npm run diagnose:login
```

然后提供完整的输出结果。

## 📋 需要收集的信息清单

请提供以下信息：

### 1. 浏览器控制台错误
- [ ] 完整的错误消息（复制文本）
- [ ] 错误发生的时间点（点击登录前/后/重定向时）
- [ ] 是否有多个错误

### 2. 网络请求信息
- [ ] 失败的请求 URL
- [ ] 请求状态码（如 400, 401, 500）
- [ ] 响应内容（如果有）

### 3. 诊断脚本输出
- [ ] 运行 `npm run diagnose:login` 的完整输出

### 4. 环境信息
- [ ] 你在哪个环境测试？（本地 `localhost:3000` 还是生产 `sora2aivideos.com`）
- [ ] 使用的浏览器（Chrome/Firefox/Safari）
- [ ] 是否使用无痕模式

### 5. 具体错误消息
- [ ] 用户看到的错误消息（如果有）
- [ ] 控制台中的完整错误堆栈

## 🎯 常见错误模式

### 错误 1: "code_verifier not found"
**需要检查**:
- localStorage 是否可用
- 是否在无痕模式
- Supabase Site URL 配置

### 错误 2: "redirect_uri_mismatch"
**需要检查**:
- Google Cloud Console 重定向 URI
- 当前访问的 URL

### 错误 3: "invalid request"
**需要检查**:
- Supabase Google Provider 配置
- 授权码是否过期

### 错误 4: "OAuth 配置错误"
**需要检查**:
- Supabase Google Provider 是否启用
- Client ID 和 Secret 是否正确

## 📝 快速收集脚本

在浏览器控制台运行以下代码，然后复制输出：

```javascript
(async function() {
  const info = {
    url: window.location.href,
    origin: window.location.origin,
    localStorage: {
      allKeys: Object.keys(localStorage),
      supabaseKeys: Object.keys(localStorage).filter(k => k.includes('supabase')),
      hasCodeVerifier: Object.keys(localStorage).some(k => 
        k.includes('code-verifier') || k.includes('verifier')
      ),
    },
    cookies: document.cookie,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
  
  console.log('=== 诊断信息 ===');
  console.log(JSON.stringify(info, null, 2));
  
  // 检查 Supabase 客户端
  try {
    const supabaseUrl = window.location.origin.includes('localhost') 
      ? 'http://localhost:3000' 
      : 'http://sora2aivideos.com';
    console.log('Expected Supabase URL:', supabaseUrl);
  } catch (e) {
    console.error('Error:', e);
  }
  
  return info;
})();
```

## 🚀 下一步

收集完上述信息后，请提供：
1. 浏览器控制台的完整错误信息
2. 网络请求的失败详情
3. 诊断脚本的输出
4. 你看到的具体错误消息

这样我就能精确定位问题并提供解决方案！

