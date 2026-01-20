# 支付端口审计报告

> 检查范围：`/api/pay`、`/api/checkout`、`/api/payment/*`、`/api/billing/*`、`/api/stripe/*`  
> 审计时间：基于当前代码库静态分析

---

## 〇、修复执行记录（P0 / P1 已完成）

| 项目 | 状态 | 说明 |
|------|------|------|
| Webhook 二选一 | ✅ 已修复 | `/api/payment/webhook` 已下线为 stub：验签后返回 200，**不处理、不发币**；请仅在 Stripe 配置 `/api/stripe/webhook` |
| `checkout/create` Starter 风控 | ✅ 已修复 | 用户已购 / 设备 / 同 IP 24h 限 3 次，通过后写 `starter_purchase_guards` |
| `create-plan-checkout` IP + Guard | ✅ 已修复 | IP 改为 raw IP 计数，通过后写入 `starter_purchase_guards` |
| `/api/pay` 与 planConfig 统一 | ✅ 已修复 | `planConfig` 新增 `paymentLinkUrl`，`/api/pay` 改为使用 `PLAN_CONFIGS[].paymentLinkUrl` |

**Webhook 迁移**：若 Stripe 曾配置 `/api/payment/webhook`，请移除该 endpoint，仅保留 `https://<your-domain>/api/stripe/webhook`，否则事件不会发币。

**P2 Credits 单一化（Step1+2 已做）**：展示与补单已统一到 `wallets`；`users.credits` 只读冻结、迁移与下线见 `docs/P2_CREDITS_WALLET_MIGRATION.md`。

---

## 一、支付相关 API 一览

| 路径 | 方法 | 用途 | 前端调用方 |
|------|------|------|------------|
| `/api/pay` | GET | Payment Link 重定向，Starter 防薅（device/IP）；URL 来自 `planConfig.paymentLinkUrl` | 非首页主流程 |
| `/api/checkout/create` | POST | 创建 Checkout Session（line_items + metadata.plan_id），**Starter 风控 + 写 guard** | **HomePageClient 主流程** |
| `/api/payment/create-checkout` | POST | 创建 Checkout（CNY、recharge_records、`/payment/success`） | 未发现 |
| `/api/payment/create-plan-checkout` | POST | 创建计划 Checkout（PRICING_CONFIG、Starter 风控 + 写 guard） | 未发现 |
| `/api/payment/webhook` | POST | **已下线**：验签后 200，不处理；请用 `/api/stripe/webhook` | Stripe 服务器（请迁移） |
| `/api/stripe/webhook` | POST | **唯一处理入口**：`checkout.session.completed` → `grant_credits_for_purchase` | Stripe 服务器 |
| `/api/payment/payment-link` | GET/POST | Payment Link 列表 / 登记 | 未发现 |
| `/api/payment/check-recharge` | GET | 查 recharge；pending 时 Stripe 已 paid → `grant_credits_for_purchase` → wallets；**不写 users.credits** | 可能来自 `/payment/success` |
| `/api/payment/verify-payment` | POST | 手动校验支付 | 管理/调试 |
| `/api/payment/recharge-records` | GET | 用户充值记录；**P2：只读 wallets**（user_credits / permanent_credits / bonus_credits） | HomePageClient |
| `/api/payment/sync-payments` | - | 同步支付 | - |
| `/api/billing/finalize` | POST | 只读：查 session 状态、`purchases`、`wallets` | `/billing/success` |
| `/api/payment-plans` | GET | 从 PRICING_CONFIG 生成计划列表 | HomePageClient |

---

## 二、已发现问题

### 1. 两个 Webhook 并存，需二选一 ✅ 已修复

- **`/api/payment/webhook`** 已改为**下线 stub**：验签后直接返回 200，**不处理、不发币**，避免与 `/api/stripe/webhook` 重复。
- **Stripe Dashboard**：请仅配置 `https://<your-domain>/api/stripe/webhook`；若曾配置 `/api/payment/webhook`，请**移除**，否则该路事件不会发币。详见 `⚠️_Webhook路径统一_必须确认.md`。

