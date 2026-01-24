# Enterprise Service Level Agreement (SLA) Template

> **用途**：Enterprise 服务等级协议
> **定位**：只承诺我们能控制的
> **语言**：English

---

## SERVICE LEVEL AGREEMENT

**Effective Date**: [Date]
**Associated MSA**: [MSA Reference]

---

## 1. SCOPE

This Service Level Agreement ("SLA") applies to Enterprise Services provided under the Master Service Agreement. This SLA defines Provider's service commitments and Customer's remedies for service failures.

**Important**: This SLA covers system availability and performance only. SEO outcomes, search engine behavior, and indexing results are expressly excluded.

---

## 2. SERVICE AVAILABILITY

### 2.1 Availability Commitment

| Service | Target Availability |
|---------|---------------------|
| Batch API | 99.5% |
| Dashboard | 99.5% |
| Video Generation API | 99.5% |

### 2.2 Measurement

Availability is measured monthly as:

```
Availability % = (Total Minutes - Downtime Minutes) / Total Minutes × 100
```

### 2.3 Exclusions from Downtime

The following are not counted as downtime:
- Scheduled maintenance (with 48h notice)
- Force majeure events
- Customer-caused outages
- Third-party service failures outside Provider's control
- SEO-related scaling freezes (these are protective measures, not outages)

---

## 3. PERFORMANCE METRICS

### 3.1 API Response Time

| Metric | Target |
|--------|--------|
| Batch API p95 latency | < 5 seconds |
| Dashboard page load | < 3 seconds |

### 3.2 Batch Processing

| Metric | Target |
|--------|--------|
| Batch completion rate | 99% |
| Batch processing time | Per Order Form specifications |

### 3.3 Dashboard Data

| Metric | Target |
|--------|--------|
| Index Health Metrics update | Daily |
| Alert notification delay | < 1 hour |

---

## 4. SEO INFRASTRUCTURE SLA

### 4.1 What We Commit To

Provider commits to:

(a) **Visibility**: Index Health Metrics visible in Dashboard within 24 hours of data availability from search engines

(b) **Scaling Gate**: Automatic scaling controls active and functional

(c) **Sitemap Integrity**: Integrity checks executed before each deployment

(d) **Alerts**: Risk alerts generated and delivered within 1 hour of detection

### 4.2 What We Expressly Do NOT Commit To

The following are NOT covered by this SLA:

- Index Rate values or targets
- Number of pages indexed
- Search rankings or positions
- Organic traffic levels
- Revenue or conversion outcomes
- Search engine algorithm behavior

### 4.3 SEO Risk Controls

Automatic suspension of Scaling Activities due to SEO risk detection:
- Is a protective feature, not a service failure
- Does not count as downtime
- Does not trigger SLA credits
- Is in Customer's best interest

---

## 5. INCIDENT CLASSIFICATION & RESPONSE

### 5.1 Severity Levels

| Severity | Definition | Response Target |
|----------|------------|-----------------|
| **Critical** | Complete service unavailability | 4 hours |
| **High** | Significant degradation affecting core functions | 8 hours |
| **Medium** | Limited functionality impact | 24 hours |
| **Low** | Minor issues, workaround available | 72 hours |

### 5.2 SEO Alerts Classification

SEO-related alerts (Index Rate drops, scaling freezes) are classified as:
- **Informational notifications**, not service incidents
- Provided for Customer awareness and decision-making
- Do not trigger incident response obligations

---

## 6. SERVICE CREDITS

### 6.1 Eligibility

Service credits apply only to system availability failures, not SEO outcomes.

| Monthly Availability | Credit |
|---------------------|--------|
| 99.0% - 99.5% | 5% of monthly fee |
| 95.0% - 99.0% | 10% of monthly fee |
| < 95.0% | 25% of monthly fee |

### 6.2 Credit Limits

- Maximum credit per month: 25% of monthly fee
- Credits are applied to future invoices, not refunded
- Credits require written request within 30 days

### 6.3 Exclusions

Service credits do NOT apply to:
- SEO-related scaling freezes
- Index Health Metric changes
- Search engine behavior
- Scheduled maintenance
- Customer-caused issues

---

## 7. CUSTOMER RESPONSIBILITIES

### 7.1 For SLA to Apply

Customer must:
- Report incidents through designated channels
- Provide reasonable cooperation in troubleshooting
- Maintain current contact information
- Not circumvent SEO safety mechanisms

### 7.2 Actions That Void SLA

SLA commitments are void if Customer:
- Violates Acceptable Use Policy
- Bypasses Scaling Gate controls
- Fails to apply recommended updates
- Uses services for prohibited purposes

---

## 8. SUPPORT

### 8.1 Support Channels

| Channel | Availability |
|---------|--------------|
| Email | 24/7 |
| Dashboard tickets | 24/7 |
| Phone (Enterprise Scale only) | Business hours |

### 8.2 Support Scope

Support includes:
- Technical troubleshooting
- API integration assistance
- Dashboard usage guidance
- SEO Infrastructure explanations

Support does NOT include:
- SEO strategy consulting
- Content optimization advice
- Guaranteed outcomes

---

## 9. REPORTING

### 9.1 Availability Reports

Provider will make monthly availability reports available in Dashboard.

### 9.2 Index Health Reports

Index Health Metrics are available in real-time via Dashboard. Historical data retained for 90 days minimum.

---

## 10. SLA REVIEW

This SLA may be updated by Provider with 30 days notice. Material changes that reduce service levels require Customer consent.

---

## SUMMARY TABLE

| What We Commit To | What We Don't Commit To |
|-------------------|------------------------|
| ✅ API availability (99.5%) | ❌ Index Rate values |
| ✅ Dashboard availability | ❌ Pages indexed |
| ✅ Batch completion rate | ❌ Search rankings |
| ✅ Daily metrics updates | ❌ Traffic levels |
| ✅ Alert notifications | ❌ Revenue outcomes |
| ✅ Scaling Gate functionality | ❌ Algorithm behavior |

---

## KEY STATEMENT

```
This SLA covers what we can control.
SEO outcomes depend on third parties and are not guaranteed.
```

---

*Template Version: 1.0 | Created: January 2026*
*Note: This template is for reference. Consult legal counsel before use.*
