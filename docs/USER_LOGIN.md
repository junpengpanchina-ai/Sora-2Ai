# 用户登录流程说明

用于自查与迭代，看还有没有要改的地方。

---

## 1. 入口与 OAuth 发起

| 项目 | 说明 |
|------|------|
| **登录页** | `app/login/page.tsx`，`/login` |
| **按钮组件** | `components/LoginButton.tsx`，`signInWithOAuth({ provider: 'google', ... })` |
| **回调 URL** | `${origin}/auth/callback`，需与 Supabase / Google OAuth 配置一致 |
| **登录后跳转** | `lib/auth/post-login-redirect.ts`：`/login?redirect=...` > 当前页 > `/`，存 `sessionStorage` + `localStorage` |

**LoginButton 要点：**

- 发起前 `setPostLoginRedirect(redirectParam || currentPath || '/')`
- `redirectTo: ${origin}/auth/callback`，`skipBrowserRedirect: false`
- `queryParams: { prompt: 'consent', access_type: 'offline' }`
- 先查 `localStorage` 可用再发起；不可用则跳 `/login?error=...`
- 会等 PKCE 写入 storage 再 `window.location.assign(data.url)`（最多约 3s）

---

## 2. Middleware 放行

`middleware.ts`：

- `/auth/callback`、`/api/auth/callback`、`/api/auth/callback/[...nextauth]` **直接 `NextResponse.next()`**，不执行 `updateSession` 等，避免影响 OAuth 回调。

---

## 3. OAuth 回调：`/auth/callback`

`app/auth/callback/page.tsx`（Client Component）

### 3.1 参数与防重

- 取 `code`、`error`、`error_description`
- `error` 有值 → `/login?error=...`，不再继续
- 无 `code` → `/login?error=no_code`
- `isExecutingRef` 防止 `useEffect` 重复执行

### 3.2 用 code 换 session

1. `getSession()`，有则用  
2. 没有则等 100ms 再 `getSession()`  
3. 仍没有则 `exchangeCodeForSession(code)`，5s 超时；超时 → `/login?error=exchange_timeout`  
4. 失败：按 `status`/`message` 给出文案，`/api/log-oauth-error` 打点，再 `/login?error=...`

### 3.3 用户与 `users` 表同步（fix-user-id → 创建/更新）

1. **`getUser()`** 拿到 `user`
2. **`googleId`**：`user_metadata.provider_id` \| `user_metadata.sub` \| `app_metadata.provider_id` \| `user.id`
3. **`getSession()`** 取 `access_token`，请求 **`POST /api/auth/fix-user-id`** 时带 **`Authorization: Bearer <access_token>`**（因回调时 cookie 可能尚未写好，避免 401）

**fix-user-id 语义：**

- **404**：`users` 里没有该 `google_id` → 走**创建**
- **200 且 `fixed: true`**：已修 `users.id`，只做 **更新** `last_login_at`、`name`、`avatar_url`
- **200 且 `fixed: false`**：已同步，同样只做**更新**
- **非 2xx**：`/login?error=...`，不创建不更新

**创建（fix 404 时）：**

- `supabase.from('users').upsert({ id: user.id, google_id, email, name, avatar_url, last_login_at }, { onConflict: 'google_id' })`
- **`23505` 且与 email 相关** → `/login?error=此邮箱已绑定其他 Google 账号...`
- 其它 upsert 错 → `/login?error=用户记录创建失败...`
- 成功则 **`fetch('/api/auth/welcome-bonus')`** 不 await（ fire-and-forget）

**更新（fix 200 时）：**

- `supabase.from('users').update({ last_login_at, name, avatar_url }).eq('id', user.id)`

### 3.4 登录后跳转

- `intended = getPostLoginRedirect()`，`clearPostLoginRedirect()`
- `router.replace(intended || '/')`，`router.refresh()`

---

## 4. `/api/auth/fix-user-id`（POST）

`app/api/auth/fix-user-id/route.ts`

