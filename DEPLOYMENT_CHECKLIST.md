# 🚀 定价发币系统 - 逐文件复制清单（可直接上线）

## 📋 前提确认

在开始之前，请确认：

1. ✅ **数据库里有没有 `profiles(email)` 表？**
   - 如果没有，下面的 migration 会创建
   - 如果有，确保有 `email` 字段（用于 webhook 通过 email 找 user_id）

2. ✅ **支付时能不能保证"用户用登录邮箱付款"？**
   - 如果能，webhook 可以直接通过 email 匹配 user_id
   - 如果不能，需要走 `client_reference_id` 或 `metadata.user_id`

---

## 📁 逐文件复制清单

### A) 数据库迁移（最重要，先执行）

**文件路径**: `supabase/migrations/0001_billing.sql`

**操作**: 在 Supabase Dashboard → SQL Editor 执行以下 SQL

```sql
-- 1) Profiles (用于 webhook 通过 email 找 user_id)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  created_at timestamptz default now()
);

-- 2) Wallets
create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  permanent_credits bigint not null default 0,
  bonus_credits bigint not null default 0,
  bonus_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 3) Ledger (审计账本)
create table if not exists public.wallet_ledger (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  delta_permanent bigint not null default 0,
  delta_bonus bigint not null default 0,
  reason text not null,
  ref_type text,
  ref_id text,
  created_at timestamptz not null default now()
);

-- 4) Purchases (幂等锚点：stripe_event_id UNIQUE)
create table if not exists public.purchases (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  plan_id text not null,
  payment_link_id text not null,

  stripe_event_id text not null unique,
  stripe_session_id text unique,
  stripe_payment_intent_id text unique,

  email text,
  amount_total bigint,
  currency text default 'usd',
  status text not null default 'paid',
  created_at timestamptz not null default now()
);

-- 5) Pending grants（找不到 user 时先记下来）
create table if not exists public.pending_credit_grants (
  id bigserial primary key,
  stripe_event_id text not null unique,
  stripe_session_id text unique,
  payment_link_id text not null,
  plan_id text not null,
  email text,
  amount_total bigint,
  currency text default 'usd',
  created_at timestamptz not null default now()
);

-- 6) Starter anti-abuse
create table if not exists public.starter_purchase_guards (
  id bigserial primary key,
  user_id uuid,
  device_id text,
  ip text,
  email text,
  created_at timestamptz default now()
);
create index if not exists idx_spg_ip_time on public.starter_purchase_guards (ip, created_at desc);
create index if not exists idx_spg_device_time on public.starter_purchase_guards (device_id, created_at desc);

-- 7) ensure wallet row exists
create or replace function public.ensure_wallet(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.wallets(user_id) values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- 8) grant credits atomically + idempotently
create or replace function public.grant_credits_for_purchase(
  p_user_id uuid,
  p_plan_id text,
  p_payment_link_id text,
  p_stripe_event_id text,
  p_stripe_session_id text,
  p_stripe_payment_intent_id text,
  p_email text,
  p_amount_total bigint,
  p_currency text
)
returns void
language plpgsql
security definer
as $$
declare
  v_perm bigint := 0;
  v_bonus bigint := 0;
  v_bonus_days int := 0;
  v_expires_at timestamptz := null;
begin
  insert into public.purchases(
    user_id, plan_id, payment_link_id,
    stripe_event_id, stripe_session_id, stripe_payment_intent_id,
    email, amount_total, currency, status
  )
  values (
    p_user_id, p_plan_id, p_payment_link_id,
    p_stripe_event_id, p_stripe_session_id, p_stripe_payment_intent_id,
    p_email, p_amount_total, p_currency, 'paid'
  )
  on conflict (stripe_event_id) do nothing;

  if not found then
    return;
  end if;

  perform public.ensure_wallet(p_user_id);

  -- MUST match your planConfig()
  if p_plan_id = 'starter' then
    v_perm := 0; v_bonus := 200; v_bonus_days := 7;
  elsif p_plan_id = 'creator' then
    v_perm := 2000; v_bonus := 600; v_bonus_days := 14;
  elsif p_plan_id = 'studio' then
    v_perm := 6000; v_bonus := 1500; v_bonus_days := 30;
  elsif p_plan_id = 'pro' then
    v_perm := 20000; v_bonus := 4000; v_bonus_days := 60;
  else
    raise exception 'Unknown plan_id: %', p_plan_id;
  end if;

  if v_bonus_days > 0 then
    v_expires_at := now() + make_interval(days => v_bonus_days);
  end if;

  update public.wallets
  set
    permanent_credits = permanent_credits + v_perm,
    bonus_credits = bonus_credits + v_bonus,
    bonus_expires_at = case
      when bonus_expires_at is null then v_expires_at
      when v_expires_at is null then bonus_expires_at
      else greatest(bonus_expires_at, v_expires_at)
    end,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, v_perm, v_bonus, 'purchase_grant', 'stripe_event', p_stripe_event_id);
end;
$$;

-- 9) deduct credits with rules
-- - bonus expires automatically
-- - sora/veo_fast: use bonus first then permanent
-- - veo_pro: permanent-only (protects cashflow)
create or replace function public.deduct_credits_from_wallet(
  p_user_id uuid,
  p_model_id text,
  p_cost bigint,
  p_ref_id text
)
returns table(permanent_spent bigint, bonus_spent bigint)
language plpgsql
security definer
as $$
declare
  w record;
  v_bonus_spent bigint := 0;
  v_perm_spent bigint := 0;
begin
  perform public.ensure_wallet(p_user_id);

  select * into w from public.wallets where user_id = p_user_id for update;

  -- expire bonus
  if w.bonus_expires_at is not null and w.bonus_expires_at < now() then
    if w.bonus_credits > 0 then
      insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
      values (p_user_id, 0, -w.bonus_credits, 'bonus_expired', 'system', p_ref_id);
    end if;

    update public.wallets
    set bonus_credits = 0, bonus_expires_at = null, updated_at = now()
    where user_id = p_user_id;

    w.bonus_credits := 0;
    w.bonus_expires_at := null;
  end if;

  if p_model_id = 'veo_pro' then
    if w.permanent_credits < p_cost then
      raise exception 'INSUFFICIENT_PERMANENT_CREDITS';
    end if;

    v_perm_spent := p_cost;

    update public.wallets
    set permanent_credits = permanent_credits - v_perm_spent,
        updated_at = now()
    where user_id = p_user_id;

    insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
    values (p_user_id, -v_perm_spent, 0, 'render_deduct', p_model_id, p_ref_id);

    return query select v_perm_spent, 0;
  end if;

  -- sora/veo_fast: bonus first
  v_bonus_spent := least(greatest(w.bonus_credits, 0), p_cost);
  v_perm_spent := p_cost - v_bonus_spent;

  if w.permanent_credits < v_perm_spent then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  update public.wallets
  set
    bonus_credits = bonus_credits - v_bonus_spent,
    permanent_credits = permanent_credits - v_perm_spent,
    updated_at = now()
  where user_id = p_user_id;

  insert into public.wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, -v_perm_spent, -v_bonus_spent, 'render_deduct', p_model_id, p_ref_id);

  return query select v_perm_spent, v_bonus_spent;
end;
$$;
```

