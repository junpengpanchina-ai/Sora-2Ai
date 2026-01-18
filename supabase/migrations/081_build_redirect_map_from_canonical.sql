-- 081_build_redirect_map_from_canonical.sql
-- 从 use_cases.canonical_url 生成 redirect_map（只给「硬合并」：noindex + canonical 且 index_health_status='merge_direct'）
-- 先执行 084 合并后，再跑本脚本；middleware 只对 redirect_map 中的 from_path 做 308
-- 若希望软合并(merge_soft)也做 308，可删掉下面对 index_health_status 的过滤。

insert into public.redirect_map (from_path, to_path, code, reason)
select
  '/use-cases/' || uc.slug as from_path,
  uc.canonical_url         as to_path,
  308                      as code,
  coalesce(uc.index_health_status, 'merge_direct')::text as reason
from public.use_cases uc
where uc.noindex = true
  and uc.canonical_url is not null
  and uc.canonical_url like '/use-cases/%'
  and coalesce(uc.index_health_status, '') = 'merge_direct'
on conflict (from_path) do update
set to_path = excluded.to_path,
    code    = excluded.code,
    reason  = excluded.reason,
    updated_at = now();

-- 回滚：见 087_rollback_redirect_map.sql 或
-- delete from public.redirect_map where reason in ('merge_direct','merged','merge','merge_soft');
