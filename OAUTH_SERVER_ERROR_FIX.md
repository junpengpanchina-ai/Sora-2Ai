# OAuth server_error 修复指南（最终根因）

## 🔴 错误信息

```
OAuth callback error: server_error
Unable to exchange external code: 4/0ATX87...
```

## ✅ 错误分析

**真正导致登录失败的错误只有 1 条**：上面的 `server_error`

**可以忽略的错误**（80% 的红色报错）：
- ❌ Chrome Extension / BFCache 报错（`runtime.lastError`）
- ❌ `ERR_FILE_NOT_FOUND`（浏览器扩展脚本）
- ❌ `FrameDoesNotExistError`（DevTools 相关）

这些都与 OAuth 登录无关。

## 🎯 根因判断

**错误含义**：
- ✅ Google 已经成功给了你 code
- ✅ 前端、按钮、跳转、callback 路由都 OK
- ❌ **Supabase 在用这个 code 去找 Google 换 token 时失败了**

**问题位置**：Supabase ↔ Google 的配置层

## 🔥 两个最可能的根因（按概率排序）

### 🥇 根因 1：Google OAuth Redirect URI 没配对（最高概率 99%）

**问题**：Supabase 在 exchange 时使用的 URI 不在 Google Cloud Console 的授权列表中

**Supabase 使用的 URI**：
```
https://<PROJECT_REF>.supabase.co/auth/v1/callback
```

例如：
```
https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
```

### ✅ 修复步骤（1 分钟）

1. **打开 Google Cloud Console**
   - https://console.cloud.google.com/
   - APIs & Services → Credentials
   - 找到你的 OAuth 2.0 Client ID

2. **检查 Authorized redirect URIs**
   - 点击你的 OAuth Client
   - 查看 "Authorized redirect URIs" 列表

3. **添加 Supabase callback URI**
   - 点击 "+ ADD URI"
   - 输入（**必须精确匹配，一字不差**）：
     ```
     https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
     ```
   - 点击 "SAVE"

### ❌ 常见错误

- ❌ 少了 `/auth/v1/callback`（只写了 Supabase 域名）
- ❌ 用了 `https://sora2aivideos.com/auth/callback`（这是错的！）
- ❌ 多了斜杠：`https://...supabase.co/auth/v1/callback/`
- ❌ 用了旧 Supabase project 的 URI
- ❌ 协议不匹配（http vs https）

### ⚠️ 重要提示

**这个 redirect URI 不是你的网站域名，而是 Supabase 的域名！**

你的网站回调路径是 `/auth/callback`，但 Google 需要知道的是 Supabase 的回调路径。

---

### 🥈 根因 2：Supabase 里的 Google Client Secret 已过期/不一致

**表现形式**：正是你现在看到的 `server_error` + `Unable to exchange external code`

### ✅ 修复步骤（3 分钟）

1. **Google Cloud Console**
   - APIs & Services → Credentials → OAuth Client
   - 找到你的 OAuth Client
   - 点击 "RESET SECRET"（或创建新 secret）
   - **复制新的 Client Secret**（只显示一次！）

2. **Supabase Dashboard**
   - Authentication → Providers → Google
   - 粘贴：
     - **Client ID**（确认没变，通常不变）
     - **新的 Client Secret**（粘贴刚复制的）
   - 点击 "SAVE"

3. **验证**
   - 不需要重新部署代码
   - Supabase 配置是即时生效的
   - 立即测试登录

### ⚠️ 常见问题

- ❌ Secret 复制时多了空格/换行
- ❌ 用了旧的 Secret（已重置但没更新）
- ❌ Client ID 和 Secret 不匹配（来自不同的 OAuth Client）

---

## ✅ 最快验证修复（3 步）

### Step 1：无痕窗口（必须）

- 关掉所有扩展（或直接使用无痕窗口）
- 打开 `/login`

### Step 2：点击 Google 登录

- 完成 Google 授权
- 回到站点

### Step 3：看 Network（只看 1 条）

1. F12 → Network 标签
2. 过滤关键词：`token`
3. 找到这一条：
   ```
   https://<project>.supabase.co/auth/v1/token?grant_type=pkce
   ```
4. **检查 Status Code**：
   - ✅ **200 OK** → 问题已解决！
   - ❌ 400/500 → 继续检查配置

### 📊 验证清单

- [ ] Google Cloud Console → Authorized redirect URIs 包含 Supabase callback
- [ ] Supabase Dashboard → Google Provider → Client Secret 已更新
- [ ] Network → `auth/v1/token` → Status: **200 OK**
- [ ] 成功登录并获取 session

---

## 🧠 关键认知

**这个问题不是**：
- ❌ Vercel 问题
- ❌ 性能问题
- ❌ RES 问题
- ❌ 前端问题
- ❌ Chrome 报错

**这个问题是**：
- ✅ 标准的「Google OAuth ↔ Supabase redirect / secret 不匹配」问题

**你已经完成的修复**：
- ✅ 修掉 client/server 混用（很多人死在这里）
- ✅ 建了 debug 面板
- ✅ 建了验收 checklist
- ✅ 添加了防回归护栏

**现在只剩**：配置层最后一颗钉子

---

## 📋 快速检查清单

### Google Cloud Console 检查

- [ ] OAuth Client 状态：**已启用**
- [ ] Authorized redirect URIs 包含：
  ```
  https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback
  ```
- [ ] Client ID 和 Secret 已复制（准备粘贴到 Supabase）

### Supabase Dashboard 检查

- [ ] Authentication → Providers → Google → **已启用**
- [ ] Client ID：与 Google Cloud Console 一致
- [ ] Client Secret：已更新（如果重置过）
- [ ] URL Configuration：
  - Site URL: `https://sora2aivideos.com`
  - Redirect URLs: 包含 `https://sora2aivideos.com/**`

### 验证测试

- [ ] 无痕窗口测试
- [ ] Network → `auth/v1/token` → **200 OK**
- [ ] 成功登录

---

## 🚀 如果修复后仍然失败

如果修复了上述两个配置后仍然失败，请提供：

1. **Network Response**：
   - `auth/v1/token` 请求的完整 Response Body
   - Status Code

2. **Supabase Logs**：
   - Supabase Dashboard → Logs Explorer
   - 搜索 `oauth` / `google` / `exchange`
   - 查看详细错误堆栈

3. **配置截图**：
   - Google Cloud Console → Authorized redirect URIs
   - Supabase Dashboard → Google Provider 配置

---

## 💡 额外提示

### 为什么是 Supabase 的 URI？

OAuth 流程：
1. 用户点击登录 → 跳转到 Google
2. Google 授权后 → 跳转到 **Supabase**（不是你的网站）
3. Supabase 用 code 换 token → 跳转到你的网站 `/auth/callback`

所以 Google 需要知道的是 Supabase 的回调 URI，不是你的网站 URI。

### 为什么需要两个 Redirect URI？

1. **Google Cloud Console**：
   - `https://hgzpzsiafycwlqrkzbis.supabase.co/auth/v1/callback`（Supabase 回调）

2. **Supabase Dashboard**：
   - `https://sora2aivideos.com/**`（你的网站回调）

两个都需要配置，但作用不同。

