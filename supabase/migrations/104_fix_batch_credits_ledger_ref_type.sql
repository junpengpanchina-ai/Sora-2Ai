-- Fix batch credits ledger ref_type to enable proper reconciliation
-- 迁移编号: 104
-- 依赖: 100_batch_jobs_worker_and_credits.sql, 048_add_credit_wallet_system.sql

-- 更新 freeze_credits_for_batch：直接操作 credit_wallet + credit_ledger，写入 ref_type='batch_upfront'
create or replace function public.freeze_credits_for_batch(
  p_batch_id uuid,
  p_user_id uuid,
  p_amount int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch record;
  v_wallet record;
  v_bonus_used int := 0;
  v_perm_used int := 0;
  v_remaining int;
  v_ledger_exists int;
begin
  if p_amount <= 0 then
    return jsonb_build_object('ok', true, 'skipped', true, 'reason', 'NON_POSITIVE_AMOUNT');
  end if;

  select *
  into v_batch
  from public.batch_jobs
  where id = p_batch_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'BATCH_NOT_FOUND');
  end if;

  -- 幂等：检查 credit_ledger 是否已有该 batch 的冻结记录
  select count(*) into v_ledger_exists
  from public.credit_ledger
  where user_id = p_user_id
    and ref_type = 'batch_upfront'
    and ref_id = p_batch_id::text;

  if v_ledger_exists > 0 or coalesce(v_batch.frozen_credits, 0) >= p_amount then
    return jsonb_build_object(
      'ok', true,
      'already', true,
      'frozen', v_batch.frozen_credits
    );
  end if;

  -- 锁钱包行
  select * into v_wallet
  from public.credit_wallet
  where user_id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'WALLET_NOT_FOUND');
  end if;

  v_remaining := p_amount;

  -- 优先使用 bonus（如果可用且未过期）
  if v_wallet.bonus_credits > 0
     and v_wallet.bonus_expires_at is not null
     and v_wallet.bonus_expires_at > now() then
    if v_wallet.bonus_credits >= v_remaining then
      v_bonus_used := v_remaining;
      v_remaining := 0;
    else
      v_bonus_used := v_wallet.bonus_credits;
      v_remaining := v_remaining - v_bonus_used;
    end if;
  end if;

  -- 使用永久积分
  if v_remaining > 0 then
    if v_wallet.permanent_credits >= v_remaining then
      v_perm_used := v_remaining;
      v_remaining := 0;
    else
      return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS');
    end if;
  end if;

  -- 更新钱包
  update public.credit_wallet
  set
    bonus_credits = bonus_credits - v_bonus_used,
    permanent_credits = permanent_credits - v_perm_used,
    updated_at = now()
  where user_id = p_user_id;

  -- 写入 credit_ledger（带 ref_type='batch_upfront', ref_id=batch_id）
  if v_bonus_used > 0 then
    insert into public.credit_ledger (user_id, type, model, credits_delta, ref_type, ref_id, meta)
    values (
      p_user_id,
      'spend',
      'sora-2',
      -v_bonus_used,
      'batch_upfront',
      p_batch_id::text,
      jsonb_build_object('batch_id', p_batch_id, 'use_bonus', true)
    );
  end if;

  if v_perm_used > 0 then
    insert into public.credit_ledger (user_id, type, model, credits_delta, ref_type, ref_id, meta)
    values (
      p_user_id,
      'spend',
      'sora-2',
      -v_perm_used,
      'batch_upfront',
      p_batch_id::text,
      jsonb_build_object('batch_id', p_batch_id, 'use_permanent', true)
    );
  end if;

  -- 更新 batch_jobs
  update public.batch_jobs
  set frozen_credits = p_amount,
      updated_at = now()
  where id = p_batch_id;

  return jsonb_build_object(
    'ok', true,
    'already', false,
    'frozen', p_amount,
    'bonus_used', v_bonus_used,
    'permanent_used', v_perm_used
  );
end;
$$;

-- 更新 finalize_batch_credits：直接操作 credit_wallet + credit_ledger，写入 ref_type='batch_refund'
create or replace function public.finalize_batch_credits(
  p_batch_id uuid,
  p_user_id uuid,
  p_spent int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch record;
  v_frozen int;
  v_refund int;
  v_ledger_exists int;
begin
  if p_spent < 0 then
    p_spent := 0;
  end if;

  select *
  into v_batch
  from public.batch_jobs
  where id = p_batch_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'BATCH_NOT_FOUND');
  end if;

  -- 幂等：检查 credit_ledger 是否已有该 batch 的退款记录
  select count(*) into v_ledger_exists
  from public.credit_ledger
  where user_id = p_user_id
    and ref_type = 'batch_refund'
    and ref_id = p_batch_id::text;

  if v_ledger_exists > 0 or v_batch.settlement_status in ('finalized', 'refunded') then
    return jsonb_build_object(
      'ok', true,
      'already', true,
      'frozen', v_batch.frozen_credits,
      'spent', v_batch.credits_spent
    );
  end if;

  v_frozen := coalesce(v_batch.frozen_credits, 0);
  v_refund := greatest(v_frozen - p_spent, 0);

  if v_refund > 0 then
    -- 直接更新 credit_wallet（退回永久积分）
    update public.credit_wallet
    set permanent_credits = permanent_credits + v_refund,
        updated_at = now()
    where user_id = p_user_id;

    -- 写入 credit_ledger（带 ref_type='batch_refund', ref_id=batch_id）
    insert into public.credit_ledger (user_id, type, model, credits_delta, ref_type, ref_id, meta)
    values (
      p_user_id,
      'refund',
      'sora-2',
      v_refund,
      'batch_refund',
      p_batch_id::text,
      jsonb_build_object('batch_id', p_batch_id, 'refund_to', 'permanent')
    );
  end if;

  -- 更新 batch_jobs
  update public.batch_jobs
  set
    credits_spent = p_spent,
    settlement_status = case
      when v_refund > 0 then 'refunded'
      else 'finalized'
    end,
    updated_at = now()
  where id = p_batch_id;

  return jsonb_build_object(
    'ok', true,
    'frozen', v_frozen,
    'spent', p_spent,
    'refund', v_refund
  );
end;
$$;
