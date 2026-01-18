-- 074_ai_citation_score_refresh.sql
-- 创建批量刷新 AI 引用分数的函数（分批跑，避免超时）

create or replace function public.refresh_ai_citation_scores(p_limit int default 50000, p_offset int default 0)
returns int
language plpgsql
as $$
declare
  v_updated int := 0;
begin
  with target as (
    select id
    from public.use_cases
    order by id
    limit p_limit offset p_offset
  )
  update public.use_cases u
  set ai_citation_score = public.compute_ai_citation_score(u.id)
  from target t
  where u.id = t.id;

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- 用法（分批跑，避免超时）：
-- select public.refresh_ai_citation_scores(50000, 0);
-- select public.refresh_ai_citation_scores(50000, 50000);
-- select public.refresh_ai_citation_scores(50000, 100000);
-- select public.refresh_ai_citation_scores(50000, 150000);
-- select public.refresh_ai_citation_scores(50000, 200000);
