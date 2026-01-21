-- Enterprise API usage enhancements: IP / User-Agent logging
-- 迁移编号: 101
-- 依赖: 099_enterprise_api_keys.sql

alter table enterprise_api_usage
  add column if not exists ip text,
  add column if not exists user_agent text;

create index if not exists idx_enterprise_api_usage_key_created_ip
  on enterprise_api_usage(api_key_id, created_at desc);

