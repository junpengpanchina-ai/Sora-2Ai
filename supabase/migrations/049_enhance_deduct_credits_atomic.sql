-- Migration: 049_enhance_deduct_credits_atomic.sql
-- Description: 增强 deduct_credits_from_wallet 函数，添加原子化扣费和幂等性保证
-- 依赖: 048_add_credit_wallet_system.sql

-- 1) 增强 credit_ledger 表（添加 request_id 用于幂等性）
alter table credit_ledger
add column if not exists request_id text;

create index if not exists idx_credit_ledger_request_id on credit_ledger(user_id, request_id, type);

-- 2) 重新定义 deduct_credits_from_wallet 函数（原子化 + 幂等性）
create or replace function deduct_credits_from_wallet(
  p_user_id uuid,
  p_required_credits bigint,
  p_model text,
  p_request_id text default null -- 幂等键
) returns jsonb as $$
declare
  v_wallet credit_wallet%rowtype;
  v_bonus_used bigint := 0;
  v_permanent_used bigint := 0;
  v_available_bonus bigint := 0;
  v_available_permanent bigint := 0;
begin
  -- 1. 锁定钱包行（防止并发）
  select * into v_wallet
  from credit_wallet
  where user_id = p_user_id
  for update;
  
  if not found then
    return jsonb_build_object('success', false, 'error', 'Wallet not found');
  end if;
  
  -- 2. 检查幂等性（防止重复扣费）
  if p_request_id is not null then
    if exists (
      select 1 from credit_ledger
      where user_id = p_user_id
        and request_id = p_request_id
        and type = 'spend'
    ) then
      return jsonb_build_object('success', false, 'error', 'Duplicate request');
    end if;
  end if;
  
  -- 3. 计算可用积分（考虑 bonus 过期）
  v_available_bonus := case
    when v_wallet.bonus_expires_at is not null and v_wallet.bonus_expires_at > now() 
    then v_wallet.bonus_credits
    else 0
  end;
  v_available_permanent := v_wallet.permanent_credits;
  
  -- 4. 检查余额是否足够
  if (v_available_bonus + v_available_permanent) < p_required_credits then
    return jsonb_build_object('success', false, 'error', 'Insufficient credits');
  end if;
  
  -- 5. 优先扣 bonus，再扣 permanent
  if p_model != 'veo-pro' and v_available_bonus >= p_required_credits then
    v_bonus_used := p_required_credits;
  elsif p_model != 'veo-pro' and v_available_bonus > 0 then
    v_bonus_used := v_available_bonus;
    v_permanent_used := p_required_credits - v_bonus_used;
  else
    v_permanent_used := p_required_credits;
  end if;
  
  -- 6. 更新钱包（原子操作）
  update credit_wallet
  set
    bonus_credits = bonus_credits - v_bonus_used,
    permanent_credits = permanent_credits - v_permanent_used,
    updated_at = now()
  where user_id = p_user_id;
  
  -- 7. 写入 ledger（记录扣费）
  if v_bonus_used > 0 then
    insert into credit_ledger (
      user_id, type, model, credits_delta, ref_type, request_id
    ) values (
      p_user_id, 'spend', p_model, -v_bonus_used, 'bonus_credits', p_request_id
    );
  end if;
  
  if v_permanent_used > 0 then
    insert into credit_ledger (
      user_id, type, model, credits_delta, ref_type, request_id
    ) values (
      p_user_id, 'spend', p_model, -v_permanent_used, 'permanent_credits', p_request_id
    );
  end if;
  
  return jsonb_build_object(
    'success', true,
    'bonus_used', v_bonus_used,
    'permanent_used', v_permanent_used,
    'remaining_credits', v_available_bonus + v_available_permanent - p_required_credits
  );
end;
$$ language plpgsql;

-- 3) 注释
comment on column credit_ledger.request_id is '请求ID（用于防止重复扣费，幂等键）';
comment on function deduct_credits_from_wallet is '原子化扣除积分（优先 Bonus，再永久），支持幂等性保证';

