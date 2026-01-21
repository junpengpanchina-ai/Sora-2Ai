-- Batch jobs worker helpers: claim + freeze + finalize credits
-- 迁移编号: 100
-- 依赖:
--   - 048_add_credit_wallet_system.sql (credit_wallet / credit_ledger / deduct_credits_from_wallet / add_credits_to_wallet)
--   - 098_batch_jobs.sql

-- 1) batch_jobs 结算相关字段（向下兼容，IF NOT EXISTS）
alter table batch_jobs
  add column if not exists credits_spent int not null default 0,
  add column if not exists settlement_status text not null default 'pending'
    check (settlement_status in ('pending', 'finalized', 'refunded'));


-- 2) 领取批量任务：claim_batch_jobs
-- 并发安全：FOR UPDATE SKIP LOCKED
create or replace function public.claim_batch_jobs(p_limit int default 5)
returns setof public.batch_jobs
language sql
security definer
as $$
  with cte as (
    select id
    from public.batch_jobs
    where status = 'queued'
    order by created_at asc
    limit p_limit
    for update skip locked
  )
  update public.batch_jobs b
  set status = 'processing',
      updated_at = now()
  from cte
  where b.id = cte.id
  returning b.*;
$$;


-- 3) 冻结积分：freeze_credits_for_batch
-- 使用现有的 credit_wallet / credit_ledger 体系：
--   - 调用 deduct_credits_from_wallet(user_uuid, credits_needed, model_type)
--   - 成功后更新 batch_jobs.frozen_credits
-- 幂等：如果 frozen_credits 已经 >= p_amount，则直接返回 already=true
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
  v_result jsonb;
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

  if coalesce(v_batch.frozen_credits, 0) >= p_amount then
    return jsonb_build_object(
      'ok', true,
      'already', true,
      'frozen', v_batch.frozen_credits
    );
  end if;

  -- 使用现有钱包函数扣除积分（视为冻结）
  -- 模型类型这里使用 'sora-2' 作为默认值，不影响实际扣费逻辑
  select public.deduct_credits_from_wallet(p_user_id, p_amount, 'sora-2')
  into v_result;

  if coalesce(v_result->>'success', 'false') <> 'true' then
    return jsonb_build_object(
      'ok', false,
      'error', coalesce(v_result->>'error', 'DEDUCT_FAILED')
    );
  end if;

  update public.batch_jobs
  set frozen_credits = p_amount,
      updated_at = now()
  where id = p_batch_id;

  return jsonb_build_object(
    'ok', true,
    'already', false,
    'frozen', p_amount
  );
end;
$$;


-- 4) 结算积分：finalize_batch_credits
-- 语义：
--   - p_spent 为本次 batch 实际应扣总额
--   - 之前在 freeze_credits_for_batch 中已从 credit_wallet 扣除了 frozen_credits
--   - finalize 时只做「多退少不补」：如果 frozen_credits > p_spent，则退回差额
--   - 退回使用 add_credits_to_wallet，type=refund
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
  v_result jsonb;
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

  -- 幂等：如果已标记为 finalized/refunded，则直接返回
  if v_batch.settlement_status in ('finalized', 'refunded') then
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
    -- 使用现有 add_credits_to_wallet 退回积分
    select public.add_credits_to_wallet(
      p_user_id,
      v_refund,      -- permanent_amount
      0,             -- bonus_amount
      null,          -- bonus_expires_at
      false          -- is_starter
    )
    into v_result;
  end if;

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

