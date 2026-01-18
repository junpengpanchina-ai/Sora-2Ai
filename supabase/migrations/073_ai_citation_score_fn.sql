-- 073_ai_citation_score_fn.sql
-- 创建 AI 引用分数计算函数（RPC 可直接用）

create or replace function public.compute_ai_citation_score(p_scene_id uuid)
returns numeric
language plpgsql
stable
as $$
declare
  v_tier int;
  v_noindex boolean;
  v_updated_at timestamptz;
  v_bind_count int;
  w_tier1 numeric;
  w_tier2 numeric;
  w_tier3 numeric;
  w_has_bind numeric;
  w_sat numeric;
  w_fresh numeric;
  score numeric := 0;
begin
  select tier, noindex, updated_at
    into v_tier, v_noindex, v_updated_at
  from public.use_cases
  where id = p_scene_id;

  if v_noindex is true then
    return 0;
  end if;

  select count(*) into v_bind_count
  from public.scene_prompt_bindings b
  where b.scene_id = p_scene_id;

  select
    (select weight from public.ai_score_weights where key='tier1'),
    (select weight from public.ai_score_weights where key='tier2'),
    (select weight from public.ai_score_weights where key='tier3'),
    (select weight from public.ai_score_weights where key='has_prompt_binding'),
    (select weight from public.ai_score_weights where key='prompt_binding_saturation'),
    (select weight from public.ai_score_weights where key='freshness_30d')
  into w_tier1, w_tier2, w_tier3, w_has_bind, w_sat, w_fresh;

  -- Tier base
  if v_tier = 1 then score := score + w_tier1;
  elsif v_tier = 2 then score := score + w_tier2;
  else score := score + w_tier3;
  end if;

  -- Any binding => strong signal
  if v_bind_count > 0 then
    score := score + w_has_bind;
    -- saturation: 1 - exp(-k*n). 这里用 ln(1+n)/ln(1+6) 截断到 6 个绑定即接近满分
    score := score + (least(ln(1 + v_bind_count) / ln(1 + 6), 1) * w_sat);
  end if;

  -- Freshness within 30 days
  if v_updated_at is not null and v_updated_at > now() - interval '30 days' then
    score := score + w_fresh;
  end if;

  -- clamp 0..1
  if score < 0 then score := 0; end if;
  if score > 1 then score := 1; end if;

  return score;
end;
$$;
