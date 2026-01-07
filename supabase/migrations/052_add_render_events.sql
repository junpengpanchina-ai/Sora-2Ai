-- Migration: 052_add_render_events.sql
-- Description: 渲染事件日志表（用于风控、成本核算、反作弊）
-- 依赖: 048_add_credit_wallet_system.sql

-- 1) Render Events 表（渲染日志）
create table if not exists render_events (
  id bigserial primary key,
  user_id uuid references users(id) on delete set null,
  model_id text not null check (model_id in ('sora', 'veo_fast', 'veo_pro')),
  credits_charged int not null,
  status text not null check (status in ('start', 'success', 'failed')),
  video_task_id uuid,
  prompt_hash text, -- prompt 的哈希值（用于检测重复）
  ip_hash text, -- IP 地址的哈希值（用于风控）
  device_hash text, -- 设备指纹的哈希值（用于风控）
  user_agent_hash text, -- User-Agent 的哈希值（用于风控）
  country text, -- 国家代码（从 IP 解析）
  asn text, -- ASN（从 IP 解析）
  supplier_cost_rmb numeric(12,6) default 0, -- 供应商成本（人民币）
  duration_ms int, -- 生成耗时（毫秒）
  error_message text, -- 错误信息（如果失败）
  metadata jsonb, -- 其他元数据
  created_at timestamptz not null default now()
);

create index if not exists idx_render_events_user_id on render_events(user_id);
create index if not exists idx_render_events_model on render_events(model_id);
create index if not exists idx_render_events_status on render_events(status);
create index if not exists idx_render_events_created_at on render_events(created_at);
create index if not exists idx_render_events_ip_hash on render_events(ip_hash);
create index if not exists idx_render_events_device_hash on render_events(device_hash);
create index if not exists idx_render_events_prompt_hash on render_events(prompt_hash);

-- 2) RPC: 记录渲染开始事件
create or replace function log_render_start(
  p_user_id uuid,
  p_model_id text,
  p_credits_charged int,
  p_video_task_id uuid default null,
  p_prompt_hash text default null,
  p_ip_hash text default null,
  p_device_hash text default null,
  p_user_agent_hash text default null,
  p_country text default null,
  p_asn text default null,
  p_metadata jsonb default null
) returns bigint as $$
declare
  v_event_id bigint;
begin
  insert into render_events (
    user_id,
    model_id,
    credits_charged,
    status,
    video_task_id,
    prompt_hash,
    ip_hash,
    device_hash,
    user_agent_hash,
    country,
    asn,
    metadata
  ) values (
    p_user_id,
    p_model_id,
    p_credits_charged,
    'start',
    p_video_task_id,
    p_prompt_hash,
    p_ip_hash,
    p_device_hash,
    p_user_agent_hash,
    p_country,
    p_asn,
    p_metadata
  ) returning id into v_event_id;
  
  return v_event_id;
end;
$$ language plpgsql;

-- 3) RPC: 更新渲染事件状态（成功/失败）
create or replace function update_render_event(
  p_event_id bigint,
  p_status text, -- 'success' | 'failed'
  p_supplier_cost_rmb numeric default null,
  p_duration_ms int default null,
  p_error_message text default null
) returns boolean as $$
begin
  update render_events
  set
    status = p_status,
    supplier_cost_rmb = coalesce(p_supplier_cost_rmb, supplier_cost_rmb),
    duration_ms = coalesce(p_duration_ms, duration_ms),
    error_message = coalesce(p_error_message, error_message)
  where id = p_event_id;
  
  return found;
end;
$$ language plpgsql;

-- 4) RPC: 检测异常行为（用于风控）
create or replace function detect_abnormal_usage(
  p_user_id uuid default null,
  p_ip_hash text default null,
  p_device_hash text default null,
  p_time_window_minutes int default 60
) returns jsonb as $$
declare
  v_render_count_24h int;
  v_same_prompt_count_24h int;
  v_unique_devices_24h int;
  v_unique_ips_24h int;
  v_risk_score int := 0;
  v_reasons text[] := '{}';
begin
  -- 统计24小时内的渲染次数
  select count(*) into v_render_count_24h
  from render_events
  where (
    (p_user_id is not null and user_id = p_user_id)
    or (p_ip_hash is not null and ip_hash = p_ip_hash)
    or (p_device_hash is not null and device_hash = p_device_hash)
  )
    and created_at > now() - interval '24 hours';
  
  -- 统计24小时内相同 prompt 的渲染次数
  select count(*) into v_same_prompt_count_24h
  from render_events
  where (
    (p_user_id is not null and user_id = p_user_id)
    or (p_ip_hash is not null and ip_hash = p_ip_hash)
  )
    and prompt_hash is not null
    and created_at > now() - interval '24 hours'
  group by prompt_hash
  having count(*) >= 3
  order by count(*) desc
  limit 1;
  
  v_same_prompt_count_24h := coalesce(v_same_prompt_count_24h, 0);
  
  -- 统计24小时内的唯一设备数
  if p_ip_hash is not null then
    select count(distinct device_hash) into v_unique_devices_24h
    from render_events
    where ip_hash = p_ip_hash
      and created_at > now() - interval '24 hours';
  end if;
  
  -- 统计24小时内的唯一IP数
  if p_device_hash is not null then
    select count(distinct ip_hash) into v_unique_ips_24h
    from render_events
    where device_hash = p_device_hash
      and created_at > now() - interval '24 hours';
  end if;
  
  -- 计算风险分数
  if v_render_count_24h > 50 then
    v_risk_score := v_risk_score + 3;
    v_reasons := array_append(v_reasons, 'high_frequency');
  end if;
  
  if v_same_prompt_count_24h >= 10 then
    v_risk_score := v_risk_score + 2;
    v_reasons := array_append(v_reasons, 'repetitive_prompts');
  end if;
  
  if v_unique_devices_24h > 3 then
    v_risk_score := v_risk_score + 2;
    v_reasons := array_append(v_reasons, 'multiple_devices');
  end if;
  
  if v_unique_ips_24h > 3 then
    v_risk_score := v_risk_score + 2;
    v_reasons := array_append(v_reasons, 'multiple_ips');
  end if;
  
  return jsonb_build_object(
    'risk_score', v_risk_score,
    'reasons', v_reasons,
    'render_count_24h', v_render_count_24h,
    'same_prompt_count_24h', v_same_prompt_count_24h,
    'unique_devices_24h', coalesce(v_unique_devices_24h, 0),
    'unique_ips_24h', coalesce(v_unique_ips_24h, 0),
    'is_abnormal', v_risk_score >= 5
  );
end;
$$ language plpgsql;

-- 5) 注释
comment on table render_events is '渲染事件日志表，用于风控、成本核算、反作弊';
comment on column render_events.prompt_hash is 'Prompt 的哈希值（用于检测重复渲染）';
comment on column render_events.ip_hash is 'IP 地址的哈希值（用于风控，不存储真实IP）';
comment on column render_events.device_hash is '设备指纹的哈希值（用于风控）';
comment on column render_events.supplier_cost_rmb is '供应商成本（人民币），用于成本核算';
comment on function detect_abnormal_usage is '检测异常使用行为（用于风控）';

