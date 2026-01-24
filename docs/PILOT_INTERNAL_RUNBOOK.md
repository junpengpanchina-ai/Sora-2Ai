# Sora2 Pilot — Internal Execution Runbook

> **Version**: 1.1  
> **Last Updated**: 2026-01-24  
> **Classification**: Internal Only

---

## Purpose

Step-by-step execution guide for running a Pilot with an Enterprise customer.  
This is the operational playbook, not the customer-facing checklist.

---

## Phase 0: Pre-Qualification (Before Pilot)

### Qualification Criteria

Accept pilot if:
- [ ] Company has engineering team (not just marketing)
- [ ] Clear use case (batch video generation)
- [ ] Willing to set up webhook endpoint
- [ ] Budget expectation aligned ($500–$5000 pilot)

Reject pilot if:
- [ ] Wants guaranteed success rate
- [ ] Expects SLA without contract
- [ ] No technical contact
- [ ] "Just want to try it out" without use case

### Expectation Lock (Must Confirm Before Proceeding)

- [ ] Customer explicitly understands:
  - We orchestrate multiple generation providers internally
  - Success/failure is determined at item level
  - We guarantee execution, billing, and refunds — not model output quality

### Internal Preparation

```bash
# 1. Verify your own system works
cd examples/node
export SORA2_API_KEY="your-internal-test-key"
npx ts-node batch_basic.ts

# 2. Verify webhook endpoint
curl -X POST https://your-test-endpoint.com/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"test"}'

# 3. Check dashboard access
# - Can you see ledger?
# - Can you see batch history?
```

---

## Upstream Abstraction Rule (Internal)

> **This section is the most important guardrail in this document.**

| Rule | Rationale |
|------|-----------|
| Never expose upstream provider names | Customer debugs against Sora2, not OpenAI/Google |
| Never expose upstream model IDs | Prevents lock-in to specific upstream |
| Never forward raw upstream error messages | All errors map to Sora2-defined failure reasons |
| Never discuss upstream SLA/pricing | Our contract is the only contract |

### If Customer Asks "What's Your Backend?"

Standard response (memorize):

> We orchestrate multiple video generation providers internally.  
> What we guarantee is deterministic execution, billing, and refunds —  
> independent of any single model provider.

### Failure Reason Mapping

| Upstream Error | Sora2 Failure Reason |
|----------------|---------------------|
| Model timeout | `timeout` |
| Content policy violation | `param_error` |
| Model capacity exceeded | `timeout` (retry) |
| Unknown/5xx | `model_error` |

---

## Phase 1: Day 0 — Activation

### Step 1: Create Pilot API Key

```sql
-- In Supabase dashboard or via admin API
INSERT INTO enterprise_api_keys (
  user_id,
  key_hash,
  name,
  rate_limit_per_min,
  is_active
) VALUES (
  'pilot-customer-uuid',
  encode(sha256('ek_pilot_xxx'), 'hex'),
  'Pilot - CompanyName',
  60,
  true
);
```

### Step 2: Allocate Pilot Credits

```sql
-- Add pilot credits (e.g., 100 credits = ~10 batches)
INSERT INTO credit_ledger (
  user_id,
  type,
  ref_type,
  credits_delta,
  description
) VALUES (
  'pilot-customer-uuid',
  'add',
  'pilot_grant',
  100,
  'Enterprise Pilot - CompanyName'
);

-- Update wallet
UPDATE credit_wallet
SET permanent_credits = permanent_credits + 100
WHERE user_id = 'pilot-customer-uuid';
```

### Step 3: Send Activation Email

Use template from `PILOT_ONBOARDING_CHECKLIST.md` Appendix.

Include:
- [ ] API Key (send securely, not plain email)
- [ ] Docs link
- [ ] Example code link
- [ ] Pilot boundary statement

### Step 4: Confirm Webhook Setup

Ask customer:
```
Please confirm your webhook endpoint:
- URL: _______________
- Can receive POST requests
- Returns 200 on success
```

---

## Phase 2: Day 1 — First Batch

### Monitor Dashboard

Watch for:
- [ ] First API call (check `enterprise_api_usage`)
- [ ] First batch created (check `batch_jobs`)
- [ ] Batch status progression

### If Customer Gets Stuck

**Problem: API key not working**
```sql
-- Check key exists and is active
SELECT * FROM enterprise_api_keys
WHERE user_id = 'pilot-customer-uuid';
```

**Problem: Insufficient credits**
```sql
-- Check balance
SELECT * FROM credit_wallet
WHERE user_id = 'pilot-customer-uuid';

-- Check ledger
SELECT * FROM credit_ledger
WHERE user_id = 'pilot-customer-uuid'
ORDER BY created_at DESC
LIMIT 10;
```

