# OAuth 登录失败修复：Supabase Client 配置问题

## 🔴 错误信息

```
Supabase Client is configured with the accessToken option, accessing supabase.auth.* is not possible
```

## 📋 问题根因

**核心问题**：Supabase client 被配置为"带 accessToken 的模式"（通常用于服务端），但前端代码试图调用 `supabase.auth.signInWithOAuth()` 等方法。

**错误原因**：
- ✅ 创建 Supabase client 时传了 `accessToken`（通常用于服务端带用户 JWT 做数据库/Storage 操作）
- ❌ 但前端（或需要 auth 的地方）调用了 `supabase.auth.signInWithOAuth()` / `supabase.auth.getSession()` 等
- ➡️ SDK 直接禁止并抛错 —— 所以用户永远登录不了

## ✅ 修复方案

### 文件结构

项目中的 Supabase client 文件：

1. **`lib/supabase/client.ts`** - 浏览器客户端（用于登录/登出/auth 操作）
   - ✅ 使用：`@supabase/supabase-js` 的 `createSupabaseClient`
   - ✅ 不传 `accessToken`
   - ✅ 不传 `global.headers.Authorization`

2. **`lib/supabase/server.ts`** - 服务端客户端（用于数据库操作）
   - ✅ 使用：`@supabase/ssr` 的 `createServerClient`
   - ⚠️ 可能传 `Authorization` header（如果请求头中有）

3. **`lib/supabase/service.ts`** - Service Role 客户端（用于管理员操作）
   - ✅ 使用：`@supabase/supabase-js` 的 `createClient`
   - ✅ 使用 Service Role Key

### 使用规则

#### ✅ 浏览器端（Client Components）

**必须使用** `lib/supabase/client.ts`：

```typescript
import { createClient } from '@/lib/supabase/client'

// ✅ 正确：用于登录
const supabase = createClient()
await supabase.auth.signInWithOAuth({ provider: 'google' })

// ✅ 正确：用于获取 session
const { data: { session } } = await supabase.auth.getSession()

// ✅ 正确：用于登出
await supabase.auth.signOut()
```

**禁止使用** `lib/supabase/server.ts` 在浏览器端！

#### ✅ 服务端（Server Components / API Routes）

**必须使用** `lib/supabase/server.ts`：

```typescript
import { createClient } from '@/lib/supabase/server'

// ✅ 正确：用于数据库查询
const supabase = await createClient()
const { data } = await supabase.from('users').select('*')

// ❌ 错误：不要在服务端调用 auth 方法
// await supabase.auth.signInWithOAuth() // 这会失败！
```

## 🔍 验证修复

修复后按以下步骤验证（3 分钟）：

1. **打开无痕窗口** → 访问 `/login`
2. **F12 Console** → 必须不再出现：
   ```
   configured with the accessToken option ... supabase.auth ... not possible
   ```
3. **点击 Google 登录**
4. **Network 标签** → 应该看到：
   - `.../auth/v1/authorize` ✅
   - `.../auth/v1/token?grant_type=pkce` → `200 OK` ✅

## 📝 当前项目状态

### ✅ 已正确使用的文件

- `components/LoginButton.tsx` → `@/lib/supabase/client` ✅
- `app/auth/callback/page.tsx` → `@/lib/supabase/client` ✅
- `components/EmailLoginForm.tsx` → `@/lib/supabase/client` ✅
- `components/LogoutButton.tsx` → `@/lib/supabase/client` ✅

### ⚠️ 需要检查的文件

如果以下文件在浏览器端使用了 `@/lib/supabase/server`，需要改为 `@/lib/supabase/client`：

- `app/admin/AdminGeoManager.tsx`
- `app/admin/AdminIndustryModelConfig.tsx`
- `app/admin/AdminSceneModelConfig.tsx`
- `app/admin/AdminClient.tsx`

## 🚀 快速修复检查清单

- [ ] 确认 `lib/supabase/client.ts` 没有传 `accessToken`
- [ ] 确认 `lib/supabase/client.ts` 没有传 `global.headers.Authorization`
- [ ] 确认所有浏览器端组件使用 `@/lib/supabase/client`
- [ ] 确认所有服务端代码使用 `@/lib/supabase/server`
- [ ] 测试登录流程：无痕窗口 → `/login` → Google 登录 → 成功

## 💡 额外说明

**关于 "Unable to exchange external code" 错误**：

这个错误通常发生在 token exchange 阶段失败。但如果 Supabase client 配置错误（传了 accessToken），错误会"漂移"到更上游，导致很难排除。

修复 client 配置后，如果仍然出现 "Unable to exchange external code"，请参考 `OAUTH_EXCHANGE_DIAGNOSIS_GUIDE.md` 进行网络请求级别的诊断。

