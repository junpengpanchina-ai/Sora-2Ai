-- Share-Unlock Conversion Gate: 判断 Share-Unlock 是否在"促转化"而非"替代付费"
-- 这是一个只读判定 Gate，不直接改价格/放量，但决定"是否允许调整策略"

-- 7 日滚动指标视图（从 events + share_unlock_daily_counts 计算）
CREATE OR REPLACE VIEW v_share_unlock_metrics_7d AS
WITH share_events AS (
  SELECT 
    DATE(created_at) AS day,
    name,
    user_id,
    (meta->>'taskId')::text AS task_id,
    (meta->>'platform')::text AS platform
  FROM events
  WHERE name IN ('share_click', 'share_unlock_claim', 'download_no_watermark_via_share', 'download_no_watermark_paid')
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
),
share_clicks AS (
  SELECT COUNT(*) AS cnt FROM share_events WHERE name = 'share_click'
),
unlock_claims AS (
  SELECT COUNT(*) AS cnt FROM share_events WHERE name = 'share_unlock_claim'
),
unlock_downloads AS (
  SELECT COUNT(*) AS cnt FROM share_events WHERE name = 'download_no_watermark_via_share'
),
paid_downloads AS (
  SELECT COUNT(*) AS cnt FROM share_events WHERE name = 'download_no_watermark_paid'
),
unlock_to_paid AS (
  -- 领取 unlock 后 48h 内付费（通过 recharge_records 关联）
  SELECT COUNT(DISTINCT u.user_id) AS cnt
  FROM share_events u
  JOIN recharge_records r ON r.user_id = u.user_id
    AND r.status = 'completed'
    AND r.created_at >= u.created_at
    AND r.created_at <= u.created_at + INTERVAL '48 hours'
  WHERE u.name = 'share_unlock_claim'
),
baseline_paid AS (
  -- 未使用 unlock 的自然付费率（最近 7 天，未领取过 unlock 的用户）
  SELECT COUNT(DISTINCT r.user_id) AS cnt
  FROM recharge_records r
  WHERE r.status = 'completed'
    AND r.created_at >= CURRENT_DATE - INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM share_events u
      WHERE u.user_id = r.user_id
        AND u.name = 'share_unlock_claim'
        AND u.created_at <= r.created_at
    )
),
total_users_7d AS (
  SELECT COUNT(DISTINCT user_id) AS cnt
  FROM events
  WHERE name = 'generation_success'
    AND created_at >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  (SELECT cnt FROM share_clicks) AS share_clicks_7d,
  (SELECT cnt FROM unlock_claims) AS unlock_claims_7d,
  (SELECT cnt FROM unlock_downloads) AS unlock_downloads_7d,
  (SELECT cnt FROM paid_downloads) AS paid_downloads_7d,
  (SELECT cnt FROM unlock_to_paid) AS unlock_to_paid_48h,
  (SELECT cnt FROM baseline_paid) AS baseline_paid_7d,
  (SELECT cnt FROM total_users_7d) AS total_users_7d,
  -- 计算比率
  CASE WHEN (SELECT cnt FROM share_clicks) > 0 
    THEN (SELECT cnt FROM unlock_claims)::FLOAT / (SELECT cnt FROM share_clicks)
    ELSE NULL END AS share_unlock_claim_rate,
  CASE WHEN (SELECT cnt FROM unlock_claims) > 0
    THEN (SELECT cnt FROM unlock_downloads)::FLOAT / (SELECT cnt FROM unlock_claims)
    ELSE NULL END AS share_unlock_to_download_rate,
  CASE WHEN (SELECT cnt FROM unlock_claims) > 0
    THEN (SELECT cnt FROM unlock_to_paid)::FLOAT / (SELECT cnt FROM unlock_claims)
    ELSE NULL END AS share_unlock_to_paid_rate,
  CASE WHEN (SELECT cnt FROM total_users_7d) > 0
    THEN (SELECT cnt FROM baseline_paid)::FLOAT / (SELECT cnt FROM total_users_7d)
    ELSE NULL END AS paid_without_share_rate,
  CASE WHEN (SELECT cnt FROM unlock_downloads) + (SELECT cnt FROM paid_downloads) > 0
    THEN (SELECT cnt FROM unlock_downloads)::FLOAT / 
         ((SELECT cnt FROM unlock_downloads) + (SELECT cnt FROM paid_downloads))
    ELSE NULL END AS download_nowm_via_share_ratio
;

COMMENT ON VIEW v_share_unlock_metrics_7d IS 'Share-Unlock 7 日滚动指标，用于 rpc_share_unlock_conversion_gate';

-- Gate 判定 RPC（写死规则）
CREATE OR REPLACE FUNCTION rpc_share_unlock_conversion_gate()
RETURNS TABLE(
  gate TEXT,
  share_unlock_claim_rate FLOAT,
  share_unlock_to_download_rate FLOAT,
  share_unlock_to_paid_rate FLOAT,
  paid_without_share_rate FLOAT,
  download_nowm_via_share_ratio FLOAT,
  recommended_action TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  m RECORD;
  gate_status TEXT;
  action_text TEXT;
BEGIN
  SELECT * INTO m FROM v_share_unlock_metrics_7d;

  -- 无数据 → 保守 LOCKDOWN
  IF m IS NULL OR m.share_unlock_claim_rate IS NULL THEN
    gate_status := 'LOCKDOWN';
    action_text := 'Insufficient data. Wait for more share-unlock activity.';
    RETURN QUERY SELECT gate_status, m.share_unlock_claim_rate, m.share_unlock_to_download_rate,
      m.share_unlock_to_paid_rate, m.paid_without_share_rate, m.download_nowm_via_share_ratio, action_text;
    RETURN;
  END IF;

  -- 🔴 RED: 替代付费风险高
  IF (m.share_unlock_to_paid_rate IS NOT NULL AND m.paid_without_share_rate IS NOT NULL 
      AND m.share_unlock_to_paid_rate < m.paid_without_share_rate * 0.5)
     OR (m.download_nowm_via_share_ratio IS NOT NULL AND m.download_nowm_via_share_ratio >= 0.6)
     OR (m.share_unlock_claim_rate IS NOT NULL AND m.share_unlock_claim_rate > 0.6)
  THEN
    gate_status := 'RED';
    action_text := 'Cannibalization risk detected. Restrict to shorter duration (Veo 8s only) or reduce daily limit.';
    RETURN QUERY SELECT gate_status, m.share_unlock_claim_rate, m.share_unlock_to_download_rate,
      m.share_unlock_to_paid_rate, m.paid_without_share_rate, m.download_nowm_via_share_ratio, action_text;
    RETURN;
  END IF;

  -- 🟡 YELLOW: 观察期
  IF (m.share_unlock_to_paid_rate IS NOT NULL AND m.paid_without_share_rate IS NOT NULL
      AND m.share_unlock_to_paid_rate < m.paid_without_share_rate * 0.8
      AND m.share_unlock_to_paid_rate >= m.paid_without_share_rate * 0.5)
     OR (m.download_nowm_via_share_ratio IS NOT NULL 
         AND m.download_nowm_via_share_ratio >= 0.4 
         AND m.download_nowm_via_share_ratio < 0.6)
  THEN
    gate_status := 'YELLOW';
    action_text := 'Monitor closely. Only allow copy-level optimization. Do not increase daily limit or expand eligibility.';
    RETURN QUERY SELECT gate_status, m.share_unlock_claim_rate, m.share_unlock_to_download_rate,
      m.share_unlock_to_paid_rate, m.paid_without_share_rate, m.download_nowm_via_share_ratio, action_text;
    RETURN;
  END IF;

  -- 🟢 GREEN: 健康，可继续
  gate_status := 'GREEN';
  action_text := 'Healthy conversion. Can A/B test copy, optimize placement, test stronger upsell copy.';
  RETURN QUERY SELECT gate_status, m.share_unlock_claim_rate, m.share_unlock_to_download_rate,
    m.share_unlock_to_paid_rate, m.paid_without_share_rate, m.download_nowm_via_share_ratio, action_text;
END;
$$;

COMMENT ON FUNCTION rpc_share_unlock_conversion_gate() IS 'Share-Unlock Conversion Gate: GREEN / YELLOW / RED，决定是否允许调整策略';

GRANT EXECUTE ON FUNCTION rpc_share_unlock_conversion_gate() TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_share_unlock_conversion_gate() TO service_role;