- **鉴权**：优先 `Authorization: Bearer`，否则 `getUser()`（cookie）
- **查 users**：`createServiceClient` 按 `google_id` 查 `users.id`
- 无行 → **404**
- `users.id === auth.uid()` → **200 `{ ok: true, fixed: false }`**
- 否则调 RPC **`fix_user_id_sync(p_old_id, p_new_id)`**（依赖迁移 `089_fix_user_id_sync_rpc.sql`），再更新 `name`、`avatar_url` → **200 `{ ok: true, fixed: true }`**
- **日志**：`[fix-user-id]` 前缀，记录 start / 401 / 404 / 200 already_in_sync / 200 fixed / 500，及 `hasBearer`、`userId`、`duration`

---

## 5. `/api/auth/welcome-bonus`（POST）

`app/api/auth/welcome-bonus/route.ts`

- **鉴权**：优先 `Authorization: Bearer`，否则 `getUser()`（cookie），便于 OAuth 回调在 cookie 未就绪时调用
- 无 user → 401
- 已有 `recharge_records` 且 `payment_method='system'` 且 `metadata->>'type'='welcome_bonus'` → 200 `alreadyGranted: true`
- 否则 `addWelcomeBonus(supabase, user.id)`
- **日志**：`[welcome-bonus]` 前缀，记录 start / already granted / success / 401 / 500 及 `hasBearer`、`duration`

`/auth/callback` 在创建新用户后会 **`fetch('/api/auth/welcome-bonus', { headers: { Authorization: 'Bearer ' + session.access_token } })`** 的 fire-and-forget，确保首登 30 积分在 cookie 未就绪时也能发放。

---

## 6. 登录后各 API 的鉴权

多数接口用 **`createClient`（server） + `getUser()`**，即依赖 **cookie**。

以下在 cookie 可能尚未就绪时，额外支持 **`Authorization: Bearer`**，避免 401：

- **`/api/auth/fix-user-id`**：见 §4
- **`/api/auth/welcome-bonus`**：见 §5
- **`/api/payment/recharge-records`**：`GET`，先读 `Authorization: Bearer`，再 `getUser(bearer)`，否则 `getUser()`

**HomePageClient** 在请求 `/api/payment/recharge-records` 时，会用 `getSession()` 取 `access_token` 并放在 `Authorization: Bearer` 里。

---

## 7. `getOrCreateUser` 与 `getGoogleId`

`lib/user.ts`

- **`getGoogleId(user)`**：`user_metadata.provider_id` \| `user_metadata.sub` \| `app_metadata.provider_id` \| `user.id`
- **`getOrCreateUser`**：  
  1. 先 `users`  where `id = user.id`（auth.uid）  
  2. 没有再 `users` where `google_id = getGoogleId(user)`  
  3. 有则返回；无则创建（逻辑在别处，此处不重复）

---

## 8. 管理员登录（与用户登录隔离）

- **用户**：Supabase Auth（Google OAuth）→ `sb-*-auth-token` 等 cookie；`users` 表
- **管理员**：`/admin/login` 表单，`/api/auth/admin-login`，成功后写 **`admin_session_token`** cookie；`admin_users`、`admin_sessions`、RPC `admin_create_session` / `admin_validate_session`
- `/admin/*`、`/api/admin/*` 只认 `admin_session_token`，不认 Supabase 的 user；故普通用户登入后访问 `/admin` 只会被重定向到 `/admin/login`。

---

## 9. 安全与约束

- **post-login 跳转**：`sanitizeRedirectPath` 限制仅站内路径，禁 `//`、`://`、`/auth/callback`、`/login`
- **users 防重**：`users.google_id`、`users.email` 均为 `UNIQUE`（`001_create_users_table.sql`），从库层面避免邮箱重复绑定
- **迁移 007**：已删除明文管理员密码的 INSERT；首个管理员需在 Supabase SQL 中手动创建；改密见 `scripts/change-admin-password.sql`
- **fix_user_id_sync**：依赖 089 迁移；若未执行，fix-user-id 在需要修 id 时会 500

---

## 10. 优化建议采纳与可选修改

### 10.1 已采纳

