-- Event logs base table
create table if not exists public.event_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null references auth.users(id) on delete set null,
  event text not null,
  source text null,
  properties jsonb not null default '{}'::jsonb
);

create index if not exists idx_event_logs_created_at on public.event_logs (created_at desc);
create index if not exists idx_event_logs_event_created_at on public.event_logs (event, created_at desc);
create index if not exists idx_event_logs_user_id_created_at on public.event_logs (user_id, created_at desc);
create index if not exists idx_event_logs_source_created_at on public.event_logs (source, created_at desc);
create index if not exists idx_event_logs_properties_gin on public.event_logs using gin (properties);

alter table public.event_logs enable row level security;

drop policy if exists "event_logs_select_none" on public.event_logs;
create policy "event_logs_select_none"
on public.event_logs for select
to anon, authenticated
using (false);

drop policy if exists "event_logs_insert_any" on public.event_logs;
create policy "event_logs_insert_any"
on public.event_logs for insert
to anon, authenticated
with check (true);

drop policy if exists "event_logs_update_none" on public.event_logs;
create policy "event_logs_update_none"
on public.event_logs for update
to anon, authenticated
using (false);

drop policy if exists "event_logs_delete_none" on public.event_logs;
create policy "event_logs_delete_none"
on public.event_logs for delete
to anon, authenticated
using (false);

-- 7-day leaderboard
create or replace view public.v_example_clicks_7d as
select
  (properties->>'example_id')::text as example_id,
  max(properties->>'ratio') as ratio,
  max(source) as source,
  count(*)::bigint as clicks_7d,
  count(distinct coalesce(user_id::text, properties->>'anon_id'))::bigint as unique_actors_7d,
  max(created_at) as last_clicked_at
from public.event_logs
where event = 'example_click'
  and created_at >= now() - interval '7 days'
  and properties ? 'example_id'
group by (properties->>'example_id')::text
order by clicks_7d desc, last_clicked_at desc;

grant select on public.v_example_clicks_7d to anon, authenticated;

-- 24h leaderboard
create or replace view public.v_example_clicks_24h as
select
  (properties->>'example_id')::text as example_id,
  max(properties->>'ratio') as ratio,
  max(source) as source,
  count(*)::bigint as clicks_24h,
  count(distinct coalesce(user_id::text, properties->>'anon_id'))::bigint as unique_actors_24h,
  max(created_at) as last_clicked_at
from public.event_logs
where event = 'example_click'
  and created_at >= now() - interval '24 hours'
  and properties ? 'example_id'
group by (properties->>'example_id')::text
order by clicks_24h desc, last_clicked_at desc;

grant select on public.v_example_clicks_24h to anon, authenticated;

-- Today leaderboard (server timezone)
create or replace view public.v_example_clicks_today as
select
  (properties->>'example_id')::text as example_id,
  max(properties->>'ratio') as ratio,
  max(source) as source,
  count(*)::bigint as clicks_today,
  count(distinct coalesce(user_id::text, properties->>'anon_id'))::bigint as unique_actors_today,
  max(created_at) as last_clicked_at
from public.event_logs
where event = 'example_click'
  and created_at >= date_trunc('day', now())
  and properties ? 'example_id'
group by (properties->>'example_id')::text
order by clicks_today desc, last_clicked_at desc;

grant select on public.v_example_clicks_today to anon, authenticated;

-- All-time leaderboard
create or replace view public.v_example_clicks_alltime as
select
  (properties->>'example_id')::text as example_id,
  max(properties->>'ratio') as ratio,
  max(source) as source,
  count(*)::bigint as clicks_alltime,
  count(distinct coalesce(user_id::text, properties->>'anon_id'))::bigint as unique_actors_alltime,
  max(created_at) as last_clicked_at
from public.event_logs
where event = 'example_click'
  and properties ? 'example_id'
group by (properties->>'example_id')::text
order by clicks_alltime desc, last_clicked_at desc;

grant select on public.v_example_clicks_alltime to anon, authenticated;

