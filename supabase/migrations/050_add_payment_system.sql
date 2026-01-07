-- Migration: 050_add_payment_system.sql
-- Description: 支付系统表结构（订单、幂等性保证）
-- 依赖: 048_add_credit_wallet_system.sql, 049_enhance_deduct_credits_atomic.sql

-- 1) Orders 表（支付订单）
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paddle', 'lemonsqueezy')),
  provider_order_id text not null,
  provider_event_id text, -- webhook event ID（幂等键）
  plan_id text not null check (plan_id in ('starter', 'creator', 'studio', 'pro')),
  amount_usd numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  credits_permanent bigint not null default 0,
  credits_bonus bigint not null default 0,
  bonus_expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 幂等性保证：同一 provider + provider_order_id 只能有一条记录
  unique(provider, provider_order_id),
  -- 幂等性保证：同一 provider + provider_event_id 只能有一条记录
  unique(provider, provider_event_id)
);

create index if not exists idx_orders_user_id on orders(user_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);

-- 2) 自动更新 updated_at
create or replace function update_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_orders_updated_at
  before update on orders
  for each row
  execute function update_orders_updated_at();

-- 3) RPC: 创建订单（幂等性检查）
create or replace function create_order(
  p_user_id uuid,
  p_provider text,
  p_provider_order_id text,
  p_provider_event_id text,
  p_plan_id text,
  p_amount_usd numeric,
  p_credits_permanent bigint,
  p_credits_bonus bigint,
  p_bonus_expires_at timestamptz,
  p_metadata jsonb default null
) returns uuid as $$
declare
  v_order_id uuid;
begin
  -- 幂等性检查：如果订单已存在，返回现有订单ID
  select id into v_order_id
  from orders
  where provider = p_provider
    and provider_order_id = p_provider_order_id;
  
  if v_order_id is not null then
    return v_order_id;
  end if;
  
  -- 幂等性检查：如果 webhook event 已处理，返回关联的订单ID
  if p_provider_event_id is not null then
    select id into v_order_id
    from orders
    where provider = p_provider
      and provider_event_id = p_provider_event_id;
    
    if v_order_id is not null then
      return v_order_id;
    end if;
  end if;
  
  -- 创建新订单
  insert into orders (
    user_id,
    provider,
    provider_order_id,
    provider_event_id,
    plan_id,
    amount_usd,
    credits_permanent,
    credits_bonus,
    bonus_expires_at,
    metadata,
    status
  ) values (
    p_user_id,
    p_provider,
    p_provider_order_id,
    p_provider_event_id,
    p_plan_id,
    p_amount_usd,
    p_credits_permanent,
    p_credits_bonus,
    p_bonus_expires_at,
    p_metadata,
    'pending'
  ) returning id into v_order_id;
  
  return v_order_id;
end;
$$ language plpgsql;

-- 4) RPC: 更新订单状态（幂等性检查）
create or replace function update_order_status(
  p_order_id uuid,
  p_status text,
  p_provider_event_id text default null
) returns boolean as $$
declare
  v_current_status text;
begin
  -- 获取当前状态
  select status into v_current_status
  from orders
  where id = p_order_id;
  
  if v_current_status is null then
    return false;
  end if;
  
  -- 如果已经是完成状态，不允许回退
  if v_current_status = 'completed' and p_status != 'completed' then
    return false;
  end if;
  
  -- 更新状态
  update orders
  set
    status = p_status,
    provider_event_id = coalesce(p_provider_event_id, provider_event_id),
    updated_at = now()
  where id = p_order_id;
  
  return true;
end;
$$ language plpgsql;

-- 5) 注释
comment on table orders is '支付订单表，支持 Stripe/Paddle/LemonSqueezy，包含幂等性保证';
comment on column orders.provider_order_id is '支付提供商的订单ID（幂等键）';
comment on column orders.provider_event_id is '支付提供商的 webhook event ID（幂等键）';
comment on column orders.credits_permanent is '永久积分数量';
comment on column orders.credits_bonus is 'Bonus积分数量（带过期时间）';

