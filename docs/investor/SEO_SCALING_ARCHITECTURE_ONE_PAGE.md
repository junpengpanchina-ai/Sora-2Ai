# Sora2 SEO Scaling Architecture

> **One Page Summary for Investors**  
> **Version**: 1.0  
> **Date**: 2026-01-24

---

## The Problem We Solve

Most AI content tools generate pages blindly.  
**We control whether Google will actually index them.**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   SIGNALS                 GATE                    ACTIONS       │
│   (Input)                 (Decision)              (Output)      │
│                                                                 │
│   ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│   │ Discovered  │    │                 │    │                 │ │
│   │ URLs        │───▶│   Index Rate    │───▶│  Scale Allowed  │ │
│   ├─────────────┤    │   Monitor       │    │  (GREEN ≥70%)   │ │
│   │ Indexed     │    │                 │    ├─────────────────┤ │
│   │ URLs        │───▶│  ┌───────────┐  │───▶│  Observe Only   │ │
│   ├─────────────┤    │  │ 🟢 GREEN  │  │    │  (YELLOW 40-69) │ │
│   │ Crawl       │    │  │ 🟡 YELLOW │  │    ├─────────────────┤ │
│   │ Frequency   │───▶│  │ 🔴 RED    │  │───▶│  Freeze         │ │
│   ├─────────────┤    │  └───────────┘  │    │  (RED <40%)     │ │
│   │ Index Rate  │    │                 │    │                 │ │
│   │ (%)         │───▶│   14-Day Gate   │    │                 │ │
│   └─────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Index Rate Zones

| Zone | Threshold | Action |
|------|-----------|--------|
| 🟢 **GREEN** | ≥ 70% | Scale Allowed |
| 🟡 **YELLOW** | 40-69% | Observe Only |
| 🔴 **RED** | < 40% | Freeze & Diagnose |

---

## Controlled Actions by Zone

### 🟢 GREEN (Index Rate ≥ 70%)

```
✅ Enable additional sitemap chunks
✅ Admit core URLs to sitemap index
✅ Prepare next content batch
```

### 🟡 YELLOW (Index Rate 40-69%)

```
⏸ No new URLs added
⏸ Optimize existing templates
⏸ Wait for signal improvement
```

### 🔴 RED (Index Rate < 40%)

```
🛑 Freeze all expansion
🛑 Rollback if necessary
🛑 Diagnose root cause
```

---

## Key Differentiator

| Traditional AI SEO | Sora2 SEO Infrastructure |
|--------------------|--------------------------|
| Generate → Hope → React | Probe → Measure → Decide |
| Volume-driven | Index Rate-driven |
| Manual monitoring | Automated gate |
| Reactive fixes | Proactive controls |

---

## Sitemap Structure

```
Tier1 (Probe)           Core (Assets)
┌─────────────┐         ┌─────────────┐
│ tier1-0.xml │         │ sitemap-    │
│ 1,000 URLs  │         │ core.xml    │
│ (Active)    │         │ 276 URLs    │
└─────────────┘         │ (Gated)     │
       │                └─────────────┘
       │                       │
       ▼                       │
  Index Rate              Only admitted
  validated?              when Tier1
       │                  passes gate
       │                       │
       ▼                       ▼
   YES → 🟢              Merge into index
   NO  → 🔴              Stay isolated
```

---

## Design Philosophy

```
"We treat SEO scaling like infrastructure capacity planning,
 not content publishing."
```

---

## Business Impact

| Metric | Without Gate | With Gate |
|--------|--------------|-----------|
| **SEO Risk** | Uncontrolled | Bounded |
| **Index Quality** | Unknown | Measured |
| **Scaling Speed** | Fast, risky | Controlled, safe |
| **Recovery Cost** | High | Low |

---

## Technical Implementation

- **Automated Gate**: CI/CD integration
- **Dashboard**: Real-time Index Rate monitoring
- **Alerts**: Threshold breach notifications
- **Rollback**: One-click content removal

---

## Summary

```
We don't ask: "How many pages can we publish?"
We ask: "How many pages will Google actually index?"

That's the difference between a tool and infrastructure.
```

---

*Investor Summary v1.0 | Sora2 | 2026-01-24*