---

### 2. `/api/payment/webhook` 幂等检查使用可能不存在的字段 ✅ 已修复

```ts
// app/api/payment/webhook/route.ts 第 69–75 行
const { data: existingPurchase } = await supabase
  .from('purchases')
  .select('id')
  .eq('provider', 'stripe')
  .eq('provider_payment_id', session.id)
```

- 当前 `purchases`（`055_billing_complete.sql` / `0001_billing.sql`）字段为：  
  `stripe_event_id`, `stripe_session_id`, `stripe_payment_intent_id` 等，**没有 `provider`、`provider_payment_id`**。
- 若 DB 来自更早迁移（如 `049`）且仍保留这两列，查询可用；否则会报错或查不到，该幂等检查形同未生效。
- 发币的**真实幂等**在 RPC `grant_credits_for_purchase` 的 `ON CONFLICT (stripe_event_id) do nothing`，此处为**冗余**且与现有 schema 可能不一致。
- **已修复**：`/api/payment/webhook` 已下线为 stub，不再做 purchases 查询；`/api/stripe/webhook` 依赖 RPC `grant_credits_for_purchase` 的 `ON CONFLICT (stripe_event_id) do nothing` 做幂等。

---

### 3. `/api/checkout/create` 对 Starter 无任何防薅 ✅ 已修复

- **HomePageClient** 的买单入口是 `/api/checkout/create`，**不会**走 `/api/pay` 或 `/api/payment/create-plan-checkout`。
- `/api/checkout/create` 只做：校验 `planId`、JWT、创建 Stripe Checkout Session，**没有**：
  - 每设备一次（`starter_purchase_guards.device_id`）
  - 每 IP/24h 上限（`starter_purchase_guards.ip`）
  - 每用户一次 Starter（`purchases.plan_id='starter'`）
- 因此通过首页购买的 **Starter 可被同一设备多次购买**，防薅只对 `/api/pay` 和 `/api/payment/create-plan-checkout` 生效。
- **已修复**：当 `planId === 'starter'` 时，校验用户已购 / 设备 / 同 IP 24h 限 3 次，通过后写入 `starter_purchase_guards`，再创建 Session。

---

### 4. `create-plan-checkout` 中 Starter 的 IP 风控逻辑错误，且不写入 guard ✅ 已修复

- **IP 检查（约 124–131 行）**：  
  `starter_purchase_guards` 的 `ip` 存的是**原始 IP**（例如 `1.2.3.4`），而这里用：

  ```ts
  .eq("ip", ipPrefix)   // ipPrefix = "1.2.3.4.0/24"
  ```

  与库里 `ip = '1.2.3.4'` 永不相等，**IP 限 3 次/24h 实际上不会生效**。
- **Guard 写入**：  
  - `/api/pay` 会在通过风控后 `insert` 到 `starter_purchase_guards`；  
  - `create-plan-checkout` 只做 `select`，**从未 `insert`**。  
  若用户只走 `create-plan-checkout` 或 `checkout/create`，guard 表不会有记录，后续设备/IP 风控也无法依赖。
- **已修复**：IP 检查改为按 **raw IP** 计数（与 `starter_purchase_guards.ip` 一致），通过风控后**写入** `starter_purchase_guards`，与 `/api/pay`、`/api/checkout/create` 一致。

---

### 5. `/api/pay` 的 Payment Link URL 与 `planConfig` 不一致 ✅ 已修复

- **`/api/pay`** 使用硬编码：

  ```ts
  const PAYMENT_LINK_URLS = {
    starter: "https://buy.stripe.com/28EbJ14jUg2L6550Ug0kE05",
    creator: "https://buy.stripe.com/dRmcN55nY4k33WXfPa0kE03",
    // ...
  };
  ```

- **`planConfig.ts`** 的 `paymentLinkId` 为 `plink_xxx` 形式，例如：  
  `plink_1SjMNLDqGbi6No9vUku66neA`。
