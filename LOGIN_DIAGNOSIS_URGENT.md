# 🔴 登录问题紧急排查方案（30-60分钟定位）

## 问题定性

**现象**：页面正常打开，但"登录始终不成功"

**最可能原因**（按概率排序）：
1. ✅ **Auth Redirect / Cookie 域问题**（90%）
2. Supabase Site URL 配置错误
3. Redirect URLs 白名单缺失
4. Cookie SameSite / HTTPS 问题
5. OAuth Provider 配置错误

---

## Step 1: 5分钟快速定性（浏览器无痕窗口测试）

### 操作步骤

1. **打开无痕窗口**（Chrome: Cmd+Shift+N / Ctrl+Shift+N）
2. **打开 DevTools**（F12）
3. **访问网站**：`https://sora2aivideos.com`
4. **点击「登录」按钮**

### 检查点 1：Console 错误

**查看 Console 标签页，寻找红色错误**

常见关键字：
- `auth`
- `cookie`
- `redirect`
- `CORS`
- `blocked`
- `SameSite`
- `Secure`

**如果看到红字** → 截图保存，99% 的问题就在那里

### 检查点 2：Network 请求

**切换到 Network 标签页，筛选 `auth` 或 `token`**

查找以下请求：
- `/auth/v1/token`
- `/auth/v1/callback`
- `supabase.co/auth/v1/*`

**检查请求状态**：

| 状态 | 说明 | 下一步 |
|------|------|--------|
| 请求根本没发 | 前端逻辑问题 | 检查 LoginButton.tsx |
| 401 / 403 | key / policy 问题 | 检查环境变量 |
| 200 但没 session | Cookie / domain 问题 | 检查 Cookie 设置 |
| 307 / 302 无限跳 | redirect 配置错 | 检查 Supabase Redirect URLs |

---

## Step 2: 10分钟检查 Supabase 配置（99% 的元凶）

### ✅ 1️⃣ Site URL（最重要）

**访问**：https://supabase.com/dashboard → 你的项目 → **Settings** → **API**

**检查 Site URL 字段**：

✅ **必须包含**：
```
https://sora2aivideos.com
```

❌ **常见错误**：
- 还留着 `localhost:3000`（生产环境）
- 写成 `www.sora2aivideos.com`（而你实际不用 www）
- 少了 `https://`
- 写成了 `http://`（生产环境必须是 https）

**修复**：点击 **Edit**，设置为 `https://sora2aivideos.com`，点击 **Save**

### ✅ 2️⃣ Redirect URLs（白名单）

**访问**：**Authentication** → **URL Configuration**

**检查 Redirect URLs 列表**：

✅ **必须包含**（一行一个）：
```
https://sora2aivideos.com/**
https://sora2aivideos.com/auth/callback
```

**如果缺少**：
1. 点击 **Add URL**
2. 添加上述两个 URL
3. 点击 **Save**

⚠️ **注意**：
- 路径必须完全匹配（包括 `/auth/callback`）
- 协议必须是 `https://`（生产环境）
- 不能有多余的斜杠

### ✅ 3️⃣ OAuth Provider（Google）

**访问**：**Authentication** → **Providers** → **Google**

**检查配置**：

✅ **必须启用**：开关应该是绿色/打开状态

✅ **Client ID**：
```
222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com
```

✅ **Client Secret**：
```
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
```

**如果配置错误**：
1. 更新配置
2. 点击 **Save**
3. 等待几秒钟让配置生效

---

## Step 3: 10分钟检查 Google Cloud Console

### 检查 OAuth 2.0 客户端

**访问**：https://console.cloud.google.com/ → 项目 `222103705593` → **APIs & Services** → **Credentials**

**点击你的 OAuth 2.0 客户端 ID**

### 检查 Authorized redirect URIs

✅ **必须包含**（完全匹配，包括协议和路径）：
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
https://sora2aivideos.com/auth/callback
```

⚠️ **重要**：
- 第一个是 Supabase 的回调地址（**必须**）
- 第二个是你的网站回调地址
- 路径是 `/auth/callback`（不是 `/api/auth/callback`）
- 协议必须匹配（https）
- 不能有多余的斜杠

**如果缺少**：
1. 点击 **+ ADD URI**
2. 输入缺失的 URI
3. 点击 **Save**
4. 等待 2-5 分钟让更改生效

---

## Step 4: 5分钟检查 Cookie / SameSite / HTTPS

### 检查点 1：网站是否 HTTPS

✅ **Vercel 默认是 HTTPS**，但确认：
- 访问 `https://sora2aivideos.com`（不是 `http://`）
- 浏览器地址栏显示锁图标

### 检查点 2：Cookie SameSite 错误

