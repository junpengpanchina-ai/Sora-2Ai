# P2 | Credits 单一化到 wallets — 执行方案

> 目标：**钱只认一个地方**。展示、扣费、补单、对账只认 `wallets`；`users.credits` 进入只读冻结 → 迁移 → 下线。

---

## 一、代码 diff 清单（文件级）

| 文件 | Step | 改动摘要 |
|------|------|----------|
| `app/api/payment/recharge-records/route.ts` | 1 | 主展示读 `wallets`，返回 `user_credits`、`wallet_total_credits`、`wallet_permanent_credits`、`wallet_bonus_credits`、`legacy_user_credits`（只读对账，Phase 3 可删）；`walletErr` 时 500 |
| `app/profile/ProfileClient.tsx` | 1 | 展示用 `wallet_total_credits ?? user_credits` 过渡 |
| `app/api/payment/check-recharge/route.ts` | 2 | 停写 `users.credits`；Stripe 已 paid + 本地 pending 时走 `grant_credits_for_purchase`（`manual_reconcile_${session.id}` / `manual_reconcile_pi_${id}`）；结构化日志：`event_id`、`session_id`/`payment_intent_id`、`plan_id`、`user_id`、`rpc_result`、`duration_ms` |
| `app/api/stripe/webhook/route.ts` | 监控 | 结构化日志：`event_id`、`session_id`、`plan_id`、`user_id`、`rpc_result`（ok / pending / unknown_plan）、`duration_ms` |
| `app/api/payment/check-session/route.ts` | 1 | 只读 `wallets`，`user_credits` = permanent + bonus |

**未改（按 P2 范围）**：Stripe、`grant_credits_for_purchase`、扣费 RPC、`billing/finalize`（本就只读 `wallets`）。**未新增** `reconcile_checkout_session` RPC：补单直接调现有 `grant_credits_for_purchase`。

---

## 二、Step 3 — 影子校验（双读比对，只报警不阻断）

**用途**：每天跑一次，找出 `users.credits != (wallets.permanent_credits + wallets.bonus_credits)` 的用户，记日志 / 进 Admin，**不自动修**。

### 2.1 校验 SQL（cron 或 Admin 触发）

```sql
-- 影子校验：legacy credits 与 wallet 不一致的用户（只查，不写）
SELECT
  u.id AS user_id,
  u.credits AS legacy_credits,
  COALESCE(w.permanent_credits, 0) AS perm,
  COALESCE(w.bonus_credits, 0) AS bonus,
  (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) AS wallet_credits
FROM users u
LEFT JOIN wallets w ON w.user_id = u.id
WHERE u.credits IS NOT NULL AND u.credits != 0
  AND (COALESCE(w.permanent_credits, 0) + COALESCE(w.bonus_credits, 0)) != u.credits;
```

**处理**：结果写入日志或 Admin 列表，提示 `Legacy credits mismatch: user_id=xxx`，由人工决定是否走 Step 4 迁移或单独处理。

---

## 三、Step 4 — 一次性迁移（users.credits → wallets）

**前提**：新支付已全走 `wallets`；`check-recharge` 已不写 `users.credits`；mismatch 数量可控。

### 3.1 迁移 SQL（只补空钱包，不覆盖已有）

见 `scripts/p2_legacy_credits_migrate.sql`：

1. **预览**：`SELECT count(*) AS will_migrate FROM users u JOIN wallets w ON w.user_id = u.id WHERE coalesce(u.credits,0) > 0 AND (coalesce(w.permanent_credits,0) + coalesce(w.bonus_credits,0)) = 0;`
2. **INSERT**：为「有 credits、无 wallets」的用户建钱包，`permanent_credits = u.credits`，`ON CONFLICT (user_id) DO NOTHING`。
3. **UPDATE**：对「已有钱包且余额为 0」的用户，`permanent_credits = coalesce(u.credits,0)`；不覆盖已有非零钱包。

### 3.2 回滚 SQL（保守：只回滚强条件用户）

见 `scripts/p2_legacy_credits_rollback.sql`。无法 100% 区分迁移写入与真实新购，故**只回滚**：`bonus_credits = 0` 且 `permanent_credits = users.credits` 且 `users.credits > 0`。

1. **预览**：`SELECT u.id, u.credits, w.permanent_credits, w.bonus_credits FROM users u JOIN wallets w ON w.user_id = u.id WHERE coalesce(w.bonus_credits,0) = 0 AND coalesce(w.permanent_credits,0) = coalesce(u.credits,0) AND coalesce(u.credits,0) > 0;`
2. **执行**：对上述用户 `UPDATE wallets SET permanent_credits = 0`。

**建议**：迁移前对 `wallets`、`users` 做快照或备份。

---

## 四、Admin 对账面板字段设计

在 Admin 增加「Credits 对账 / 影子校验」视图，用于 Step 3 结果展示与迁移前后核对。

### 4.1 接口：`GET /api/admin/reconcile/legacy-credits`

**实现**：`app/api/admin/reconcile/legacy-credits/route.ts`（需 Admin 登录，`validateAdminSession`）

**返回示例**：

```json
{
  "ok": true,
  "mismatch_count": 2,
  "rows": [
    {
      "user_id": "uuid",
      "email": "a@b.com",
      "legacy_credits": 1000,
      "wallet_permanent": 0,
      "wallet_bonus": 0,
      "wallet_total": 0,
      "diff": 1000
    }
  ]
}
```

**实现**：双查 `users`（id, credits, email）与 `wallets`，在内存中合并并过滤 `legacy != wallet_total`，计算 `diff`。等价的纯 SQL 见 `scripts/p2_shadow_check_legacy_credits.sql`。

