-- Migration: 053_add_fx_rates.sql
-- Description: 汇率表和成本核算表（用于后台查看利润、现金流计算）
-- 依赖: 048_add_credit_wallet_system.sql

-- 1) FX Rates 表（汇率）
create table if not exists fx_rates (
  id bigserial primary key,
  date date not null unique,
  usd_cny numeric(10,4) not null, -- 例如 7.2
  updated_at timestamptz not null default now()
);

create index if not exists idx_fx_rates_date on fx_rates(date desc);

-- 插入初始汇率（7.2，可后续更新）
insert into fx_rates (date, usd_cny)
values (current_date, 7.2)
on conflict (date) do nothing;

-- 2) Render Costs 表（渲染成本）
create table if not exists render_costs (
  id bigserial primary key,
  model text not null unique check (model in ('sora', 'veo_fast', 'veo_pro')),
  cost_per_render_cny numeric(10,4) not null, -- 人民币成本
  updated_at timestamptz not null default now()
);

-- 插入初始成本数据（按最差成本）
insert into render_costs (model, cost_per_render_cny) values
  ('sora', 0.099), -- ¥0.099
  ('veo_fast', 0.8), -- ¥0.8（最差）
  ('veo_pro', 4.0) -- ¥4.0（最差）
on conflict (model) do update
set cost_per_render_cny = excluded.cost_per_render_cny,
    updated_at = now();

-- 3) Profit Margins 视图（实时计算毛利）
create or replace view profit_margins as
select
  rc.model,
  rc.cost_per_render_cny,
  rc.cost_per_render_cny / fx.usd_cny as cost_per_render_usd,
  case rc.model
    when 'sora' then 0.0325 -- $39 / 1200 credits * 10 credits
    when 'veo_fast' then 0.1625 -- $39 / 1200 credits * 50 credits
    when 'veo_pro' then 0.8125 -- $39 / 1200 credits * 250 credits
  end as price_per_render_usd,
  case rc.model
    when 'sora' then 0.0325 - (rc.cost_per_render_cny / fx.usd_cny)
    when 'veo_fast' then 0.1625 - (rc.cost_per_render_cny / fx.usd_cny)
    when 'veo_pro' then 0.8125 - (rc.cost_per_render_cny / fx.usd_cny)
  end as gross_margin_usd_per_render,
  case rc.model
    when 'sora' then (0.0325 - (rc.cost_per_render_cny / fx.usd_cny)) / 0.0325 * 100
    when 'veo_fast' then (0.1625 - (rc.cost_per_render_cny / fx.usd_cny)) / 0.1625 * 100
    when 'veo_pro' then (0.8125 - (rc.cost_per_render_cny / fx.usd_cny)) / 0.8125 * 100
  end as gross_margin_percent
from render_costs rc
cross join (
  select usd_cny from fx_rates order by date desc limit 1
) fx;

-- 4) RPC: 更新汇率（每天更新一次）
create or replace function update_fx_rate(
  p_date date default current_date,
  p_usd_cny numeric
) returns boolean as $$
begin
  insert into fx_rates (date, usd_cny)
  values (p_date, p_usd_cny)
  on conflict (date) do update
  set usd_cny = excluded.usd_cny,
      updated_at = now();
  
  return true;
end;
$$ language plpgsql;

-- 5) RPC: 更新渲染成本
create or replace function update_render_cost(
  p_model text,
  p_cost_per_render_cny numeric
) returns boolean as $$
begin
  if p_model not in ('sora', 'veo_fast', 'veo_pro') then
    return false;
  end if;
  
  insert into render_costs (model, cost_per_render_cny)
  values (p_model, p_cost_per_render_cny)
  on conflict (model) do update
  set cost_per_render_cny = excluded.cost_per_render_cny,
      updated_at = now();
  
  return true;
end;
$$ language plpgsql;

-- 6) RPC: 计算现金流（覆盖固定成本需要的 Veo Pro 次数）
create or replace function calculate_cashflow_break_even(
  p_fixed_cost_usd_monthly numeric default 69
) returns jsonb as $$
declare
  v_veo_pro_cost_usd numeric;
  v_veo_pro_price_usd numeric := 0.8125; -- $39 / 1200 credits * 250 credits
  v_veo_pro_margin_usd numeric;
  v_break_even_count int;
begin
  -- 获取 Veo Pro 成本（USD）
  select cost_per_render_usd into v_veo_pro_cost_usd
  from profit_margins
  where model = 'veo_pro';
  
  -- 计算毛利
  v_veo_pro_margin_usd := v_veo_pro_price_usd - v_veo_pro_cost_usd;
  
  -- 计算盈亏平衡点
  v_break_even_count := ceil(p_fixed_cost_usd_monthly / v_veo_pro_margin_usd);
  
  return jsonb_build_object(
    'fixed_cost_usd_monthly', p_fixed_cost_usd_monthly,
    'veo_pro_cost_usd', v_veo_pro_cost_usd,
    'veo_pro_price_usd', v_veo_pro_price_usd,
    'veo_pro_margin_usd', v_veo_pro_margin_usd,
    'break_even_count', v_break_even_count,
    'message', format('Need %s Veo Pro renders per month to break even', v_break_even_count)
  );
end;
$$ language plpgsql;

-- 7) 注释
comment on table fx_rates is '汇率表（USD/CNY），每天更新一次';
comment on table render_costs is '渲染成本表（人民币），按模型存储单次成本';
comment on view profit_margins is '利润边际视图，实时计算每个模型的成本和毛利';
comment on function calculate_cashflow_break_even is '计算现金流盈亏平衡点（需要多少 Veo Pro 渲染次数）';

