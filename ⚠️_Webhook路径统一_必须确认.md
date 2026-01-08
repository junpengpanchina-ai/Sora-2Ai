# ⚠️ Webhook 路径统一 - 必须确认

## 🚨 关键问题

**当前有两个 webhook 文件，必须只保留一个！**

1. `app/api/stripe/webhook/route.ts` ✅ **推荐**
   - 使用正确的 RPC：`grant_credits_for_purchase`
   - 简洁清晰的逻辑
   - 支持 pending_credit_grants（用户未找到时暂存）

2. `app/api/payment/webhook/route.ts` ⚠️ **需要确认**
   - 使用正确的 RPC：`grant_credits_for_purchase`（已修复）
   - 有旧逻辑的回退（Payment Link 方式）
   - 更复杂

## ✅ 必须做的动作

### Step 1: 确认 Stripe Dashboard 配置

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 查看你的 endpoint URL：
   - 如果是 `.../api/payment/webhook` → 保留 `app/api/payment/webhook/route.ts`
   - 如果是 `.../api/stripe/webhook` → 保留 `app/api/stripe/webhook/route.ts`
   - 如果还没有配置 → 推荐使用 `/api/stripe/webhook`

### Step 2: 统一使用一个

**如果使用 `/api/stripe/webhook`（推荐）**：
- ✅ 保留 `app/api/stripe/webhook/route.ts`
- ❌ 删除或重命名 `app/api/payment/webhook/route.ts`（避免混淆）

**如果使用 `/api/payment/webhook`**：
- ✅ 保留 `app/api/payment/webhook/route.ts`
- ❌ 删除或重命名 `app/api/stripe/webhook/route.ts`（避免混淆）

### Step 3: 验证

在 Stripe Dashboard → Webhooks → Logs：
- 发送测试事件 `checkout.session.completed`
- 确认返回 200
- 确认 `purchases` 表有新记录
- 确认 `wallets` 积分增加

---

## 📝 当前状态

- ✅ `app/api/stripe/webhook/route.ts` - 使用 `grant_credits_for_purchase`，逻辑正确
- ✅ `app/api/payment/webhook/route.ts` - 已修复为使用 `grant_credits_for_purchase`，逻辑正确

**两个文件都能正常工作，但必须只保留一个！**

---

## 🎯 推荐方案

**使用 `/api/stripe/webhook`**（更简洁，推荐）

理由：
1. 代码更简洁清晰
2. 逻辑更直接
3. 支持 pending_credit_grants
4. 使用正确的 RPC 函数

**动作**：
1. 在 Stripe Dashboard 配置 endpoint 为 `/api/stripe/webhook`
2. 删除或注释掉 `app/api/payment/webhook/route.ts`

