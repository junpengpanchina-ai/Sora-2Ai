# PROMPT_PRODUCTION_SOP (Frozen v1.0)

**Project**: Sora-2Ai  
**Status**: Active  
**Phase Fit**: LOCKDOWN / Trust Ramp  
**Last Updated**: 2026-01-25  

## 1) Purpose
Define a standardized, auditable workflow to produce **Prompt assets** using Gemini models **without affecting SEO / Google indexing**.

**Prompt assets = product capability**, not SEO content.

## 2) Core Principles (Non-negotiable)
1. **Prompts are NOT SEO assets** (no “content scaling” via prompts).
2. **Prompt pages must be crawlable but non-indexable** (to avoid URL-only residue and ensure clean deindex).
3. **Prompt → Scene/Use Case upgrades are gated and data-driven** (top 1–5% only).
4. **During Trust Ramp, SEO expansion is locked** (do not change sitemap admission).
5. **Cost efficiency + stability > creativity by default**.

## 3) Model Responsibility Matrix
### Gemini 2.5 Flash — Primary Production Line (Volume)
Use for:
- High-volume prompt generation
- Structured templates + variables (placeholders)
- Categorization + tagging
- Multilingual variants (**product only**, non-SEO)

Hard requirements:
- Output **strict JSON** (or strict table)
- Must pass schema validation
- Retry on missing/invalid fields

### Gemini 3 Flash — Quality & Conversion Layer (Expression)
Use for:
- Marketing/Ads/CTA prompts
- Human-like phrasing and hooks
- A/B candidates (3–5 variants)
- Prompt Experiments candidate pool

Hard requirements:
- Copy/paste usable prompts (no long explanation)
- 3–5 light variants per request
- Preserve constraints + variables

### Gemini 3 Pro — Stability & Complex Constraints (Escalation Only)
Use only when ANY is true:
- Output fails schema **twice**
- Constraints conflict / ambiguity needs resolution
- Multi-step reasoning is required
- Safety/compliance logic must be satisfied

## 4) Prompt Asset Safety Rules (Hard)
All Prompt pages MUST:
- Emit robots directive: **noindex**
- Be excluded from **all sitemaps**
- Not act as an SEO internal-link authority node
- Use **non-semantic** URLs (ID/hash preferred) and avoid parameter variants

Explicitly forbidden:
- SEO titles/meta descriptions for prompts
- Keyword-optimized prompt slugs/URLs
- Treating prompts as public landing pages
- Putting prompt links as “primary navigation” for logged-out users

## 5) Production Workflow (A → B → C)
### Step A — Volume Generation (Gemini 2.5 Flash)
**Input**:
- Feature dimension (Ads, Onboarding, Social, Explainer, etc.)
- Model dimension (Sora-2, Veo Fast, Veo Pro)
- Locale dimension (en/zh/…)
- Constraints template (style, camera, duration, safety boundaries)

**Output** (strict schema, one record per prompt):
- Prompt entries with variables + metadata (category/tags/difficulty/locale)

### Step B — Expression Optimization (Gemini 3 Flash)
**Input**:
- Selected prompts from Step A (Top-N or sampled)

**Output**:
- Humanized “gold” versions
- 3–5 variants for A/B
- Notes on intent/angle differences (short, internal)

### Step C — Failure Resolution (Gemini 3 Pro)
**Input**:
- Failed/unstable prompt examples + failure signals (schema errors, policy blocks, low success)

**Output**:
- Root-cause analysis (internal)
- Corrected prompt
- 1–2 fallback versions

## 6) Prompt Data Schema (Minimum)
Each prompt record MUST include:
- `id` (internal)
- `title`
- `prompt`
- `category`
- `tags[]`
- `difficulty`
- `locale`

Optional (recommended):
- `variables` (placeholders + examples)
- `negative_constraints` (explicit avoid list)
- `example_output`
- `metrics` (reserved): `usage_count`, `success_rate`, `last_used_at`
- `failure_reason` (reserved): `structure_invalid | constraint_conflict | hallucinated_steps | unsafe_output`

## 7) Prompt → Scene Upgrade (Out of Scope Here)
Prompts are **NOT** eligible for SEO by default.  
Upgrade requires passing the Gate doc:
- `docs/PROMPT_TO_SCENE_GATE.md`

## 8) Enforcement (Engineering Controls)
Recommended enforcement checks (CI or pre-deploy):
- Block any Prompt URL from entering sitemaps
- Block Prompt pages missing noindex
- Block any change that re-introduces prompt search-action / SEO entrypoints

Violation policy:
- Any violation triggers **SEO expansion freeze** until resolved.

## 9) Summary
Prompt production is a **product pipeline**, not a content strategy.  
SEO integrity has priority over volume and creativity.