| 项目 | 说明 |
|------|------|
| **防重 / google_id 唯一** | `users.google_id`、`users.email` 已有 UNIQUE 约束 |
| **welcome-bonus Bearer** | API 支持 `Authorization: Bearer`，callback 创建用户后传 Bearer 调用 |
| **登录错误文案** | `app/login/page.tsx` 的 `getLoginErrorDisplay` 对 `no_code`、`exchange_timeout`、`no_session`、`callback_error`、`unknown_error` 给出标题 + 说明 + 操作步骤 |
| **fix-user-id / welcome-bonus 日志** | 两者均输出 `[fix-user-id]` / `[welcome-bonus]` 前缀的结构化日志（start、401、404、200、500、duration），便于 Vercel 等集中查看 |

### 10.2 待办 / 可选

| 项目 | 文件 / 位置 | 说明 |
|------|-------------|------|
| 其它需「登录后立刻调」的 API | `/api/wallet`、`/api/user/entitlements` 等 | 若首屏 401，可加 Bearer 支持，前端用 `getSession().access_token` 传入 |
| 自动化测试 | `/auth/callback`、`/api/auth/fix-user-id` | 为回调和 fix-user-id 增加单元测试、集成测试 |
| PKCE 与 storage | `LoginButton` | 若有 code_verifier 问题，可再收紧或加重试 |
| 089 / 007 / 090 / 091 等迁移 | `supabase/migrations/` | 确认线上已跑 089、007 无明文、090/091 索引已建 |

---

## 11. 下一步与交接（三步工作流）

### 11.1 部署后监控

- **日志**：`/api/auth/fix-user-id`、`/api/auth/welcome-bonus`、`/auth/callback` 已有或可接入 `[fix-user-id]`、`[welcome-bonus]`、`/api/log-oauth-error` 等；将日志对接到 Sentry、Datadog 或 ELK 等，便于按 `userId`、`hasBearer`、`duration` 排查。
- **告警**：对 401/403/500 频率设阈值（如 10 次/分钟）触发邮件或 Slack。
- **负载与回归**：定期对登录、fix-user-id、welcome-bonus 做压力与回归测试。

### 11.2 文档与流程图

- **流程图**：用 Draw.io / Mermaid 等画出从 LoginButton → OAuth → /auth/callback → fix-user-id / 创建 / welcome-bonus → 跳转的完整流程，便于新人理解。
- **API 文档**：用 OpenAPI 或 Postman 维护 `/api/auth/fix-user-id`、`/api/auth/welcome-bonus` 的请求/响应与错误码。
- **错误码与处理指南**：将 `no_code`、`exchange_timeout`、`no_session`、23505 等汇总为内部手册，统一处理方式。

### 11.3 对接 SEO / GEO 与数据扩展

- **SEO**：登录后页面通过 `robots.txt`、meta 控制索引；登录流程本身不暴露可抓取敏感信息。
- **GEO**：按登录或 IP 做地域标记，用于本地化、风控与运营分析。
- **支付与积分**：在现有 fix-user-id、welcome-bonus、`recharge_records` 之上，确保支付、扣减、对账与 `users`/`auth.uid()` 一致；后台对余额、消费、奖励做可视化。
- **用户生命周期**：按注册、首登、活跃、流失等阶段做分层，支撑 SEO、营销与产品迭代。

---

## 12. 相关文件一览

- `app/login/page.tsx` — 登录页
- `components/LoginButton.tsx` — Google 登录按钮
- `app/auth/callback/page.tsx` — OAuth 回调
- `app/api/auth/fix-user-id/route.ts` — 修 users.id / 查是否存在
- `app/api/auth/welcome-bonus/route.ts` — 新用户 30 积分
- `lib/auth/post-login-redirect.ts` — 登录后跳转
- `lib/user.ts` — `getGoogleId`、`getOrCreateUser`
- `lib/supabase/middleware.ts` — `updateSession`（`/auth/callback` 在根 middleware 中被排除）
- `middleware.ts` — OAuth 路径放行
- `supabase/migrations/007_*.sql` — 管理员与 session（无明文种子）
- `supabase/migrations/089_fix_user_id_sync_rpc.sql` — `fix_user_id_sync` RPC
- `scripts/change-admin-password.sql` — 管理员改密
