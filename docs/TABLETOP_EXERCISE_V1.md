# Sora2 Tabletop Exercise v1

> **Version**: 1.0  
> **Last Updated**: 2026-01-24  
> **Classification**: Internal Only  
> **Type**: Resilience Validation (Not Load Test)

---

## Purpose

Validate that the **4 Engineering Invariants** hold under extreme upstream failure conditions.

This is a **mental walkthrough + code path verification**, not a production stress test.

---

## The 4 Invariants Being Tested

| # | Invariant | Must Hold |
|---|-----------|-----------|
| 1 | At-most-once execution via `request_id` | ✓ |
| 2 | `reserved = settled + refunded` | ✓ |
| 3 | Per-item success/failure billing | ✓ |
| 4 | No manual override on billing | ✓ |

> **If all 4 hold under extreme failure, the system is sound.**  
> **If any breaks, that is the ONLY valid input for v1.1.**

---

## Pre-Exercise Checklist

- [ ] Review `ENGINEERING_GUARANTEES.md`
- [ ] Have access to batch worker code
- [ ] Have access to RPC functions (freeze/settle/refund)
- [ ] Understand webhook retry logic
- [ ] Prepare note-taking template

---

# Scenario 1: 100% Upstream Timeout

## Setup

```
Batch: 10 items
Upstream: All requests timeout
Retry: Max retries exhausted
```

## Expected Behavior

| Step | Expected |
|------|----------|
| Batch created | `status: pending`, credits reserved |
| All items timeout | Each item → `failed`, `failure_type: timeout` |
| Batch completes | `status: failed` |
| Ledger | `reserved = refunded`, `settled = 0` |
| Webhook | `batch.completed` or `batch.failed` sent |

## Verification Checklist

- [ ] Batch final status is `failed`
- [ ] No items marked `succeeded`
- [ ] No credits settled (settled = 0)
- [ ] All reserved credits refunded
- [ ] Ledger invariant: `reserved = settled + refunded`
  - Expected: `100 = 0 + 100` ✓
- [ ] Webhook payload matches ledger exactly
- [ ] No upstream error messages leaked to customer

## Customer-Visible Outcome

- [ ] Billing correctness: Zero charge for zero success
- [ ] Explanation clarity: "All items failed due to timeout"
- [ ] No action required: Customer can retry with new request_id

## Result

```
[ ] PASS - All invariants hold
[ ] FAIL - Invariant violated: _______________
```

---

# Scenario 2: Partial Success (63/100)

## Setup

```
Batch: 100 items
Upstream: 63 succeed, 37 fail (mixed timeout/model_error)
```

## Expected Behavior

| Step | Expected |
|------|----------|
| Batch created | 1000 credits reserved (10 per item) |
| 63 succeed | 63 items → `succeeded`, videos generated |
| 37 fail | 37 items → `failed`, various failure_types |
| Batch completes | `status: partial` |
| Ledger | `reserved(1000) = settled(630) + refunded(370)` |

## Verification Checklist

- [ ] Item-level status accurate (63 succeeded, 37 failed)
- [ ] Batch summary matches:
  ```json
  {
    "total": 100,
    "succeeded": 63,
    "failed": 37
  }
  ```
- [ ] Ledger entries exist for:
  - [ ] Initial reserve (-1000)
  - [ ] Settle for successes (-630 from reserve)
  - [ ] Refund for failures (+370)
- [ ] Invariant: `1000 = 630 + 370` ✓
- [ ] Webhook `ledger` object matches database ledger
- [ ] Each failed item has valid `failure_type` (enum, not raw error)

## Customer-Visible Outcome

- [ ] Billing correctness: Charged for 63, refunded for 37
- [ ] Explanation clarity: Each failed item has clear reason
- [ ] No action required: Refunds automatic, no support ticket needed

## Result

```
[ ] PASS - All invariants hold
[ ] FAIL - Invariant violated: _______________
```

---

# Scenario 3: Upstream 5xx Chaos

## Setup

```
Batch: 20 items
Upstream: Random mix of:
- 500 Internal Server Error
- 502 Bad Gateway
- 503 Service Unavailable
- Unknown JSON responses
- Connection reset
```

## Expected Behavior

All upstream errors MUST map to Sora2-defined failure reasons.

| Upstream Error | Sora2 Mapping |
|----------------|---------------|
| 500/502/503 | `model_error` |
| Timeout | `timeout` |
| Invalid response | `model_error` |
| Connection reset | `network` |

## Verification Checklist

- [ ] No raw upstream error messages in:
  - [ ] API response
  - [ ] Webhook payload
  - [ ] Customer-visible logs
- [ ] All `failure_type` values are from enum:
  - `model_error`, `param_error`, `timeout`, `network`, `unknown`
- [ ] No upstream provider names appear anywhere
- [ ] Ledger still balances despite chaos
- [ ] Batch reaches terminal state (not stuck)
- [ ] **Responsibility boundary preserved**:
  - All failures attributed to Sora2-defined reasons
  - No "this is upstream's fault" in any customer-facing output

## Customer-Visible Outcome

- [ ] Billing correctness: Customer charged only for successes
- [ ] Explanation clarity: Failure reasons are actionable
- [ ] No action required: Customer doesn't need to debug upstream

## Result

```
[ ] PASS - All errors properly abstracted
[ ] FAIL - Upstream leak detected: _______________
```

---

