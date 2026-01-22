-- RPC: Get enterprise webhook config for batch
-- Migration: 106
-- Dependencies: 098_batch_jobs.sql, 099_enterprise_api_keys.sql, 103_batch_jobs_webhook_and_task_retry.sql

-- 获取 batch 对应的 enterprise webhook 配置
-- 从 batch_jobs.webhook_url 读取（如果创建 batch 时传了 webhook_url）
-- 注意：webhook_secret 目前从环境变量 ENTERPRISE_WEBHOOK_SECRET 读取（不在数据库）
create or replace function get_enterprise_webhook_for_batch(p_batch_id uuid)
returns table (
  url text,
  secret text
)
language plpgsql
security definer
as $$
declare
  v_webhook_url text;
begin
  -- 从 batch_jobs 读取 webhook_url
  select bj.webhook_url
  into v_webhook_url
  from batch_jobs bj
  where bj.id = p_batch_id;

  -- 返回结果（secret 由应用层从环境变量读取）
  if v_webhook_url is not null then
    return query select v_webhook_url, null::text;  -- secret 由应用层处理
  else
    return query select null::text, null::text;
  end if;
end;
$$;
