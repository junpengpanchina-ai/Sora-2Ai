# Post-Mortem: The "Perfectly Valid" Sitemap That Indexed Zero Pages

> **Date**: January 24, 2026
> **Severity**: Critical (SEO)
> **Duration**: Unknown (potentially weeks)
> **Impact**: Google discovered 0 pages from primary sitemap

---

## TL;DR

Our sitemap index was pointing to an empty chunk file due to an off-by-one error. Google Search Console showed "Success" with "0 discovered pages" — which is technically correct behavior for a valid but empty sitemap.

**Root cause**: `tier1-${i + 1}` instead of `tier1-${i}`

**Fix**: One line change in two files.

---

## Timeline

| Time | Event |
|------|-------|
| Unknown | Bug introduced (sitemap index references tier1-1 instead of tier1-0) |
| Jan 24, 2026 | Noticed GSC showing "0 discovered pages" for sitemap.xml |
| Jan 24, 19:30 | Root cause identified |
| Jan 24, 19:45 | Fix deployed |
| Jan 24, 19:52 | Verified fix in production |

---

## Background

We have a tiered sitemap architecture for ~100k pages:

```
/sitemap.xml (index)
└── /sitemaps/tier1-0.xml (1000 high-value URLs)

/sitemap-core.xml (276 brand/trust pages)
```

Google Search Console showed:

| Sitemap | Status | Discovered Pages |
|---------|--------|------------------|
| /sitemap.xml | ✅ Success | **0** |
| /sitemap-core.xml | ✅ Success | 276 |

Initial hypothesis: "GSC is just slow, give it time."

**Wrong.**

---

## Root Cause Analysis

### The Symptom

```bash
$ curl -s https://sora2aivideos.com/sitemap.xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://sora2aivideos.com/sitemaps/tier1-1.xml</loc>
  </sitemap>
</sitemapindex>
```

The index was pointing to `tier1-1.xml`, not `tier1-0.xml`.

### The Problem

We had **two routing systems** with different index conventions:

| Route File | Handles | Index Start | Data Source |
|------------|---------|-------------|-------------|
| `[name]/route.ts` | tier1-0.xml | 0 | RPC function |
| `tier1-[...n]/route.ts` | tier1-1.xml+ | 1 | Direct table query |

The sitemap index generator used `i + 1`:

```typescript
// ❌ Bug: starts from 1
const tier1Sitemaps = Array.from({ length: tier1Chunks }, (_, i) => ({
  loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
}))
```

This caused:
- `tier1-1.xml` to be referenced (handled by catch-all route, returns 0 rows)
- `tier1-0.xml` to be orphaned (has 1000 URLs, but never referenced)

### Why GSC Showed "Success"

```xml
<!-- tier1-1.xml returned this -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>
```

This is **valid XML**. Google doesn't error on empty sitemaps — it just has nothing to discover.

**"Success" + "0 discovered" = Valid but useless.**

---

## The Fix

```diff
// sitemap.xml/route.ts & sitemap-index.xml/route.ts

- loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
+ loc: `${baseUrl}/sitemaps/tier1-${i}.xml`,
```

**Lines changed**: 4
**Files changed**: 2
**Time to fix**: 15 minutes (after diagnosis)

---

## Verification

```bash
# Before fix
$ curl -s https://sora2aivideos.com/sitemap.xml | grep tier1
<loc>https://sora2aivideos.com/sitemaps/tier1-1.xml</loc>

# After fix
$ curl -s https://sora2aivideos.com/sitemap.xml | grep tier1
<loc>https://sora2aivideos.com/sitemaps/tier1-0.xml</loc>

# Verify tier1-0 has URLs
$ curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -c "<url>"
1000
```

---

## Impact

### What Was Affected

- Primary sitemap index pointed to empty chunk
- Google could not discover ~1000 high-value pages
- SEO crawl pipeline was effectively broken for Tier1 content

### What Wasn't Affected

- `/sitemap-core.xml` (independent, 276 pages)
- Direct URL access (pages were still accessible)
- Googlebot could still find pages through internal links

---

## Lessons Learned

### 1. "Success" ≠ "Working"

GSC's sitemap status only validates XML syntax, not semantic correctness. A sitemap that returns zero URLs is "successful" — it's just useless.

**Action**: Don't trust "Success" status. Always verify URL counts.

### 2. Off-by-One Errors Hide in Plain Sight

Two routing systems with different index conventions (`0` vs `1`) created a silent failure mode.

**Action**: Establish and document index conventions. Use constants.

```typescript
const TIER_START_INDEX = 0 // All tiers start from 0
```

### 3. Empty Sitemaps Are Valid

Google's sitemap parser accepts empty `<urlset>` elements. This is by design — but it means your automation won't catch "valid but empty" sitemaps.

**Action**: Add health checks that fail on empty Tier1 chunks.

```typescript
if (tier1UrlCount === 0) {
  throw new Error("Tier1 sitemap is empty — blocking deployment")
}
```

### 4. Look at the Pipeline, Not the UI

GSC UI updates are delayed 24-72 hours. The real signals are:
- What does `curl` return?
- What's in the actual XML?
- What does URL Inspection show?

**Action**: Build verification scripts that check production directly.

---

## Prevention Measures

### 1. Database Constraint

```sql
ALTER TABLE sitemap_chunks
ADD CONSTRAINT tier1_0_not_empty
CHECK (NOT (tier = 1 AND name = 'tier1-0' AND url_count = 0));
```

### 2. Health Check Script

```bash
# Run daily and on every deployment
./scripts/sitemap_health_check.ts
```

### 3. CI/CD Gate

```typescript
if (await hasSitemapCriticalIssues()) {
  process.exit(1) // Block deployment
}
```

### 4. Index Convention Constant

```typescript
// lib/constants/sitemap.ts
export const TIER_START_INDEX = 0
```

---

## Related Documents

- [Sitemap Architecture Spec](../SITEMAP_ARCHITECTURE.md)
- [GSC 14-Day Playbook](../GSC_SITEMAP_14DAY_PLAYBOOK.md)
- [Fix Commit: d3558f12](https://github.com/junpengpanchina-ai/Sora-2Ai/commit/d3558f12)

---

## Closing Thoughts

> If your sitemap is technically valid but semantically empty, Google will trust you — and index nothing.

This bug was invisible to:
- ✅ XML validators
- ✅ HTTP status checks
- ✅ GSC "status" indicator
- ✅ Deployment pipelines

It was only visible to:
- 🔍 Actually counting URLs in the XML
- 🔍 Checking which chunk the index references
- 🔍 Understanding the routing architecture

**The fix was trivial. The diagnosis was not.**

---

*Post-mortem by: Engineering Team*
*Date: January 24, 2026*