# Scenario 4: Webhook Delivery Failure

## Setup

```
Batch: 10 items, all succeed
Webhook endpoint: Returns 500 for all attempts
Retry: All 5 retries fail
```

## Critical Question

> Does webhook failure affect the ledger?

**Answer MUST be: NO**

## Verification Checklist

- [ ] Batch completes successfully (`status: succeeded`)
- [ ] All 10 items settled
- [ ] Ledger: `reserved(100) = settled(100) + refunded(0)` ✓
- [ ] Webhook status: `failed` (recorded, not affecting batch)
- [ ] Credits NOT rolled back due to webhook failure
- [ ] Customer can query batch status via API (source of truth)

## Key Principle

```
Webhook = Notification (best-effort)
Ledger = Truth (guaranteed)

Webhook failure ≠ Transaction failure
```

## Customer-Visible Outcome

- [ ] Billing correctness: Full charge for full success
- [ ] Explanation clarity: Webhook failure logged, not customer's problem
- [ ] No action required: Customer queries API for truth

## Result

```
[ ] PASS - Ledger unaffected by webhook failure
[ ] FAIL - Ledger incorrectly modified: _______________
```

---

# Scenario 5: Idempotency Under Fire

## Setup

```
request_id: "stress-test-001"
Action: Send createBatch 3 times with same request_id
Timing: 
  - Request 1: Sent, batch created, processing starts
  - Request 2: Sent while batch is running
  - Request 3: Sent after batch completes
```

## Expected Behavior

| Request | Expected Response |
|---------|-------------------|
| 1 | New batch created, `idempotent_replay: false` |
| 2 | Same batch returned, `idempotent_replay: true` |
| 3 | Same batch returned, `idempotent_replay: true` |

## Verification Checklist

- [ ] Only ONE batch exists in database
- [ ] Only ONE reserve entry in ledger
- [ ] Batch ID identical across all 3 responses
- [ ] No duplicate credit charges
- [ ] State machine not corrupted by concurrent requests
- [ ] Final batch state is correct (not reset by replay)

## Stress Variant (Optional)

```
Send 10 concurrent requests with same request_id
Verify: Still only 1 batch, 1 reserve
```

## Customer-Visible Outcome

- [ ] Billing correctness: Single charge regardless of retries
- [ ] Explanation clarity: Same batch_id returned
- [ ] No action required: Safe to retry on network failure

## Result

```
[ ] PASS - At-most-once execution guaranteed
[ ] FAIL - Duplicate detected: _______________
```

---

# Scenario 6: Mid-Batch System Restart (Bonus)

## Setup

```
Batch: 50 items
State: 20 items processed (15 success, 5 fail)
Event: Worker process crashes/restarts
```

## Expected Behavior

After restart:
- Remaining 30 items should be processed
- Already-processed items NOT reprocessed
- Ledger entries NOT duplicated
- Final state correct

## Verification Checklist

- [ ] No duplicate video generations
- [ ] No duplicate ledger entries
- [ ] Final count: 50 items processed exactly once
- [ ] Invariant holds after recovery

## Customer-Visible Outcome

- [ ] Billing correctness: No duplicate charges after restart
- [ ] Explanation clarity: Batch completes normally
- [ ] No action required: Customer unaware of internal restart

## Result

```
[ ] PASS - Recovery maintains invariants
[ ] FAIL - State corruption detected: _______________
```

---

# Exercise Output Template

```markdown
# Sora2 Tabletop Exercise Report

**Date**: _______________
**Participants**: _______________
**Duration**: _______________

## Scenario Results

| Scenario | Result | Notes |
|----------|--------|-------|
| 1. 100% Timeout | PASS / FAIL | |
| 2. Partial Success | PASS / FAIL | |
| 3. 5xx Chaos | PASS / FAIL | |
| 4. Webhook Failure | PASS / FAIL | |
| 5. Idempotency | PASS / FAIL | |
| 6. Mid-Batch Restart | PASS / FAIL | |

## Invariant Status

| Invariant | Status |
|-----------|--------|
| At-most-once execution | ✓ / ✗ |
| reserved = settled + refunded | ✓ / ✗ |
| Per-item billing | ✓ / ✗ |
| No manual override | ✓ / ✗ |

## Violations Found

(Only if any FAIL)

```
Scenario: ___
Invariant: ___
Description: ___
Evidence: ___
```

## Follow-up Actions

- [ ] (Only if invariant violated)
- [ ] 

## Conclusion

[ ] All invariants hold — System is resilient
[ ] Invariant violation found — v1.1 scope identified
```

---

# Post-Exercise Decision Tree

```
All scenarios PASS
    │
    └─→ System validated
        │
        └─→ Ready for real Pilot
        └─→ DO NOT add features "just in case"

Any scenario FAIL
    │
    └─→ Identify which invariant broke
        │
        └─→ This becomes v1.1 scope
        └─→ Fix before ANY customer contact
```

---

# One Rule

```
The only valid reason to change the system
is an invariant violation discovered in this exercise
or in production.

"Nice to have" is not a valid reason.
```

---

# Cooling Period Rule

After a **PASS** exercise:

```
- No architecture changes for 14 days
- No feature additions "just in case"
- No "improvements" without real failure data
```

The system has earned the right to be left alone.

> **Resist the urge to optimize what already works.**

---

*Document Version: 1.1 | Last Updated: 2026-01-24*