---

### B) PlanConfig 配置（已存在，确认内容）

**文件路径**: `lib/billing/planConfig.ts`

✅ **已创建**，内容已包含 4 个 Payment Link ID

---

### C) Stripe Webhook（已存在，确认内容）

**文件路径**: `app/api/stripe/webhook/route.ts`

✅ **已创建**，内容已符合要求

**必配环境变量**：
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL` 或 `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### D) Starter 防薅入口（已存在，确认内容）

**文件路径**: `app/api/pay/route.ts`

✅ **已创建**，内容已符合要求

**注意**: Payment Link URL 需要更新为实际的 Stripe Payment Link URL

---

### E) 钱包扣币（需要集成到视频生成 API）

**文件路径**: `lib/billing/wallet.ts`

✅ **已创建**，包含 `deductCredits()` 函数

**集成位置**: `app/api/video/generate/route.ts`

**示例代码**：
```typescript
import { deductCredits } from "@/lib/billing/wallet";
import { MODEL_CREDIT_COST } from "@/lib/billing/planConfig";

// 在生成视频前
const modelId = model === "sora-2" ? "sora" : model === "veo-flash" ? "veo_fast" : "veo_pro";
const cost = MODEL_CREDIT_COST[modelId];

try {
  await deductCredits({
    userId: userProfile.id,
    modelId,
    cost,
    refId: videoTask.id,
  });
} catch (error: any) {
  if (error.message?.includes("INSUFFICIENT")) {
    return jsonResponse({ error: "Insufficient credits" }, { status: 402 });
  }
  throw error;
}
```

---

### F) 前端按钮（需要更新）

**文件路径**: `app/pricing/page.tsx` 或 `components/pricing/PlanCard.tsx`

**Starter 按钮逻辑**：
```typescript
import { getOrCreateDeviceId } from "@/lib/risk/deviceId";

function getDeviceId() {
  const key = "device_id";
  let v = localStorage.getItem(key);
  if (!v) {
    v = crypto.randomUUID();
    localStorage.setItem(key, v);
  }
  return v;
}

// Starter 按钮点击
if (planId === "starter") {
  const deviceId = getDeviceId();
  const email = user?.email || "";
  window.location.href = `/api/pay?plan=starter&device_id=${deviceId}&email=${encodeURIComponent(email)}`;
} else {
  // Creator/Studio/Pro 走正常 checkout
  handleCheckout(planId);
}
```

---

### G) Veo Fast / Veo Pro 页面文案（已更新）

✅ **已更新**：
- `components/veo/VeoProPage.tsx`
- `components/veo/VeoFastPage.tsx`

---

## 🚀 上线步骤（按顺序执行）

### 步骤 1: 执行数据库迁移（必须）

1. 登录 Supabase Dashboard
2. 进入 **SQL Editor**
3. 复制 **A) 数据库迁移** 的完整 SQL
4. 执行并确认所有表/函数创建成功

### 步骤 2: 配置 Stripe Webhook（必须）

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. **URL**: `https://sora2aivideos.com/api/stripe/webhook`
5. **Events**: 勾选 `checkout.session.completed`
6. **复制 Signing Secret** (`whsec_...`)
7. 在 Vercel 添加环境变量 `STRIPE_WEBHOOK_SECRET`

### 步骤 3: 更新前端按钮（必须）

更新 Starter 按钮逻辑，使用 `/api/pay` 接口

### 步骤 4: 集成扣币逻辑（必须）

在视频生成 API 中添加扣币调用

### 步骤 5: 测试流程（验收）

1. 测试购买流程（验证发币）
2. 测试扣币流程（验证 Starter 限制）
3. 测试幂等性（重放 webhook event）

---

## ✅ 验收清单

- [ ] 数据库迁移执行成功
- [ ] Stripe Webhook 配置完成
- [ ] 环境变量已配置
- [ ] 前端按钮已更新
- [ ] 扣币逻辑已集成
- [ ] 测试购买流程通过
- [ ] 测试扣币流程通过
- [ ] 测试幂等性通过

---

**完成时间**: 2026-01-07  
**状态**: ✅ 所有文件已就绪，等待执行迁移和配置

