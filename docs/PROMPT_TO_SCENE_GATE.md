# PROMPT → SCENE Upgrade Gate (Quant v1.0)

**Project**: Sora-2Ai  
**Status**: Active  
**Last Updated**: 2026-01-25  

## 0) Why this exists
We only promote **the top 1–5%** of Prompt assets into **Scene / Use Case** (SEO first-class pages).  
This prevents “prompt pile → SEO junk pages” and protects indexing health during scaling.

## 1) Definitions
- **Prompt**: internal/product asset for execution (template, capability implementation).
- **Scene / Use Case**: SEO first-class asset representing a search intent + scenario.
- **Observation Window**: default **7 days** rolling window for behavior metrics.
- **P90**: 90th percentile among all eligible prompts in the same locale (or globally if sample is small).

## 2) Inputs (measurable signals)
Required signals (per prompt or per prompt-family):
- `usage_count_7d`: number of times prompt was used in the last 7 days
- `success_rate_7d`: succeeded / attempts in last 7 days
- `unique_users_7d`: distinct users who used it in last 7 days
- `refund_rate_7d`: refunded / attempts (or “failed credited back” ratio)
- `policy_block_rate_7d`: policy rejects / attempts
- `structure_failure_rate_7d`: malformed output / attempts (if applicable)
- `last_used_at`

SEO system state signals:
- `index_gate_state`: GREEN/YELLOW/RED (see `docs/policies/INDEX_RATE_THRESHOLDS.md`)
- `sitemap_health`: OK/DEGRADED (see `docs/policies/SITEMAP_CORE_ADMISSION_POLICY.md` and sitemap checks)

## 3) The Gate (ALL MUST PASS)
### Gate A — Usage Strength (Demand)
**PASS if**:
- `usage_count_7d` ≥ **P90** (top 10%)  
  and
- `unique_users_7d` ≥ **min(20, P70)** (avoid single-user bias)

Rationale: high usage must be broad, not concentrated.

### Gate B — Success & Stability (Reliability)
**PASS if**:
- `success_rate_7d` ≥ **0.65** (default; tune 0.60–0.75 by model)
- `refund_rate_7d` ≤ **0.10**
- `policy_block_rate_7d` ≤ **0.02**
- `structure_failure_rate_7d` ≤ **0.01** (or N/A if not tracked)

### Gate C — Abstractability (SEO Eligibility)
**PASS if** (human + LLM review checklist):
- There exists a clear, nameable **search intent** (not just an editing instruction)
- The concept can be expressed as a **scenario** (who/what/why), not a “micro step”
- The “scene title” does not require prompt-only jargon

Examples:
- ❌ “Add cinematic lighting with fast cuts” (micro instruction)
- ✅ “Facebook Ads Video Creative Generator” (searchable scenario)

### Gate D — SEO System Gate (Safety)
**PASS if**:
- `index_gate_state = GREEN`
- `sitemap_health = OK`
- No active incident: 5xx spikes, sitemap anomalies, canonicalization regressions

## 4) Quant Score (Ranking within passing prompts)
Passing prompts are then ranked to decide **which 1–5%** are worth building as Scenes.

### Normalization
Let:
- \(U = \text{pctl}(usage\_count\_7d)\) in [0,1]
- \(S = clamp(success\_rate\_7d, 0, 1)\)
- \(B = 1 - clamp(policy\_block\_rate\_7d / 0.02, 0, 1)\)
- \(R = 1 - clamp(refund\_rate\_7d / 0.10, 0, 1)\)
- \(D = clamp(unique\_users\_7d / target\_users, 0, 1)\) where `target_users` default = 50

### SceneCandidateScore (0–100)
\[
\text{Score} = 100 \times (0.35U + 0.30S + 0.15D + 0.10R + 0.10B)
\]

Default promotion policy:
- Promote only if **Score ≥ 80** and within the top **1–5%** for the locale.

## 5) Output of the Gate (What happens next)
If ALL Gates pass:
- Create a **Scene spec** (title, intent, target query set, canonical URL rules)
- Draft Scene content (human + LLM) and wire to tool embed
- Admit into sitemap via existing SEO admission policy (Tier rules apply)

If ANY Gate fails:
- Remains a Prompt asset (keep iterating via experiments)
- If failure is stability-related, route to **Gemini 3 Pro** repair workflow

## 6) Hard “Do Not Do” (Prevents future accidents)
- Do NOT promote because “we have a lot of prompts”
- Do NOT promote because “it reads well”
- Do NOT SEO-optimize prompt titles/URLs
- Do NOT add prompts to sitemap under any circumstance

