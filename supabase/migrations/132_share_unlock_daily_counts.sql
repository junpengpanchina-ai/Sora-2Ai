-- Daily rate limit for share-unlock (style aligned with bad_url_daily_counts)
create table if not exists public.share_unlock_daily_counts (
  day date not null,
  user_id uuid not null,
  hits int not null default 0,
  last_task_id uuid null,
  last_platform text null,
  updated_at timestamptz not null default now(),
  primary key (day, user_id)
);

create index if not exists share_unlock_daily_counts_day_idx
  on public.share_unlock_daily_counts(day);

create index if not exists share_unlock_daily_counts_user_idx
  on public.share_unlock_daily_counts(user_id);

alter table public.share_unlock_daily_counts disable row level security;

-- Atomic limiter: increment only if below limit (returns allowed, hits)
create or replace function public.rpc_share_unlock_allow(
  p_user_id uuid,
  p_day date,
  p_limit int,
  p_task_id uuid default null,
  p_platform text default null
) returns table(allowed boolean, hits int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits int;
begin
  select s.hits into v_hits
  from public.share_unlock_daily_counts s
  where s.day = p_day and s.user_id = p_user_id
  for update;

  if v_hits is null then
    insert into public.share_unlock_daily_counts(day, user_id, hits, last_task_id, last_platform, updated_at)
    values (p_day, p_user_id, 1, p_task_id, p_platform, now());
    allowed := true;
    hits := 1;
    return next;
    return;
  end if;

  if v_hits >= p_limit then
    allowed := false;
    hits := v_hits;
    return next;
    return;
  end if;

  update public.share_unlock_daily_counts
  set hits = hits + 1,
      last_task_id = coalesce(p_task_id, last_task_id),
      last_platform = coalesce(p_platform, last_platform),
      updated_at = now()
  where day = p_day and user_id = p_user_id
  returning public.share_unlock_daily_counts.hits into v_hits;

  allowed := true;
  hits := v_hits;
  return next;
end;
$$;

grant execute on function public.rpc_share_unlock_allow(uuid, date, int, uuid, text) to authenticated;
grant execute on function public.rpc_share_unlock_allow(uuid, date, int, uuid, text) to service_role;
