-- Migration: 051_add_usage_daily.sql
-- Description: 每日使用统计表（Starter防刷、限频控制）
-- 依赖: 048_add_credit_wallet_system.sql

-- 1) Usage Daily 表（每日使用统计）
create table if not exists usage_daily (
  user_id uuid not null references users(id) on delete cascade,
  day date not null,
  sora_count int not null default 0,
  veo_fast_count int not null default 0,
  veo_pro_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists idx_usage_daily_user_day on usage_daily(user_id, day);
create index if not exists idx_usage_daily_day on usage_daily(day);

-- 2) 自动更新 updated_at
create or replace function update_usage_daily_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trigger_usage_daily_updated_at
  before update on usage_daily
  for each row
  execute function update_usage_daily_updated_at();

-- 3) RPC: 增加每日使用计数（原子操作）
create or replace function increment_daily_usage(
  p_user_id uuid,
  p_model text -- 'sora' | 'veo_fast' | 'veo_pro'
) returns jsonb as $$
declare
  v_today date := current_date;
  v_count_column text;
  v_current_count int;
  v_new_count int;
begin
  -- 确定要更新的列
  case p_model
    when 'sora' then v_count_column := 'sora_count';
    when 'veo_fast' then v_count_column := 'veo_fast_count';
    when 'veo_pro' then v_count_column := 'veo_pro_count';
    else
      return jsonb_build_object('success', false, 'error', 'Invalid model');
  end case;
  
  -- 获取当前计数（如果不存在则创建）
  select into v_current_count
    case v_count_column
      when 'sora_count' then sora_count
      when 'veo_fast_count' then veo_fast_count
      when 'veo_pro_count' then veo_pro_count
    end
  from usage_daily
  where user_id = p_user_id
    and day = v_today;
  
  if v_current_count is null then
    -- 创建新记录
    insert into usage_daily (user_id, day, sora_count, veo_fast_count, veo_pro_count)
    values (
      p_user_id,
      v_today,
      case when p_model = 'sora' then 1 else 0 end,
      case when p_model = 'veo_fast' then 1 else 0 end,
      case when p_model = 'veo_pro' then 1 else 0 end
    );
    v_new_count := 1;
  else
    -- 更新现有记录
    v_new_count := v_current_count + 1;
    execute format('
      update usage_daily
      set %I = %I + 1, updated_at = now()
      where user_id = $1 and day = $2
    ', v_count_column, v_count_column)
    using p_user_id, v_today;
  end if;
  
  return jsonb_build_object(
    'success', true,
    'count', v_new_count,
    'day', v_today
  );
end;
$$ language plpgsql;

-- 4) RPC: 检查每日限制（Starter防刷）
create or replace function check_daily_limit(
  p_user_id uuid,
  p_model text, -- 'sora' | 'veo_fast' | 'veo_pro'
  p_plan_id text -- 'starter' | 'creator' | 'studio' | 'pro'
) returns jsonb as $$
declare
  v_today date := current_date;
  v_current_count int;
  v_limit int;
  v_allowed boolean;
begin
  -- 非 Starter 用户无限制
  if p_plan_id != 'starter' then
    return jsonb_build_object('allowed', true, 'reason', 'not_starter');
  end if;
  
  -- 获取当前计数
  select into v_current_count
    case p_model
      when 'sora' then sora_count
      when 'veo_fast' then veo_fast_count
      when 'veo_pro' then veo_pro_count
    end
  from usage_daily
  where user_id = p_user_id
    and day = v_today;
  
  v_current_count := coalesce(v_current_count, 0);
  
  -- 设置限制
  case p_model
    when 'sora' then v_limit := 6; -- Starter: Sora 6/day
    when 'veo_fast' then v_limit := 1; -- Starter: Veo Fast 1/day
    when 'veo_pro' then
      -- Starter 不允许 Veo Pro
      return jsonb_build_object(
        'allowed', false,
        'reason', 'veo_pro_not_available',
        'message', 'Veo Pro is not available on Starter Access'
      );
    else
      return jsonb_build_object('allowed', false, 'reason', 'invalid_model');
  end case;
  
  v_allowed := v_current_count < v_limit;
  
  return jsonb_build_object(
    'allowed', v_allowed,
    'current_count', v_current_count,
    'limit', v_limit,
    'remaining', greatest(0, v_limit - v_current_count)
  );
end;
$$ language plpgsql;

-- 5) Starter Grants 表（7天 bonus credits）
create table if not exists starter_grants (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  bonus_credits bigint not null,
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  source text not null default 'starter_purchase',
  metadata jsonb
);

create index if not exists idx_starter_grants_user on starter_grants(user_id);
create index if not exists idx_starter_grants_expires on starter_grants(expires_at);

-- 6) RPC: 检查是否可以购买 Starter（防重复购买）
create or replace function can_purchase_starter(
  p_user_id uuid,
  p_payment_method_hash text default null -- 支付方式哈希（可选）
) returns jsonb as $$
declare
  v_recent_purchase_count int;
  v_starter_grant_count int;
begin
  -- 检查最近14天内是否已购买过 Starter
  select count(*) into v_recent_purchase_count
  from orders
  where user_id = p_user_id
    and plan_id = 'starter'
    and status = 'completed'
    and created_at > now() - interval '14 days';
  
  if v_recent_purchase_count > 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'recent_purchase',
      'message', 'Starter Access can only be purchased once per 14 days'
    );
  end if;
  
  -- 检查是否有未过期的 Starter grant
  select count(*) into v_starter_grant_count
  from starter_grants
  where user_id = p_user_id
    and expires_at > now();
  
  if v_starter_grant_count > 0 then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'active_grant',
      'message', 'You already have an active Starter Access grant'
    );
  end if;
  
  return jsonb_build_object('allowed', true);
end;
$$ language plpgsql;

-- 7) 注释
comment on table usage_daily is '每日使用统计表，用于 Starter 防刷和限频控制';
comment on table starter_grants is 'Starter Access 赠送记录表（7天 bonus credits）';
comment on function check_daily_limit is '检查每日限制（Starter用户专用）';
comment on function increment_daily_usage is '原子化增加每日使用计数';