- Stripe 的 `session.payment_link` 在 webhook 中一般为 `plink_xxx`；`planFromPaymentLink()` 只认 `planConfig.paymentLinkId`。  
- `buy.stripe.com/28E...` 与 `plink_xxx` 的对应关系需在 Stripe 后台核实；若不一致，**webhook 无法通过 `payment_link` 正确识别 plan**，只会依赖 `metadata.plan_id`。而 `/api/pay` 是重定向到 Payment Link，**不会带 `metadata.plan_id`**，若 `payment_link` 也对不上，则存在**无法正确发币或误判 plan 的风险**。
- **已修复**：`planConfig` 新增 `paymentLinkUrl`（与 `paymentLinkId` 对应同一 Payment Link），`/api/pay` 改为使用 `PLAN_CONFIGS[planId].paymentLinkUrl`，与 `planConfig` 统一。

---

### 6. 积分双写：`users.credits` 与 `wallets`（P2 待办）

- **新流程**（Checkout Session + `grant_credits_for_purchase`）：只写 **`wallets`**（`permanent_credits`、`bonus_credits`）和 **`wallet_ledger`**。
- **旧流程**（`recharge_records`、`/api/payment/create-checkout`、`check-recharge` 等）：读写 **`users.credits`**。
- **`/api/payment/check-recharge`**：在「Stripe 已 paid、本地仍 pending」时，把积分加到 **`users.credits`**，并更新 `recharge_records`，**不会**写 `wallets`。
- **`/api/payment/recharge-records`**：返回的 `user_credits` 来自 **`users.credits`**；  
  **`/api/billing/finalize`**：来自 **`wallets`**。
- 若用户既有新支付（走 `wallets`）又有旧支付或 `check-recharge` 补写（走 `users.credits`），则：  
  - 积分分散在两套字段；  
  - 扣费若只认 `wallets`，`users.credits` 的存量可能被忽略。
- **建议**：  
  - 明确以 **`wallets`** 为唯一积分源，扣费、展示、`finalize`、`recharge-records` 均基于 `wallets`；  
  - 将 `check-recharge`、`recharge-records` 及其它仍写/读 `users.credits` 的路径，改为读写 `wallets`（或通过统一服务层），并规划 `users.credits` 的迁移与下线。

---

### 7. `/api/payment/create-checkout` 与主流程割裂

- 使用 **CNY**、**`recharge_records`**、**`/payment/success`**，且传 `metadata.recharge_id`，无 `plan_id`。
- 首页和 `payment-plans` 走的是 **USD、`/api/checkout/create`、`/billing/success`、`purchases`+`wallets`**。
- 当前代码中未发现对 `create-checkout` 的调用；若为历史或区域接口，易与主流程在币种、积分体系、成功页上产生分歧。
- **建议**：若已不再使用，可标记废弃或删除；若仍使用，需统一到 `wallets` 和同一套 `plan_id`/金额体系，并统一 success 回跳与 webhook 处理。

---

### 8. `create-plan-checkout` 与 `checkout/create` 的配置与风控不统一

- **`create-plan-checkout`**：  
  - 使用 **`PRICING_CONFIG`**（`lib/billing/config`），  
  - 有 Starter 的 device、IP、用户已购等风控（尽管 IP 逻辑有 bug、且不写 guard）。
- **`checkout/create`**：  
  - 使用 **`PLAN_CONFIGS`**（`lib/billing/planConfig`），  
  - 无 Starter 风控。  
- `PRICING_CONFIG` 的 `priceUsd` 等来自 `PLAN_CONFIGS`，故金额一致，但**风控和入口不统一**，增加维护成本和漏防薅的可能。
- **建议**：  
  - 以 **`/api/checkout/create`** 作为唯一创建 Session 的入口，在此统一 `PLAN_CONFIGS`/`PRICING_CONFIG` 的选用；  
  - 将 `create-plan-checkout` 的 Starter 风控（修正 IP、补全 guard 写入）迁入 `checkout/create`，再考虑废弃 `create-plan-checkout`。

---

## 三、其他注意事项

