# SEO Scaling Gate Policy

> **Project**: Sora2  
> **Version**: v1.0  
> **Last Updated**: 2026-01-24  
> **Status**: Active

---

## 1. Purpose

This document defines the **hard admission and scaling rules** for Sora2 SEO infrastructure.

The goal is to:

- Prevent uncontrolled index expansion
- Ensure SEO scaling is **data-driven**
- Keep all expansion **reversible and auditable**

---

## 2. Core Principles

```
1. SEO is infrastructure, not content
2. Tier1 is a probe, Core is an asset
3. Scaling is decided by Index Rate, not volume
4. Sitemap expansion must be gated
5. All decisions must be reversible
```

---

## 3. Sitemap Structure

```
sitemap.xml (index)
├── tier1-0.xml       ← active probe (1,000 URLs)
├── tier1-1.xml       ← reserved, inactive
└── [future chunks]

sitemap-core.xml      ← core assets (276 URLs, gated)
```

---

## 4. Definitions

### Index Rate

```
Index Rate = Indexed URLs / Discovered URLs
```

Source: Google Search Console → Pages

### Observation Window

A continuous **14-day period** after sitemap submission, during which no structural changes are allowed.

### Stability

Index Rate variance ≤ ±5% over 7 consecutive days.

---

## 5. Index Rate Thresholds

### 🟢 GREEN (Scale Allowed)

| Metric | Threshold |
|--------|-----------|
| Index Rate | ≥ 70% |
| Trend | Stable or rising |

**Allowed Actions**:
- Enable tier1-1.xml
- Admit sitemap-core.xml to index
- Prepare next content batch

### 🟡 YELLOW (Observe Only)

| Metric | Threshold |
|--------|-----------|
| Index Rate | 40% – 69% |
| Trend | Volatile or slow rise |

**Allowed Actions**:
- Observe only
- Optimize templates/content
- No new sitemaps

### 🔴 RED (Freeze & Rollback)

| Metric | Threshold |
|--------|-----------|
| Index Rate | < 40% |
| Trend | Declining or stagnant |

**Required Actions**:
- Freeze all expansion
- Consider rollback
- Enter diagnostic mode

---

## 6. Sitemap-Core Admission Policy

`sitemap-core.xml` is **NOT allowed** in sitemap index until **ALL** conditions below are met:

| # | Condition | Requirement |
|---|-----------|-------------|
| 1 | **Index Rate** | ≥ 65% |
| 2 | **Stability** | ≥ 7 days with variance ≤ ±5% |
| 3 | **Crawl Errors** | No systemic 5xx or canonical errors |
| 4 | **Crawl Trend** | Not declining |
| 5 | **Manual Check** | ≥ 5 URLs eligible/indexed |

### Admission Logic

```
IF all_conditions_pass:
    ALLOW: Add sitemap-core.xml to sitemap.xml index
ELSE:
    DENY: sitemap-core remains outside index
```

---

## 7. Forbidden Actions

```
❌ Adding sitemap-core before Tier1 validation
❌ Expanding tier1-* during YELLOW or RED state
❌ Using core URLs to compensate poor Index Rate
❌ Scaling based on assumptions or urgency
❌ Manual override without written justification
❌ Any "this time is special" exception
```

---

## 8. Decision Authority

| Level | Authority | Scope |
|-------|-----------|-------|
| **Automated** | CI/CD Gate | Default decisions |
| **Manual Override** | Requires written justification | Exceptional only |
| **Default Action** | FREEZE | When uncertain |

### Override Requirements

Any manual override must include:

1. Written justification
2. Risk assessment
3. Rollback plan
4. Metrics before/after

---

## 9. Audit & Rollback

All sitemap changes must:

- [ ] Be logged with timestamp
- [ ] Be reversible within 24 hours
- [ ] Have before/after metrics recorded
- [ ] Be traceable to a decision record

### Rollback Procedure

```sql
-- Emergency noindex for recent Tier2 pages
UPDATE pages 
SET meta_robots = 'noindex'
WHERE tier = 2 AND created_at > NOW() - INTERVAL '7 days';
```

---

## 10. Integration Points

| System | Integration |
|--------|-------------|
| CI/CD | `scripts/seo-scaling-gate.ts` |
| Dashboard | `v_seo_scaling_decision` view |
| Alerts | `seo_alerts` table |
| Config | `config/seo-gate-rules.json` |

---

## 11. Metrics Dashboard

### Required Visibility

| Metric | Update Frequency |
|--------|------------------|
| Index Rate | Daily |
| Index Rate 7d MA | Daily |
| Discovered URLs | Daily |
| Indexed URLs | Daily |
| Crawled-not-indexed | Daily |
| Crawl Stats | Daily |

---

## 12. Summary

```
SEO scaling is treated as a controlled system.
Expansion is a privilege, not a default.

We don't ask: "How many pages can we publish?"
We ask: "How many pages will Google actually index?"
```

---

## Appendix A: Quick Reference

### Scaling Decision Matrix

| Index Rate | Zone | Tier1-1 | sitemap-core | New Content |
|------------|------|---------|--------------|-------------|
| ≥ 70% | 🟢 | ✅ Allow | ✅ Allow | ✅ Allow |
| 65-69% | 🟡 | ❌ Wait | ⚠️ Review | ❌ Hold |
| 40-64% | 🟡 | ❌ No | ❌ No | ❌ No |
| < 40% | 🔴 | ❌ Block | ❌ Block | ❌ Block |

### Daily Checklist

1. Check Index Rate
2. Check Crawled-not-indexed trend
3. Check Crawl Stats
4. Log findings
5. No action unless GREEN for 14 days

---

*Document Version: 1.0 | Created: 2026-01-24*
