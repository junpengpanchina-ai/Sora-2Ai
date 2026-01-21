-- Enterprise API usage idempotency & rate limit helpers
-- 迁移编号: 102
-- 依赖: 099_enterprise_api_keys.sql, 101_enterprise_api_usage_enhancements.sql

-- 1) 请求幂等与分钟粒度统计字段
alter table enterprise_api_usage
  add column if not exists request_id text,
  add column if not exists minute_bucket timestamptz,
  add column if not exists batch_job_id uuid;

-- 2) 同一 api_key + request_id 只能出现一次（用于幂等）
create unique index if not exists enterprise_usage_api_key_request_id_uniq
  on enterprise_api_usage(api_key_id, request_id)
  where request_id is not null;

-- 3) 按分钟统计用量
create index if not exists enterprise_usage_api_key_minute_idx
  on enterprise_api_usage(api_key_id, minute_bucket desc);

