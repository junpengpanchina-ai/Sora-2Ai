-- database/migrations/grant_credits_functions.sql

-- 确保钱包存在
create or replace function ensure_wallet(p_user_id uuid)
returns void as $$
begin
  insert into wallets(user_id) values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$ language plpgsql;

-- 发放 credits（永久 + bonus），并写账本
create or replace function grant_credits(
  p_user_id uuid,
  p_permanent bigint,
  p_bonus bigint,
  p_bonus_days int,
  p_reason text,
  p_ref_type text,
  p_ref_id text
) returns void as $$
declare
  v_new_bonus_expires timestamptz;
begin
  perform ensure_wallet(p_user_id);

  if p_bonus > 0 then
    v_new_bonus_expires := now() + make_interval(days => p_bonus_days);
  end if;

  update wallets
  set
    permanent_credits = permanent_credits + p_permanent,
    bonus_credits = bonus_credits + p_bonus,
    bonus_expires_at = case
      when p_bonus > 0 and bonus_expires_at is null then v_new_bonus_expires
      when p_bonus > 0 and bonus_expires_at < v_new_bonus_expires then v_new_bonus_expires
      else bonus_expires_at
    end,
    updated_at = now()
  where user_id = p_user_id;

  insert into wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, p_permanent, p_bonus, p_reason, p_ref_type, p_ref_id);
end;
$$ language plpgsql;

-- 过期清理：把过期bonus置 0（建议每天跑一次 cron）
create or replace function expire_bonus_credits()
returns int as $$
declare
  v_count int;
begin
  update wallets
  set bonus_credits = 0, updated_at = now()
  where bonus_credits > 0 and bonus_expires_at is not null and bonus_expires_at <= now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql;

