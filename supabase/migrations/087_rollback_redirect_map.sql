-- 087_rollback_redirect_map.sql
-- A3. 回滚：删除本次从合并生成的 redirect_map（只删 reason 为 merge 相关的）
-- 若 080 未跑、表不存在，则本脚本静默跳过，不报错。
-- 执行前可预览：select * from public.redirect_map where reason in ('merge_direct','merged','merge','merge_soft');

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'redirect_map') then
    delete from public.redirect_map
    where reason in ('merge_direct', 'merged', 'merge', 'merge_soft');
  end if;
end $$;