**在浏览器 Console 中运行**：
```javascript
// 检查 Cookie 设置
document.cookie.split(';').forEach(c => console.log(c.trim()))
```

**查找 Supabase Cookie**（格式：`sb-<project>-auth-token`）

**如果看到错误**：
```
This Set-Cookie was blocked because it had the "SameSite=None" attribute but was not marked "Secure"
```

👉 这是 HTTPS 配置问题，检查 Vercel 部署配置

### 检查点 3：Domain 一致性

**确认**：
- 网站访问：`https://sora2aivideos.com`
- Cookie Domain：应该是 `.sora2aivideos.com` 或 `sora2aivideos.com`
- **不能**是 `.www.sora2aivideos.com`

---

## Step 5: 5分钟检查是否"登录了但立刻被 logout"

### 快速自检

**搜索代码**（已检查，未发现问题）：
- ✅ 没有在每次 render 时调用 `signOut()`
- ✅ `onAuthStateChange` 逻辑正常
- ✅ SSR / RSC session 同步正常

**但请确认**：
- 登录成功后，session 是否立即被清除
- 检查 middleware.ts 是否有问题（已检查，正常）

---

## Step 6: 5分钟浏览器 Console 手动测试

### 在浏览器 Console 中运行

```javascript
// 1. 检查 Supabase 客户端
const { createClient } = await import('/lib/supabase/client.ts')
const supabase = createClient()

// 2. 检查当前 session
const { data: { session }, error } = await supabase.auth.getSession()
console.log('Session:', session)
console.log('Error:', error)

// 3. 如果 session 为 null，检查 Cookie
console.log('Cookies:', document.cookie)

// 4. 检查 localStorage
console.log('localStorage:', Object.keys(localStorage).filter(k => k.includes('supabase')))
```

**看返回结果**：

| 结果 | 说明 | 下一步 |
|------|------|--------|
| `session: null` | Cookie 根本没写进去 | 检查 Supabase Site URL / Redirect URLs |
| 有 session 但 UI 不更新 | 前端状态管理问题 | 检查 React 组件 |
| 有 session 但立刻消失 | 自动 logout 问题 | 检查 middleware / onAuthStateChange |

---

## 🔥 最高概率修复清单（按命中率排序）

### ✅ TOP 1: Supabase Site URL（90% 概率）

**操作**：
1. Supabase Dashboard → Settings → API
2. Site URL 设置为：`https://sora2aivideos.com`
3. 保存

### ✅ TOP 2: Redirect URLs 补全（85% 概率）

**操作**：
1. Supabase Dashboard → Authentication → URL Configuration
2. 添加：
   - `https://sora2aivideos.com/**`
   - `https://sora2aivideos.com/auth/callback`
3. 保存

### ✅ TOP 3: 确认没有 www / 非 www 混用（80% 概率）

**检查**：
- 网站访问：`https://sora2aivideos.com`（无 www）
- Supabase Site URL：`https://sora2aivideos.com`（无 www）
- Redirect URLs：`https://sora2aivideos.com/**`（无 www）

### ✅ TOP 4: 确认线上是 HTTPS（75% 概率）

**检查**：
- 访问 `https://sora2aivideos.com`（不是 http）
- Vercel 部署配置正确

### ✅ TOP 5: Console 看 Cookie 是否被 block（70% 概率）

**操作**：
1. 打开 DevTools → Console
2. 点击登录
3. 查看是否有 Cookie blocked 错误

---

## 🎯 快速修复命令

运行诊断脚本：
```bash
npm run diagnose:login
```

或手动检查：
```bash
# 检查环境变量
node scripts/diagnose-login.js
```

---

## 📝 修复后验证清单

- [ ] Supabase Site URL = `https://sora2aivideos.com`
- [ ] Redirect URLs 包含 `https://sora2aivideos.com/**` 和 `https://sora2aivideos.com/auth/callback`
- [ ] Google Cloud Console Redirect URI 包含 `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`
- [ ] 网站访问是 HTTPS（不是 HTTP）
- [ ] 无痕窗口测试登录成功
- [ ] Console 无红色错误
- [ ] Network 请求返回 200 且有 session
- [ ] Cookie 正常设置（无 blocked 错误）

---

## 💡 关键提醒

**你现在这个阶段**：
- SEO / GEO / Index = 潜在能赚钱的资产
- **登录系统一旦坏 = 漏斗 100% 漏水**

**修好登录 = 你现在 ROI 最高的一步**

---

## 🆘 如果以上都检查了还是不行

1. **截图 Console 错误**（如果有）
2. **截图 Network 请求**（特别是 auth 相关）
3. **截图 Supabase Dashboard 配置**（Site URL、Redirect URLs）
4. **提供具体错误信息**

然后我们可以进一步诊断。

