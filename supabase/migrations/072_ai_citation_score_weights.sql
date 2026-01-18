-- 072_ai_citation_score_weights.sql
-- 创建 AI 引用分数权重配置表（可解释、可迭代）

create table if not exists public.ai_score_weights (
  key text primary key,
  weight numeric not null,
  note text
);

insert into public.ai_score_weights(key, weight, note) values
('tier1', 0.45, 'tier=1 base'),
('tier2', 0.25, 'tier=2 base'),
('tier3', 0.10, 'tier=3 base'),
('has_prompt_binding', 0.25, 'any binding exists'),
('prompt_binding_saturation', 0.15, 'log saturation on binding count'),
('freshness_30d', 0.15, 'updated recently')
on conflict (key) do update set weight=excluded.weight, note=excluded.note;
