/**
 * scripts/seo-scaling-gate.ts
 * SEO Scaling Gate (SSOT JSON Policy)
 *
 * Exit codes:
 * 0 = ALLOW_SCALE (GREEN)
 * 2 = FREEZE (YELLOW)
 * 3 = BLOCK_AND_ROLLBACK (RED)
 * 4 = DENY_ADMISSION (sitemap-core admission failed)
 * 10 = ERROR (missing data / unexpected)
 *
 * Usage:
 * SEO_METRICS_JSON='[...]' npx ts-node scripts/seo-scaling-gate.ts
 *
 * Or with Supabase:
 * SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx ts-node scripts/seo-scaling-gate.ts
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// POLICY (Single Source of Truth)
// ============================================================================

type GateAction =
  | "ALLOW_SCALE"
  | "FREEZE"
  | "BLOCK_AND_ROLLBACK"
  | "DENY_ADMISSION";

type GateState = "GREEN" | "YELLOW" | "RED";

const POLICY = {
  seo_scaling_gate: {
    version: "1.0",
    observation_window_days: 14,
    index_rate_thresholds: {
      green: { min: 0.7, action: "ALLOW_SCALE" as GateAction },
      yellow: { min: 0.4, max: 0.69, action: "FREEZE" as GateAction },
      red: { max: 0.39, action: "BLOCK_AND_ROLLBACK" as GateAction },
    },
    sitemap_core_admission: {
      required: {
        index_rate_min: 0.65,
        stability_days: 7,
        max_volatility: 0.05,
        crawl_errors_allowed: false,
        manual_checks: { min_urls: 5, eligible_only: true },
      },
      on_fail: "DENY_ADMISSION" as GateAction,
    },
    default_action: "FREEZE" as GateAction,
  },
} as const;

// ============================================================================
// Types
// ============================================================================

type DailyMetric = {
  date: string; // YYYY-MM-DD
  discovered_urls: number; // from GSC pages discovered
  indexed_urls: number; // from GSC indexed
  crawled_not_indexed_urls: number; // from GSC "Crawled - currently not indexed"
  crawl_requests: number; // from GSC crawl stats
  has_systemic_errors?: boolean; // canonical/5xx/robots etc aggregated
};

type GateResult = {
  policy_version: string;
  window_days: number;
  date: string;
  discovered_urls: number;
  indexed_urls: number;
  index_rate: number;
  state: GateState;
  action: GateAction;
  reason_code: string;
  sitemap_core_admission: {
    eligible: boolean;
    detail: {
      currentRate: number;
      volatility: number;
      crawlSlope: number;
      passRateMin: boolean;
      passStability: boolean;
      passErrors: boolean;
      passCrawlTrend: boolean;
    };
  };
};

// ============================================================================
// Math Utilities
// ============================================================================

function safeDiv(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return n / d;
}

function computeIndexRate(m: DailyMetric): number {
  return safeDiv(m.indexed_urls, m.discovered_urls);
}

function mean(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function maxAbsDeviationFromMean(arr: number[]): number {
  if (!arr.length) return 0;
  const m = mean(arr);
  return Math.max(...arr.map((x) => Math.abs(x - m)));
}

function slope(arr: number[]): number {
  // Simple linear regression slope over indices 0..n-1
  const n = arr.length;
  if (n < 2) return 0;
  const xs = Array.from({ length: n }, (_, i) => i);
  const xMean = mean(xs);
  const yMean = mean(arr);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (arr[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

// ============================================================================
// Classification
// ============================================================================

function classifyIndexRate(rate: number): {
  state: GateState;
  action: GateAction;
  reason_code: string;
} {
  const t = POLICY.seo_scaling_gate.index_rate_thresholds;

  if (rate >= t.green.min) {
    return {
      state: "GREEN",
      action: t.green.action,
      reason_code: "SAFE_TO_SCALE",
    };
  }

  if (rate >= t.yellow.min && rate <= (t.yellow.max ?? 1)) {
    return {
      state: "YELLOW",
      action: t.yellow.action,
      reason_code: "HOLD_MODERATE_INDEX_RATE",
    };
  }

  if (rate <= t.red.max) {
    return {
      state: "RED",
      action: t.red.action,
      reason_code: "BLOCKED_LOW_INDEX_RATE",
    };
  }

  return {
    state: "YELLOW",
    action: POLICY.seo_scaling_gate.default_action,
    reason_code: "HOLD_UNKNOWN",
  };
}

// ============================================================================
// Sitemap-Core Admission Check
// ============================================================================

function checkSitemapCoreAdmission(metrics: DailyMetric[]) {
  const req = POLICY.seo_scaling_gate.sitemap_core_admission.required;
  const last = metrics[metrics.length - 1];

  // Condition 1: current tier1 Index Rate >= min
  const currentRate = computeIndexRate(last);
  const passRateMin = currentRate >= req.index_rate_min;

  // Condition 2: stability over last stability_days: volatility <= max_volatility (±)
  const window = metrics.slice(-req.stability_days);
  const rates = window.map(computeIndexRate);
  const volatility = maxAbsDeviationFromMean(rates);
  const passStability = volatility <= req.max_volatility;

  // Condition 3: systemic errors must be false
  const passErrors = req.crawl_errors_allowed
    ? true
    : !window.some((m) => m.has_systemic_errors);

  // Condition 4: crawl stats not declining trend (slope >= 0)
  const crawls = window.map((m) => m.crawl_requests);
  const crawlSlope = slope(crawls);
  const passCrawlTrend = crawlSlope >= 0;

  return {
    eligible: passRateMin && passStability && passErrors && passCrawlTrend,
    detail: {
      currentRate,
      passRateMin,
      volatility,
      passStability,
      passErrors,
      crawlSlope,
      passCrawlTrend,
    },
  };
}

// ============================================================================
// Data Loading
// ============================================================================

async function loadMetricsFromEnv(): Promise<DailyMetric[]> {
  const raw = process.env.SEO_METRICS_JSON;
  if (!raw) {
    throw new Error(
      "Missing env SEO_METRICS_JSON. Provide DailyMetric[] as JSON."
    );
  }
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length < 3) {
    throw new Error("SEO_METRICS_JSON must be an array with >= 3 days.");
  }
  return parsed as DailyMetric[];
}

async function loadMetricsFromSupabase(): Promise<DailyMetric[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(url, key);

  const { data, error } = await supabase
    .from("seo_daily_metrics")
    .select(
      `
      date,
      gsc_discovered_urls,
      gsc_indexed_urls,
      gsc_crawled_not_indexed_urls,
      crawl_requests,
      systemic_errors_flag
    `
    )
    .order("date", { ascending: true })
    .limit(30);

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  if (!data || data.length < 3) {
    throw new Error("Not enough metrics data (need >= 3 days)");
  }

  return data.map((row: any) => ({
    date: row.date,
    discovered_urls: row.gsc_discovered_urls || 0,
    indexed_urls: row.gsc_indexed_urls || 0,
    crawled_not_indexed_urls: row.gsc_crawled_not_indexed_urls || 0,
    crawl_requests: row.crawl_requests || 0,
    has_systemic_errors: row.systemic_errors_flag || false,
  }));
}

async function loadMetrics(): Promise<DailyMetric[]> {
  // Priority: ENV JSON > Supabase
  if (process.env.SEO_METRICS_JSON) {
    return loadMetricsFromEnv();
  }

  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return loadMetricsFromSupabase();
  }

  throw new Error(
    "No data source configured. Set SEO_METRICS_JSON or SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY"
  );
}

// ============================================================================
// Exit Handling
// ============================================================================

function exitWith(action: GateAction): never {
  const code =
    action === "ALLOW_SCALE"
      ? 0
      : action === "FREEZE"
      ? 2
      : action === "BLOCK_AND_ROLLBACK"
      ? 3
      : action === "DENY_ADMISSION"
      ? 4
      : 10;
  process.exit(code);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const windowDays = POLICY.seo_scaling_gate.observation_window_days;

  console.log("🚦 SEO Scaling Gate");
  console.log("==================");
  console.log(`Policy Version: ${POLICY.seo_scaling_gate.version}`);
  console.log(`Observation Window: ${windowDays} days\n`);

  const metrics = await loadMetrics();
  const recent = metrics.slice(-windowDays);
  const last = recent[recent.length - 1];

  const rate = computeIndexRate(last);
  const { state, action, reason_code } = classifyIndexRate(rate);
  const admission = checkSitemapCoreAdmission(recent);

  const result: GateResult = {
    policy_version: POLICY.seo_scaling_gate.version,
    window_days: windowDays,
    date: last.date,
    discovered_urls: last.discovered_urls,
    indexed_urls: last.indexed_urls,
    index_rate: Number(rate.toFixed(4)),
    state,
    action,
    reason_code,
    sitemap_core_admission: {
      eligible: admission.eligible,
      detail: {
        currentRate: Number(admission.detail.currentRate.toFixed(4)),
        volatility: Number(admission.detail.volatility.toFixed(4)),
        crawlSlope: Number(admission.detail.crawlSlope.toFixed(4)),
        passRateMin: admission.detail.passRateMin,
        passStability: admission.detail.passStability,
        passErrors: admission.detail.passErrors,
        passCrawlTrend: admission.detail.passCrawlTrend,
      },
    },
  };

  // Human-readable summary
  const stateEmoji = state === "GREEN" ? "🟢" : state === "YELLOW" ? "🟡" : "🔴";
  console.log(`Date: ${result.date}`);
  console.log(`Discovered: ${result.discovered_urls}`);
  console.log(`Indexed: ${result.indexed_urls}`);
  console.log(`Index Rate: ${(result.index_rate * 100).toFixed(2)}%`);
  console.log(`\nState: ${stateEmoji} ${state}`);
  console.log(`Action: ${action}`);
  console.log(`Reason: ${reason_code}`);
  console.log(
    `\nSitemap-Core Admission: ${admission.eligible ? "✅ ELIGIBLE" : "❌ NOT ELIGIBLE"}`
  );

  // Full JSON output
  console.log("\n--- Full Result (JSON) ---");
  console.log(JSON.stringify(result, null, 2));

  // Exit with appropriate code
  exitWith(action);
}

main().catch((e) => {
  console.error("[SEO_GATE_ERROR]", e?.message || e);
  process.exit(10);
});
