-- 080_redirect_map.sql
-- 301/308 重定向映射表（可回滚、安全）
-- 用于：硬合并页 → 主 Scene 的 308/301 跳转（可选启用）

create table if not exists public.redirect_map (
  id         bigserial primary key,
  from_path  text not null unique,   -- 例如: /use-cases/old-slug
  to_path    text not null,          -- 例如: /use-cases/canonical-slug
  code       int  not null default 308,  -- 308 或 301
  reason     text not null default 'merge',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists redirect_map_to_path_idx on public.redirect_map(to_path);
create index if not exists redirect_map_from_path_idx on public.redirect_map(from_path);

create or replace function public.tg_redirect_map_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists redirect_map_set_updated_at on public.redirect_map;
create trigger redirect_map_set_updated_at
  before update on public.redirect_map
  for each row execute procedure public.tg_redirect_map_updated_at();

comment on table public.redirect_map is '301/308 重定向映射：from_path → to_path，reason 用于回滚筛选';
