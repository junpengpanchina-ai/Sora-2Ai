# Google 登录调试 - 逐步指南

## 🎯 目标

收集所有必要的错误信息，以便精确定位 Google 登录失败的原因。

## 📋 步骤 1: 准备测试环境

### 1.1 清除浏览器数据
1. 打开浏览器（Chrome/Edge/Firefox）
2. 按 `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
3. 选择：
   - ✅ Cookie 和其他网站数据
   - ✅ 缓存的图片和文件
   - ✅ 本地存储的数据
4. 时间范围：**全部时间**
5. 点击 **清除数据**

### 1.2 打开开发者工具
1. 按 `F12` 打开开发者工具
2. 确保以下标签页打开：
   - **Console**（控制台）
   - **Network**（网络）

## 📋 步骤 2: 运行诊断代码

### 2.1 访问登录页面
- 本地开发：`http://localhost:3000/login`
- 生产环境：`http://sora2aivideos.com/login` 或你的 Vercel URL

### 2.2 在控制台运行诊断代码

**复制以下代码到浏览器控制台，然后按 Enter：**

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
  return info;
})();
```

### 2.3 复制诊断结果
- 复制控制台输出的 JSON 结果
- 保存备用

## 📋 步骤 3: 尝试登录并收集错误

### 3.1 清除网络日志
1. 切换到 **Network** 标签
2. 点击 🚫 图标清除所有日志
3. 确保 **Preserve log** 已勾选（如果可用）

### 3.2 点击登录按钮
1. 点击 "Sign in with Google" 按钮
2. **不要关闭开发者工具**
3. 观察控制台和网络标签

### 3.3 收集控制台错误
1. 查看 **Console** 标签
2. **复制所有红色错误信息**（完整文本）
3. 注意错误发生的时间点：
   - 点击登录按钮时？
   - 重定向到 Google 时？
   - 从 Google 返回时？

### 3.4 收集网络请求信息
1. 切换到 **Network** 标签
2. 查找**失败的请求**（红色状态码）
3. 对于每个失败的请求，点击并记录：
   - **Request URL**（完整 URL）
   - **Status Code**（如 400, 401, 500）
   - **Response**（如果有，复制内容）
   - **Request Headers**（特别是 `Referer` 和 `Origin`）

### 3.5 特别关注这些请求
- 到 Supabase 的请求（包含 `supabase.co`）
- 到 Google 的请求（包含 `google.com` 或 `accounts.google.com`）
- 到 `/auth/callback` 的请求

## 📋 步骤 4: 检查 Supabase Auth Logs

### 4.1 访问 Supabase Dashboard
1. 访问：https://supabase.com/dashboard
2. 登录你的账号
3. 选择项目：`hgzpzsiafycwlqrkzbis`

### 4.2 查看认证日志
1. 进入 **Logs** > **Auth Logs**
   - 或 **Authentication** > **Logs**（取决于界面版本）
2. 查找**最近的登录尝试**（按时间排序）
3. 查看每个尝试的：
   - **时间戳**
   - **状态**（成功/失败）
   - **错误消息**（如果有）
   - **用户信息**（如果有）

### 4.3 复制错误信息
- 如果有错误，复制完整的错误消息
- 截图（可选，但有用）

## 📋 步骤 5: 检查 Vercel 日志（如果已部署）

### 5.1 访问 Vercel Dashboard
1. 访问：https://vercel.com/dashboard
2. 选择项目 `Sora-2Ai`

### 5.2 查看函数日志
1. 进入 **Deployments** > 最新部署
2. 点击 **Functions** 标签
3. 找到 `/api/log-error` 函数
4. 查看日志输出
5. 搜索：
   - `[Client Error]`
   - `code_verifier`
   - `PKCE`
   - `OAuth`

### 5.3 复制相关日志
- 复制所有包含错误的日志行

## 📋 步骤 6: 收集用户界面错误

### 6.1 记录用户看到的错误
- 登录页面显示的错误消息（如果有）
- 错误发生的时间点
- 是否成功跳转到 Google 登录页面
- 从 Google 返回后发生了什么

## 📝 信息汇总清单

收集完上述信息后，请提供：

### ✅ 必需信息
- [ ] 浏览器控制台的完整错误消息（文本）
- [ ] 诊断代码的输出（JSON）
- [ ] 失败的网络请求详情（URL、状态码、响应）
- [ ] 当前环境（本地 `localhost:3000` 还是生产环境）
- [ ] 使用的浏览器（Chrome/Firefox/Safari）

### ✅ 可选但有用的信息
- [ ] Supabase Auth Logs 中的错误
- [ ] Vercel 函数日志中的错误
- [ ] 用户界面显示的错误消息
- [ ] 网络请求的截图（如果有）

## 🎯 快速收集模板

复制以下模板，填写后发给我：

```
=== Google 登录错误信息 ===

1. 环境信息：
   - 环境：[本地/生产]
   - URL：[实际访问的 URL]
   - 浏览器：[Chrome/Firefox/Safari 版本]

2. 控制台错误：
   [粘贴完整的错误消息]

3. 诊断代码输出：
   [粘贴 JSON 输出]

4. 网络请求失败：
   - URL：[失败的请求 URL]
   - 状态码：[如 400, 500]
   - 响应：[如果有]

5. 用户看到的错误：
   [描述或截图]

6. Supabase Auth Logs：
   [如果有错误，粘贴错误消息]

7. 其他信息：
   [任何其他相关信息]
```

## 🚀 开始调试

1. **先完成步骤 1-2**（准备环境和运行诊断）
2. **然后完成步骤 3**（尝试登录并收集错误）
3. **最后完成步骤 4-6**（检查日志）

收集完信息后，把结果发给我，我会帮你分析问题！

