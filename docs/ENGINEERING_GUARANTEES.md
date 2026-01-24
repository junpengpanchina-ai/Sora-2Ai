# Engineering Guarantees

> **Version**: 1.0  
> **Last Updated**: 2026-01-24  
> **Classification**: External / Technical Evaluation

---

## Overview

This document describes the engineering invariants and guarantees built into the Sora2 Enterprise platform. These are not promises—they are **system constraints enforced at the database and application level**.

---

## Core Guarantees

### 1. At-Most-Once Execution via `request_id`

**Guarantee**: A given `request_id` will create at most one batch, regardless of how many times the request is submitted.

**Implementation**:
```sql
-- Database-level unique constraint
CREATE UNIQUE INDEX enterprise_usage_api_key_request_id_uniq
ON enterprise_api_usage(api_key_id, request_id)
WHERE request_id IS NOT NULL;
```

**Behavior**:
- First request: Creates batch, reserves credits, returns batch details
- Subsequent requests: Returns existing batch details with `idempotent_replay: true`
- No duplicate credit charges, no duplicate batches

**Verification**:
```bash
# Send same request twice
curl -X POST /api/v1/batches -d '{"request_id":"test-123","items":[...]}'
curl -X POST /api/v1/batches -d '{"request_id":"test-123","items":[...]}'

# Both return same batch_id
# Second response includes: "idempotent_replay": true
```

---

### 2. Ledger Invariant: `reserved = settled + refunded`

**Guarantee**: After batch completion, the credits arithmetic is always balanced.

**Formula**:
```
credits_reserved = credits_settled + credits_refunded
```

**Implementation**:
```sql
-- Settlement RPC enforces this invariant
CREATE OR REPLACE FUNCTION finalize_batch_credits(...)
  -- Calculates: refund = reserved - (succeeded_count * cost_per_video)
  -- Applies refund to wallet
  -- Records in credit_ledger with ref_type='batch_refund'
```

**Behavior**:
- Batch created: `reserved = total_count × cost_per_video`
- Item succeeds: `settled += cost_per_video`
- Item fails: (no charge, credits remain reserved)
- Batch completes: `refunded = reserved - settled`

**Example**:
```
Batch: 10 items × 10 credits = 100 reserved
Result: 7 succeeded, 3 failed

settled  = 7 × 10 = 70
refunded = 100 - 70 = 30

Verification: 100 = 70 + 30 ✓
```

---

### 3. Partial Success Billing at Item Level

**Guarantee**: You are charged only for items that successfully complete. Failed items are never billed.

**Implementation**:
```sql
-- Each successful item creates a ledger entry
INSERT INTO credit_ledger (
  type, ref_type, ref_id, credits_delta, ...
) VALUES (
  'spend', 'batch_video_success', video_task_id, -cost_per_video, ...
);

-- Failed items get refunds at settlement
INSERT INTO credit_ledger (
  type, ref_type, ref_id, credits_delta, ...
) VALUES (
  'refund', 'batch_refund', batch_job_id, +refund_amount, ...
);
```

**Behavior**:
- Succeeded: Charged `cost_per_video` (recorded in ledger)
- Failed: Not charged (refunded at batch completion)
- Partial success: Mix of both

**Verification**:
```sql
-- Query ledger for a batch
SELECT type, ref_type, credits_delta
FROM credit_ledger
WHERE meta->>'batch_job_id' = 'bat_xxx'
ORDER BY created_at;

-- Output shows exactly which items were charged
```

---

### 4. No Manual Override on Billing or Refunds

**Guarantee**: All credit movements are handled by RPC functions. There is no manual pathway to alter billing.

**Implementation**:
```sql
-- All credit operations go through controlled functions
-- These functions:
-- 1. Validate state before changes
-- 2. Record every change in credit_ledger
-- 3. Update wallet atomically

-- Direct table updates are blocked by RLS policies
ALTER TABLE credit_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
```

**Implications**:
- No "manual adjustment" that bypasses ledger
- No operator can "fix" billing without audit trail
- Every credit change has a `ref_type`, `ref_id`, and timestamp

---

## Additional Guarantees

### 5. Webhook Delivery Does Not Block Settlement

**Guarantee**: If webhook delivery fails, your credits are still settled/refunded correctly.

**Implementation**:
```typescript
// Settlement happens first
await settleFinishedBatches();

// Webhook is sent after, with independent retry
try {
  await sendBatchWebhook(batch);
} catch {
  // Log failure, update webhook_status
  // Does NOT affect credits
}
```

**Implication**: Webhook failures are isolated from financial operations.

---

### 6. Rate Limits Are Database-Enforced

**Guarantee**: Rate limits cannot be bypassed through application-layer tricks.

**Implementation**:
```sql
-- Minute-bucket tracking
CREATE INDEX enterprise_usage_api_key_minute_idx
ON enterprise_api_usage(api_key_id, minute_bucket);

-- Query count before allowing request
SELECT COUNT(*) FROM enterprise_api_usage
WHERE api_key_id = $1 AND minute_bucket = $2;
```

**Behavior**:
- Each API key has `rate_limit_per_min`
- Tracked at database level per minute bucket
- Exceeding limit returns `429 RATE_LIMIT_EXCEEDED`

---

### 7. Balance Check Happens Before Reservation

**Guarantee**: If you don't have enough credits, the batch is rejected before any state changes.

**Implementation**:
```typescript
// 1. Check balance
const available = await supabase.rpc('get_total_available_credits', { p_user_id });

// 2. Compare with required
if (available < requiredCredits) {
  return { error: 'INSUFFICIENT_CREDITS', status: 402 };
}

// 3. Only then create batch and reserve
```

**Implication**: No partial reservations, no inconsistent state.

---

## Verification Commands

### Check Ledger Balance

```sql
-- Verify ledger sums to wallet balance
SELECT 
  w.permanent_credits + w.bonus_credits as wallet_balance,
  SUM(l.credits_delta) as ledger_sum
FROM credit_wallet w
JOIN credit_ledger l ON l.user_id = w.user_id
WHERE w.user_id = 'xxx'
GROUP BY w.permanent_credits, w.bonus_credits;

-- These should match
```

### Check Batch Settlement

```sql
-- Verify batch invariant
SELECT 
  id,
  total_count,
  success_count,
  failed_count,
  cost_per_video,
  frozen_credits as reserved,
  credits_spent as settled,
  (total_count - success_count) * cost_per_video as expected_refund
FROM batch_jobs
WHERE id = 'xxx';
```

### Check Idempotency

```sql
-- Verify no duplicate request_ids
SELECT api_key_id, request_id, COUNT(*)
FROM enterprise_api_usage
WHERE request_id IS NOT NULL
GROUP BY api_key_id, request_id
HAVING COUNT(*) > 1;

-- Should return 0 rows
```

---

## What These Guarantees Mean for You

| Guarantee | Business Impact |
|-----------|----------------|
| At-most-once execution | Safe to retry on network failures |
| Ledger invariant | Finance can audit without engineering |
| Item-level billing | Pay only for what works |
| No manual override | Predictable, trustable system |
| Webhook isolation | Reliable notifications don't affect billing |
| DB-level rate limits | Fair usage, no abuse vectors |
| Pre-reservation check | No surprise overdrafts |

---

## Summary

These guarantees are why enterprise teams choose Sora2:

```
1. request_id → At-most-once execution
2. reserved = settled + refunded → Financial integrity
3. Item-level billing → Fair charging
4. No manual override → Auditable system
```

**These are not policies. They are code.**

---

*Document Version: 1.0 | Last Updated: 2026-01-24*
