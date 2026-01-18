-- 077_keyword_classification_fields.sql
-- 添加关键词分类状态字段（KEEP/MERGE/STOP）

alter table public.use_cases
add column if not exists keyword_status text check (keyword_status in ('KEEP','MERGE','STOP')),
add column if not exists merge_into_scene_id uuid;

create index if not exists idx_use_cases_keyword_status on public.use_cases(keyword_status);