- **`billing/finalize`**：只读，不发币，依赖 `purchases.stripe_session_id` 和 `wallets`，与 `grant_credits_for_purchase` 分工清晰，无问题。
- **`STRIPE_WEBHOOK_SECRET`**：两个 webhook 都依赖；若未配置，会直接报错，需在部署清单中确认。
- **`recharge-records` 的 `Authorization: Bearer` 回退**：实现合理，能与 cookie 不可用时的 client 兼容。

---

## 四、建议优先修复顺序

| 优先级 | 项目 | 说明 |
|--------|------|------|
| P0 | Webhook 二选一 | ✅ 已修复：`/api/payment/webhook` 下线为 stub，仅 `/api/stripe/webhook` 处理 |
| P0 | `/api/checkout/create` 补全 Starter 风控 | ✅ 已修复：用户/设备/IP 校验 + 写 `starter_purchase_guards` |
| P1 | `create-plan-checkout` 的 IP 逻辑与 guard 写入 | ✅ 已修复：raw IP 计数 + 通过后写 guard |
| P1 | `/api/pay` 与 `planConfig` 的 Payment Link 统一 | ✅ 已修复：`planConfig.paymentLinkUrl`，`/api/pay` 统一引用 |
| P2 | 积分体系统一为 `wallets` | **Step1+2 已做**：`recharge-records`、`check-recharge`、`check-session` 只读/写 `wallets`；Step3 影子校验、Step4 迁移见 `docs/P2_CREDITS_WALLET_MIGRATION.md` |
| P2 | `create-checkout`、`create-plan-checkout` 的存废与合并 | 待办：以 `/api/checkout/create` 为主入口，逐步下线或合并 |

---

## 五、Webhook 迁移说明

1. 登录 **Stripe Dashboard** → **Developers** → **Webhooks**。
2. 若存在 endpoint `https://<your-domain>/api/payment/webhook`：  
   - **移除**该 endpoint（该路由已下线为 stub，收到事件不会发币）。  
3. 新增或确认 endpoint：  
   - URL：`https://<your-domain>/api/stripe/webhook`  
   - 事件：`checkout.session.completed`、`checkout.session.async_payment_succeeded`（可选）。  
4. 在 **Logs** 中发送测试 `checkout.session.completed`，确认返回 200，且 `purchases`、`wallets` 有预期变化。

---

## 六、监控与日志建议

- **支付流程**：对 `checkout/create`、`billing/finalize` 的 4xx/5xx 与延迟打点；对 `starter_*_limit` 等 403 做计数，便于发现薅羊毛或误拦。
- **Webhooks**：对 `/api/stripe/webhook` 的 4xx/5xx、`grant_credits_for_purchase` 报错做告警；将 Stripe Webhook Logs 的 Delivered / Failed 纳入监控或 Sentry。
- **积分系统**：对 `wallets`、`wallet_ledger` 的异常变更（如大额、负数）做告警；扣费失败（`INSUFFICIENT_CREDITS` 等）打点。
- **回归与告警**：发布后做支付、Webhook、风控的回归；将支付错误、Webhook 验签/处理失败、积分异常接入 Sentry 或现有监控，便于快速发现与修复。

---

## 七、相关文件索引

- 风控与 Webhook 统一：`⚠️_Webhook路径统一_必须确认.md`、`✅_3个关键收口修复完成.md`
- 支付与监控：`PAYMENT_MONITORING_GUIDE.md`、`PAYMENT_FLOW_EXPLANATION.md`
- 配置：`lib/billing/planConfig.ts`（`paymentLinkId`、`paymentLinkUrl`）、`lib/billing/config.ts`
- 主流程入口：`app/HomePageClient.tsx`（`startPaymentLinkCheckout` → `/api/checkout/create`）
- 本次修改：`app/api/payment/webhook/route.ts`（stub）、`app/api/checkout/create/route.ts`（Starter 风控）、`app/api/payment/create-plan-checkout/route.ts`（IP+guard）、`app/api/pay/route.ts`（`paymentLinkUrl`）、`lib/billing/planConfig.ts`（`paymentLinkUrl`）