**Problem: Webhook not receiving**
```bash
# Check webhook_url in batch
SELECT id, webhook_url, webhook_status
FROM batch_jobs
WHERE user_id = 'pilot-customer-uuid'
ORDER BY created_at DESC
LIMIT 5;

# Check webhook attempts in logs
```

### Success Checkpoint

Customer confirms:
- [ ] Batch created successfully
- [ ] Can see status in API response
- [ ] Webhook endpoint received at least 1 event

---

## Phase 3: Day 1–2 — Verification

### Ledger Reconciliation Check

```sql
-- For specific batch
SELECT 
  id,
  total_count,
  success_count,
  failed_count,
  cost_per_video,
  frozen_credits as reserved,
  credits_spent as settled,
  (frozen_credits - credits_spent) as refunded
FROM batch_jobs
WHERE id = 'batch-id-xxx';

-- Verify invariant
-- reserved = settled + refunded
```

### Customer Confirmation

Get explicit confirmation:
- [ ] Engineering: "Webhook received and parsed"
- [ ] Finance: "Ledger numbers make sense"

---

## Phase 4: Day 2–3 — Review

### Schedule Review Call

15–30 minutes, focus on:

1. **Friction points**
   - "Where did you get stuck?"
   - "What documentation was missing?"

2. **Technical gaps**
   - "What fields were confusing?"
   - "What events would help?"

3. **Scale signals**
   - Listen for concurrency questions
   - Listen for SLA questions
   - Listen for contract questions

### Document Feedback

Create internal note:
```
Customer: [Name]
Pilot Date: [Date]
Batch Count: [N]
Success Rate: [X/Y]

Friction Points:
- ...

Feature Requests:
- ...

Upgrade Signals:
- [ ] Concurrency request
- [ ] Webhook event request
- [ ] SLA/Contract request
```

---

## Phase 5: Post-Pilot Decision

### Pilot → Success Path

If all 3 success criteria met:
1. Send success confirmation email
2. Ask about next steps (their initiative)
3. Wait for upgrade signals

### Pilot → Failure Path

If any failure condition:
1. Document specific failure reason
2. Determine if fixable (your side or their side)
3. Decide: retry or close

**Fixable (your side)**:
- Documentation unclear → improve docs
- API confusing → add to v1.1 backlog

**Fixable (their side)**:
- Webhook not set up → offer help
- No engineering bandwidth → suggest later retry

**Not fixable**:
- No real use case → politely close
- Expects guarantees you can't give → politely close

---

## Escalation Triggers

### P0 Incident (Immediate Action Required)

**Demo/API Divergence (Most Critical)**

If demo output and API output differ under the same batch parameters:
- Treat as **P0 incident**
- Pause pilot immediately
- Investigate pipeline divergence
- Do not resume until root cause identified

> This prevents the fatal trust collapse: "You showed me A, delivered B."

### P1 Incidents

- [ ] Ledger numbers don't match
- [ ] Credits charged incorrectly
- [ ] Webhook signature verification failing

### Resolution Steps

1. Pause customer activity (if needed)
2. Check system logs
3. Verify with Engineering Guarantees document
4. If system invariant violated → P0 incident

---

## Metrics to Track

### Customer-Facing Metrics

| Metric | Target |
|--------|--------|
| Time to first batch | < 24 hours |
| Webhook receipt rate | 100% |
| Ledger reconciliation success | 100% |
| Customer feedback score | Qualitative |

### Internal-Only Metrics (Never Share)

| Metric | Purpose |
|--------|---------|
| Upstream failure rate | Informational only |
| Upstream latency p50/p95 | Capacity planning |
| Provider distribution | Internal optimization |

> ⚠️ **These metrics must NOT be used as customer-facing SLA or KPI.**  
> Our contract is about execution + billing, not upstream performance.

---

## Templates

### Slack/Internal Update

```
🟢 Pilot Update - [CompanyName]

Day: [0/1/2/3]
Status: [On Track / Blocked / Complete]

Progress:
- [x] API key issued
- [x] First batch run
- [ ] Webhook verified
- [ ] Ledger reconciled

Notes: [any blockers or observations]
```

### Post-Pilot Summary

```
## Pilot Summary: [CompanyName]

**Duration**: [Date] - [Date]
**Status**: Success / Failure

**Metrics**:
- Batches run: X
- Total items: Y
- Success rate: Z%
- Credits used: N

**Feedback**:
- Friction: ...
- Requests: ...

**Upgrade signals**:
- [ ] Concurrency
- [ ] Webhook events
- [ ] SLA/Contract

**Recommendation**: [Continue / Pause / Close]
```

---

## One Rule

```
Never promise what the system doesn't guarantee.
Only the 4 invariants are promises.
Everything else is best-effort.
```

---

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-24 | Initial release |
| 1.1 | 2026-01-24 | Added: Expectation Lock, Upstream Abstraction Rule, P0 escalation, Internal metrics |

---

*Document Version: 1.1 | Last Updated: 2026-01-24*