### 4.2 表格字段（列表）

| 字段 | 说明 |
|------|------|
| `user_id` | 用户 ID |
| `email` | 邮箱（如有） |
| `legacy_credits` | `users.credits` |
| `wallet_permanent` | `wallets.permanent_credits` |
| `wallet_bonus` | `wallets.bonus_credits` |
| `wallet_total` | permanent + bonus |
| `diff` | legacy_credits - wallet_total，≠0 即需关注 |

### 4.3 状态与操作

- **仅展示 + 导出**：不提供「一键修」；修数据按 Step 4 或工单单独处理。
- **迁移前/后**：可选增加「上次迁移时间」「迁移批次」等，用于对照。

### 4.4 Admin 日级对账：`credit_reconciliation_daily`（可选建表，或 RPC/API 实时算）

一行 = 一天，便于 14 天监控与阈值判定。可先不建表，由 Admin 页面调 RPC/SQL 计算后渲染。

**字段建议**：

| 字段 | 说明 |
|------|------|
| `date` | YYYY-MM-DD |
| `total_users` | 总用户数 |
| `users_with_wallet` | 有钱包用户数 |
| `mismatch_users` | users.credits != wallet_total |
| `mismatch_gt_0_users` | mismatch 且 (legacy>0 或 wallet>0) |
| `mismatch_sample_user_ids` | 采样 10 个，便于排查 |
| `legacy_credits_write_events` | 过去 24h 写 `users.credits` 次数（理想=0） |
| `check_recharge_manual_reconciles` | 过去 24h check-recharge 补单次数 |
| `wallet_total_sum` | 钱包总积分 |
| `wallet_negative_users` | 钱包为负用户数（理想=0） |
| `ledger_events_24h` | 过去 24h ledger 事件数 |
| `status` | OK / WARN / STOP |
| `note` | 备注 |

**面板 UI 三块**：

- **A) 今日状态条**：`OK`=mismatch 接近 0 且 `legacy_write_events=0`；`WARN`=mismatch 存在但未扩大；`STOP`=`wallet_negative_users>0` 或 `legacy_write_events>0` 持续。
- **B) 三个 KPI 卡片**：Mismatch Users；Legacy Credits Write (24h)；Wallet Negative Users。
- **C) 排查表格（Top mismatches）**：user_id、legacy_credits、wallet_total、permanent、bonus、last_purchase_at、last_ledger_at。

---

## 五、最终收口（何时冻住 users.credits）

同时满足：

1. **连续 14 天**：无新增对 `users.credits` 的写入（充值 / 补单 / 对账均不经此处）。
2. **对账**：Admin 影子校验 `mismatch_count = 0`（或已全部人工确认/迁移）。
3. **迁移**：Step 4 已执行且无异常。

此后可：

- 用 **RLS 或 DB trigger** 禁止对 `users.credits` 的写；
- 在模型/文档中标注 `users.credits` 为 `deprecated`；
- `DROP COLUMN` 可延后，等彻底不再依赖时再做。

---

## 六、check-recharge 改造要点（已实现）

- **Stripe 已 paid、本地 pending**：  
  - 从 `metadata.plan_id` 或 `itemIdFromAmount(amount_total/amount)` 得到 `plan_id`，仅当 `plan_id in [starter,creator,studio,pro]` 时调用：
    - `grant_credits_for_purchase(..., p_stripe_event_id: 'manual_reconcile_${session.id}' 或 'manual_reconcile_pi_${pi.id}', ...)`
  - 不再写 `users.credits`；`recharge_records.status` 置为 `completed`。
- **无法识别 plan**：不调 `grant`，不写 `users.credits`；返回 `need_manual_review: true`，`recharge_status` 保持 `pending`。
- **所有 `user_credits`**：从 `wallets` 的 `permanent_credits + bonus_credits` 计算。

---

## 七、回滚与灰度

- **Step 1 / 2**：  
  - 回滚 = 把 `recharge-records`、`check-recharge`、`check-session` 的读/写路径改回 `users.credits`（用 Git 还原即可）。
- **Step 4 迁移**：  
  - 不删表、不 drop 列，只做 `UPDATE`；回滚以备份或事先记录的 `migration_batch` 为准做针对性修正，或从备份恢复。

---

## 八、执行顺序（推荐）

1. 改 `/api/payment/recharge-records`、`ProfileClient` 展示（只读，最安全）
2. 改 `/api/payment/check-recharge` + `stripe/webhook` 日志
3. 上线后观察 48h：`legacy_credits_write_events` 是否归零
4. 跑迁移 SQL（只补空钱包），先预览再执行
5. Admin 对账页 / 影子校验接口上线（只读）

---

## 九、相关文件

- `app/api/payment/recharge-records/route.ts`
- `app/profile/ProfileClient.tsx`
- `app/api/payment/check-recharge/route.ts`
- `app/api/stripe/webhook/route.ts`
- `app/api/payment/check-session/route.ts`
- `app/api/admin/reconcile/legacy-credits/route.ts`（影子校验 Admin 接口）
- `scripts/p2_shadow_check_legacy_credits.sql`（影子校验纯 SQL，cron 可用）
- `scripts/p2_legacy_credits_migrate.sql`（Step 4 迁移：预览 + INSERT + UPDATE）
- `scripts/p2_legacy_credits_rollback.sql`（保守回滚：预览 + 强条件 UPDATE）
- `docs/PAYMENT_API_AUDIT.md`（P2 完成后再更新一版）
