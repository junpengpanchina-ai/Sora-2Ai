-- database/migrations/deduct_credits_function.sql
create or replace function deduct_credits_from_wallet(
  p_user_id uuid,
  p_cost bigint,
  p_reason text,
  p_ref_type text,
  p_ref_id text
) returns void as $$
declare
  v_bonus bigint;
  v_perm bigint;
  v_use_bonus bigint;
  v_use_perm bigint;
begin
  perform ensure_wallet(p_user_id);

  select bonus_credits, permanent_credits into v_bonus, v_perm
  from wallets where user_id = p_user_id for update;

  if v_bonus is null then v_bonus := 0; end if;
  if v_perm is null then v_perm := 0; end if;

  -- 检查过期 bonus
  if (select bonus_expires_at from wallets where user_id = p_user_id) is not null
     and (select bonus_expires_at from wallets where user_id = p_user_id) <= now() then
    update wallets set bonus_credits = 0, bonus_expires_at = null where user_id = p_user_id;
    v_bonus := 0;
  end if;

  if (v_bonus + v_perm) < p_cost then
    raise exception 'insufficient_credits';
  end if;

  v_use_bonus := least(v_bonus, p_cost);
  v_use_perm := p_cost - v_use_bonus;

  update wallets
  set
    bonus_credits = bonus_credits - v_use_bonus,
    permanent_credits = permanent_credits - v_use_perm,
    updated_at = now()
  where user_id = p_user_id;

  insert into wallet_ledger(user_id, delta_permanent, delta_bonus, reason, ref_type, ref_id)
  values (p_user_id, -v_use_perm, -v_use_bonus, p_reason, p_ref_type, p_ref_id);
end;
$$ language plpgsql;

-- 原子累加 usage_daily（并发安全）
create or replace function increment_usage_daily(
  p_user_id uuid,
  p_day date,
  p_model text -- 'sora' | 'veo_fast' | 'veo_pro'
) returns void as $$
begin
  insert into usage_daily(user_id, day, sora_count, veo_fast_count, veo_pro_count)
  values (p_user_id, p_day, 0, 0, 0)
  on conflict (user_id, day) do nothing;

  if p_model = 'sora' then
    update usage_daily
    set sora_count = sora_count + 1, updated_at = now()
    where user_id = p_user_id and day = p_day;
  elsif p_model = 'veo_fast' then
    update usage_daily
    set veo_fast_count = veo_fast_count + 1, updated_at = now()
    where user_id = p_user_id and day = p_day;
  elsif p_model = 'veo_pro' then
    update usage_daily
    set veo_pro_count = veo_pro_count + 1, updated_at = now()
    where user_id = p_user_id and day = p_day;
  end if;
end;
$$ language plpgsql;

