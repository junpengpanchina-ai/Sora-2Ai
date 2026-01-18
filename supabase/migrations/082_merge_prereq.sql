-- 082_merge_prereq.sql
-- pg_trgm 扩展 + GIN 索引，提升 similarity 查询性能
-- 大表 GIN 建索引较慢，适当提高超时；若仍超时，可拆开在 SQL Editor 里先跑扩展、再分别跑两个 create index。

set local statement_timeout = '900s';

create extension if not exists pg_trgm;

create index if not exists use_cases_title_trgm_idx
  on public.use_cases using gin (title gin_trgm_ops);

create index if not exists use_cases_description_trgm_idx
  on public.use_cases using gin (description gin_trgm_ops);
