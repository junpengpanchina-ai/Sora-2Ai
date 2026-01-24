# Sora2 Enterprise Pilot — Onboarding Checklist

> **Version**: 1.0  
> **Last Updated**: 2026-01-24  
> **Classification**: Internal + Customer-Facing

---

## Objective

Enable an Enterprise team to complete the full **Batch → Webhook → Ledger reconciliation** loop within **48 hours**.

---

## 1. Pilot Success Criteria (Define First)

Pilot = **SUCCESS** if and only if all three conditions are met:

| # | Condition | Verified By |
|---|-----------|-------------|
| 1 | Successfully run **at least 1 Batch** | Engineering |
| 2 | Customer system receives **`batch.completed` webhook** | Engineering |
| 3 | Finance can verify: **`reserved = settled + refunded`** | Finance |

**Not success criteria:**
- Subjective quality assessment
- Generation success rate
- "Looks good" feedback

**Success = System is trustable, controllable, and auditable.**

---

## 2. Pre-Pilot Preparation (Internal)

### Internal Checklist (Must Confirm)

- [ ] `/docs/enterprise` is accessible
- [ ] `/openapi.json` is accessible
- [ ] Node example `batch_basic.ts` runs locally
- [ ] Internal webhook test endpoint receives events
- [ ] Credits ledger is visible in dashboard

> **Rule**: If you can't complete the flow in 10 minutes, don't onboard the customer yet.

---

## 3. Day 0 — Pilot Activation

### 3.1 Deliverables to Customer

| Item | Description |
|------|-------------|
| **Pilot API Key** | Scoped permissions, prepaid credits |
| **Webhook Configuration Guide** | HTTPS endpoint setup |
| **Node.js Example** | `examples/node/batch_basic.ts` |
| **Pilot Boundary Statement** | See below |

### 3.2 Pilot Boundary Statement (Use Verbatim)

```
This pilot runs on a best-effort basis with prepaid credits.
Failed items are automatically refunded.
No SLA is included at this stage.
```

### 3.3 Customer Prerequisites

- [ ] HTTPS webhook endpoint configured
- [ ] Ability to log/store raw webhook payloads
- [ ] Unique `request_id` prepared (any string)

---

## 4. Pilot Execution (48 Hours)

### Step 1: Create Batch

**Method**: UI or API (customer choice)

**Parameters**:
- Batch size: 10–50 items (not 1000)
- Each item has distinguishable metadata
- Use `request_id` for idempotency

**Success Signal**:
```json
{
  "ok": true,
  "batch_id": "bat_xxx",
  "status": "pending"
}
```

### Step 2: Observe Status Flow

Customer should witness at least one of:

```
pending → running → succeeded
```

or

```
running → failed → refunded
```

**Guidance**: Share dashboard link or polling instructions.

### Step 3: Webhook Verification (Critical)

Customer system **must** receive:

```json
{
  "event": "batch.completed",
  "batch_id": "bat_xxx",
  "request_id": "order-123",
  "summary": {
    "total": 10,
    "succeeded": 9,
    "failed": 1
  },
  "ledger": {
    "reserved": 100,
    "settled": 90,
    "refunded": 10
  },
  "timestamp": "2026-01-24T10:00:00Z"
}
```

**Required fields customer must confirm**:
- [ ] `batch_id`
- [ ] `summary.total`, `succeeded`, `failed`
- [ ] `ledger.reserved`, `settled`, `refunded`
- [ ] `timestamp`

> This is the moment CTO + Finance nod simultaneously.

### Step 4: Ledger Reconciliation (Finance)

Guide customer to verify:

| Entry | Value |
|-------|-------|
| Reserved (initial) | 100 |
| Settled (success) | 90 |
| Refunded (failures) | 10 |

**Mathematical Invariant**:

```
reserved = settled + refunded
100 = 90 + 10 ✓
```

---

## 5. Post-Pilot Review (Day 2–3)

### Questions to Ask

**Engineering**:
- Which step was most confusing?
- Which field was unclear?
- What additional webhook events would help?

**Ops / Finance**:
- Is the ledger clear?
- Can you export for reconciliation?
- Any "unexplained money"?

### Questions NOT to Ask

- "Did you like it?"
- "Was the quality good?"
- "Would you recommend us?"

---

## 6. Pilot Failure Definition

Pilot = **FAILURE** if any of the following occur:

| # | Failure Condition |
|---|-------------------|
| 1 | Customer fails to run 1 batch within 48 hours |
| 2 | Webhook reception fails or is misunderstood |
| 3 | Finance cannot complete reconciliation |
| 4 | Customer questions: "Is Demo the same as API?" |

> **Failure ≠ Bad**  
> **Failure = Real input for v1.1**

---

## 7. Upgrade Signals (Observe, Don't Push)

Record but do not initiate:

| Signal | Meaning |
|--------|---------|
| "Can concurrency be higher?" | Scale need |
| "Can we get another webhook event?" | Integration depth |
| "Do we need a contract / SLA?" | **State machine transition** |

> When the third question appears: **Pilot → Enterprise** state change.

---

## 8. Do-Not-Do List (Critical)

| Do Not | Reason |
|--------|--------|
| ❌ Promise SLA | Not in pilot scope |
| ❌ Promise success rate | Model-dependent |
| ❌ Promise SEO/traffic results | Out of scope |
| ❌ Discuss long-term contracts | Premature |
| ❌ Modify system invariants for one customer | Breaks trust foundation |

---

## 9. Customer-Facing Quick Reference

### For Engineering Lead

```
Day 0: Get API key, set up webhook endpoint
Day 1: Run first batch (10-50 items)
Day 1: Verify webhook receipt
Day 2: Check ledger matches webhook
Day 2: Share feedback
```

### For Finance

```
1. Note credits balance before batch
2. After batch completes, check:
   - Reserved amount
   - Settled amount (successful items)
   - Refunded amount (failed items)
3. Verify: reserved = settled + refunded
```

---

## 10. Summary

```
Pilot is not about closing a deal.
Pilot is about validating:
Whether this system deserves larger-scale trust.
```

---

## Appendix: Pilot Communication Templates

### Initial Email

```
Subject: Sora2 Enterprise Pilot — Getting Started

Hi [Name],

Your pilot access is ready. Here's what you need:

1. API Key: [attached securely]
2. Docs: https://sora2aivideos.com/docs/enterprise
3. Node example: https://github.com/sora2aivideos/examples

Pilot terms:
- Best-effort, prepaid credits
- Failed items auto-refund
- No SLA at this stage

Goal: Run 1 batch, receive webhook, verify ledger.
Timeline: 48 hours to first success.

Let me know when your webhook endpoint is ready.

[Your name]
```

### Success Confirmation

```
Subject: Pilot Complete ✓

Hi [Name],

Confirmed:
- Batch [batch_id] completed
- Webhook received
- Ledger verified: reserved = settled + refunded

Next: Let's schedule a 15-min review call.

Questions to think about:
1. Which step was hardest?
2. What would help your finance team?
3. What else would you need before scaling?

[Your name]
```

---

*Document Version: 1.0 | Last Updated: 2026-01-24*
