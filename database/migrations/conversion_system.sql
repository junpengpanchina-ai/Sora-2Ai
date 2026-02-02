-- ============================================================
-- 转化系统：日粒度聚合表 + 7 日视图 + Gate RPC + 支付实验配置
-- 原则：不做事件洪水表，全部用聚合视图 + 日粒度；指标直接驱动 Gate
-- ============================================================

-- 1. 日粒度指标表（每天 1 行，由 cron/API 从 events + recharge_records 聚合写入）
CREATE TABLE IF NOT EXISTS conversion_daily_metrics (
  day DATE PRIMARY KEY,

  -- 流量质量
  new_users INT NOT NULL DEFAULT 0,
  avg_session_time_sec INT,
  bounce_after_landing_rate FLOAT,

  -- 使用成功
  submit_task_rate FLOAT,
  task_success_rate FLOAT,
  avg_time_to_success_sec INT,
  retry_rate FLOAT,

  -- 转化意愿
  success_to_upgrade_click FLOAT,
  upgrade_hover_rate FLOAT,
  time_on_result_sec INT,
  replay_rate FLOAT,

  -- 支付完成
  upgrade_to_pay_start FLOAT,
  pay_start_to_success FLOAT,
  payment_failure_rate FLOAT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conversion_daily_metrics IS '转化健康日粒度指标，用于 Admin 30 秒判断能否动价格';
COMMENT ON COLUMN conversion_daily_metrics.day IS '统计日（UTC 或业务时区一致）';
COMMENT ON COLUMN conversion_daily_metrics.task_success_rate IS 'submit → success，≥0.7 健康';
COMMENT ON COLUMN conversion_daily_metrics.success_to_upgrade_click IS '成功 → 点击 Upgrade，≥0.05 才可 OBSERVE';
COMMENT ON COLUMN conversion_daily_metrics.pay_start_to_success IS '支付页 → 成功，≥0.8 可 GREEN';

CREATE INDEX IF NOT EXISTS idx_conversion_daily_metrics_day ON conversion_daily_metrics(day DESC);

-- 2. 最近 7 天滚动窗口视图（Admin 默认看这个）
CREATE OR REPLACE VIEW v_conversion_health_7d AS
SELECT
  AVG(task_success_rate) AS task_success_rate_7d,
  AVG(success_to_upgrade_click) AS success_to_upgrade_click_7d,
  AVG(upgrade_to_pay_start) AS upgrade_to_pay_start_7d,
  AVG(pay_start_to_success) AS pay_start_to_success_7d,
  AVG(payment_failure_rate) AS payment_failure_rate_7d
FROM conversion_daily_metrics
WHERE day >= CURRENT_DATE - INTERVAL '7 days';

COMMENT ON VIEW v_conversion_health_7d IS '最近 7 天转化健康滚动均值，供 rpc_conversion_gate 使用';

-- 3. Gate 判定 RPC（写死规则，避免人肉拍脑袋）
CREATE OR REPLACE FUNCTION rpc_conversion_gate()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  r RECORD;
BEGIN
  SELECT * INTO r FROM v_conversion_health_7d;

  -- 无数据或关键指标缺失 → 保守 LOCKDOWN
  IF r IS NULL
     OR (r.task_success_rate_7d IS NULL AND r.success_to_upgrade_click_7d IS NULL)
  THEN
    RETURN 'LOCKDOWN';
  END IF;

  IF (r.task_success_rate_7d IS NOT NULL AND r.task_success_rate_7d < 0.7)
     OR (r.success_to_upgrade_click_7d IS NOT NULL AND r.success_to_upgrade_click_7d < 0.05)
  THEN
    RETURN 'LOCKDOWN';
  ELSIF (r.pay_start_to_success_7d IS NOT NULL AND r.pay_start_to_success_7d < 0.8)
        OR (r.payment_failure_rate_7d IS NOT NULL AND r.payment_failure_rate_7d > 0.15)
  THEN
    RETURN 'OBSERVE';
  ELSE
    RETURN 'GREEN';
  END IF;
END;
$$;

COMMENT ON FUNCTION rpc_conversion_gate() IS '转化 Gate：LOCKDOWN / OBSERVE / GREEN，Admin 所有改价格/档位必须先过此 RPC';

-- 4. 支付实验配置表（Admin 可配置开关）
CREATE TABLE IF NOT EXISTS pricing_experiments (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  config JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pricing_experiments IS '支付页 A/B 实验配置，enabled 由 Admin 开关控制';
COMMENT ON COLUMN pricing_experiments.key IS '实验键，如 first_payment_low_only';
COMMENT ON COLUMN pricing_experiments.enabled IS '是否开启实验';
COMMENT ON COLUMN pricing_experiments.config IS '实验参数，如 ratio、buckets';

-- 初始化一条：首次付费低档 only 实验
INSERT INTO pricing_experiments (key, enabled, config)
VALUES (
  'first_payment_low_only',
  FALSE,
  '{"ratio": 0.5, "buckets": ["control", "low_only"]}'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 5. RPC：决定用户进哪个 bucket（读 pricing_experiments，仅当 enabled 且 Gate≠GREEN 时参与）
CREATE OR REPLACE FUNCTION rpc_pricing_bucket(
  p_user_id UUID,
  p_is_first_payment BOOLEAN,
  p_is_first_success BOOLEAN,
  p_gate TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  cfg JSONB;
  ratio_val FLOAT;
BEGIN
  SELECT config INTO cfg
  FROM pricing_experiments
  WHERE key = 'first_payment_low_only'
    AND enabled = TRUE;

  IF cfg IS NULL THEN
    RETURN 'control';
  END IF;

  IF NOT p_is_first_payment
     OR NOT p_is_first_success
     OR p_gate = 'GREEN'
  THEN
    RETURN 'control';
  END IF;

  ratio_val := COALESCE((cfg->>'ratio')::FLOAT, 0.5);

  IF random() < ratio_val THEN
    RETURN 'low_only';
  ELSE
    RETURN 'control';
  END IF;
END;
$$;

COMMENT ON FUNCTION rpc_pricing_bucket(UUID, BOOLEAN, BOOLEAN, TEXT) IS '支付页 A/B 分桶：control=多档，low_only=低档 only，依赖 pricing_experiments.enabled';

-- ============================================================
-- 使用说明
-- ============================================================
-- 1. conversion_daily_metrics 需由定时任务按日聚合写入（从 events + recharge_records 计算）。
-- 2. 可调用 POST /api/admin/conversion-daily 或自建 cron 写入当日/历史日数据。
-- 3. 未写入数据时 v_conversion_health_7d 为空，rpc_conversion_gate() 返回 LOCKDOWN。
-- 4. Admin 所有“是否允许改价格/档位”的决策，应先过 rpc_conversion_gate()。
