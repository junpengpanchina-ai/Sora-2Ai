# Webhook Events Specification

> **Version**: 1.0  
> **Last Updated**: 2026-01-24  
> **Status**: Production

---

## Overview

Sora2 sends webhook notifications for batch lifecycle events. All webhooks are signed using HMAC-SHA256 for verification.

---

## Configuration

### Setting Webhook URL

Specify `webhook_url` when creating a batch:

```json
{
  "request_id": "order-12345",
  "items": [...],
  "webhook_url": "https://your-server.com/webhook/sora2"
}
```

Or configure a default webhook URL for your API key via the Admin Dashboard.

---

## Security

### Signature Verification

All webhook requests include a signature header:

```
x-sora2-signature: sha256=abc123...
```

**Verify the signature:**

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Usage
app.post('/webhook/sora2', (req, res) => {
  const signature = req.headers['x-sora2-signature'];
  const isValid = verifyWebhook(
    JSON.stringify(req.body),
    signature,
    process.env.WEBHOOK_SECRET
  );
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook...
  res.status(200).send('OK');
});
```

### Timestamp Validation

Optionally validate the timestamp to prevent replay attacks:

```javascript
const timestamp = req.headers['x-sora2-timestamp'];
const age = Date.now() - new Date(timestamp).getTime();

if (age > 5 * 60 * 1000) { // 5 minutes
  return res.status(401).send('Webhook too old');
}
```

---

## Retry Policy

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 500ms |
| 3 | 1.5s |
| 4 | 3.5s |
| 5 | 7.5s |

- **Max attempts**: 5
- **Timeout per request**: 5 seconds
- **Expected response**: HTTP 2xx

After all retries fail, the webhook is marked as `failed` (visible in Admin Dashboard).

---

## Events

### 1. `batch.created`

Sent immediately after a batch is successfully created.

```json
{
  "event": "batch.created",
  "batch_id": "bat_abc123def456",
  "request_id": "order-12345",
  "status": "pending",
  "summary": {
    "total": 10,
    "succeeded": 0,
    "failed": 0,
    "pending": 10
  },
  "ledger": {
    "reserved": 100,
    "settled": 0,
    "refunded": 0
  },
  "timestamp": "2026-01-24T10:00:00Z"
}
```

---

### 2. `batch.running`

Sent when the batch starts processing.

```json
{
  "event": "batch.running",
  "batch_id": "bat_abc123def456",
  "request_id": "order-12345",
  "status": "running",
  "summary": {
    "total": 10,
    "succeeded": 0,
    "failed": 0,
    "pending": 10,
    "running": 3
  },
  "ledger": {
    "reserved": 100,
    "settled": 0,
    "refunded": 0
  },
  "timestamp": "2026-01-24T10:00:05Z"
}
```

---

### 3. `batch.completed`

Sent when all items are processed (success or failure).

```json
{
  "event": "batch.completed",
  "batch_id": "bat_abc123def456",
  "request_id": "order-12345",
  "status": "succeeded",
  "summary": {
    "total": 10,
    "succeeded": 9,
    "failed": 1,
    "pending": 0
  },
  "ledger": {
    "reserved": 100,
    "settled": 90,
    "refunded": 10
  },
  "items": [
    {
      "item_id": "item_001",
      "index": 0,
      "status": "succeeded",
      "video_url": "https://cdn.sora2aivideos.com/v/abc123.mp4",
      "thumbnail_url": "https://cdn.sora2aivideos.com/t/abc123.jpg",
      "metadata": {"sku": "PROD-001"}
    },
    {
      "item_id": "item_002",
      "index": 1,
      "status": "failed",
      "error": "Model timeout",
      "failure_type": "timeout",
      "metadata": {"sku": "PROD-002"}
    }
  ],
  "duration_ms": 125000,
  "timestamp": "2026-01-24T10:02:05Z"
}
```

**Status values:**
- `succeeded` - All items succeeded
- `partial` - Some items succeeded, some failed
- `failed` - All items failed

---

### 4. `batch.failed`

Sent when the entire batch fails (e.g., insufficient credits, system error).

```json
{
  "event": "batch.failed",
  "batch_id": "bat_abc123def456",
  "request_id": "order-12345",
  "status": "failed",
  "error": "INSUFFICIENT_CREDITS",
  "error_message": "Not enough credits to process batch",
  "summary": {
    "total": 10,
    "succeeded": 0,
    "failed": 0,
    "pending": 10
  },
  "ledger": {
    "reserved": 0,
    "settled": 0,
    "refunded": 0
  },
  "timestamp": "2026-01-24T10:00:01Z"
}
```

---

### 5. `batch.refunded`

Sent when credits are refunded (after batch completion or cancellation).

```json
{
  "event": "batch.refunded",
  "batch_id": "bat_abc123def456",
  "request_id": "order-12345",
  "refund_reason": "failed_items",
  "ledger": {
    "reserved": 100,
    "settled": 90,
    "refunded": 10
  },
  "refund_details": [
    {
      "item_id": "item_002",
      "index": 1,
      "credits": 10,
      "reason": "Model timeout"
    }
  ],
  "timestamp": "2026-01-24T10:02:06Z"
}
```

**Refund reasons:**
- `failed_items` - Individual items failed
- `batch_cancelled` - Batch was cancelled
- `system_error` - System-level failure

---

## Common Fields

All events include:

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type |
| `batch_id` | string | Unique batch identifier |
| `request_id` | string | Your idempotency key |
| `timestamp` | string | ISO 8601 timestamp |

---

## Summary Object

```typescript
interface Summary {
  total: number;      // Total items in batch
  succeeded: number;  // Successfully completed
  failed: number;     // Failed items
  pending: number;    // Not yet processed
  running?: number;   // Currently processing
}
```

---

## Ledger Object

```typescript
interface Ledger {
  reserved: number;   // Credits reserved at batch start
  settled: number;    // Credits charged for successful items
  refunded: number;   // Credits returned for failed items
}
```

**Invariant**: `reserved = settled + refunded` (after batch completion)

---

## Item Object

```typescript
interface Item {
  item_id: string;
  index: number;           // Position in original array
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  
  // Success fields
  video_url?: string;
  thumbnail_url?: string;
  
  // Failure fields
  error?: string;
  failure_type?: 'model_error' | 'param_error' | 'timeout' | 'network' | 'unknown';
  
  // Custom data
  metadata?: object;       // Your metadata from request
}
```

---

## Best Practices

### 1. Always verify signatures

```javascript
// ❌ Never skip verification
app.post('/webhook', (req, res) => {
  processWebhook(req.body); // UNSAFE
});

// ✅ Always verify
app.post('/webhook', (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send('Unauthorized');
  }
  processWebhook(req.body);
});
```

### 2. Respond quickly

Return 200 immediately, process asynchronously:

```javascript
app.post('/webhook', async (req, res) => {
  // Return immediately
  res.status(200).send('OK');
  
  // Process asynchronously
  await queue.add('process-webhook', req.body);
});
```

### 3. Handle idempotently

Use `batch_id` + `event` as idempotency key:

```javascript
const key = `${body.batch_id}:${body.event}`;
if (await redis.exists(key)) {
  return; // Already processed
}
await redis.set(key, '1', 'EX', 86400);
// Process...
```

### 4. Use request_id for correlation

Pass your order/job ID as `request_id` to correlate events:

```javascript
// When creating batch
const batch = await sora2.createBatch({
  request_id: `order-${orderId}`,
  items: [...]
});

// In webhook handler
app.post('/webhook', (req, res) => {
  const orderId = req.body.request_id.replace('order-', '');
  await updateOrder(orderId, req.body);
});
```

---

## Testing

### Test Endpoint

Send a test webhook to verify your setup:

```bash
curl -X POST https://api.sora2aivideos.com/v1/webhooks/test \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-server.com/webhook/sora2"}'
```

### Sample Payloads

Use these for local testing:

```bash
# batch.completed
curl -X POST http://localhost:3000/webhook/sora2 \
  -H "Content-Type: application/json" \
  -H "x-sora2-signature: sha256=test" \
  -d '{
    "event": "batch.completed",
    "batch_id": "bat_test123",
    "request_id": "order-test",
    "status": "succeeded",
    "summary": {"total": 2, "succeeded": 2, "failed": 0, "pending": 0},
    "ledger": {"reserved": 20, "settled": 20, "refunded": 0},
    "timestamp": "2026-01-24T10:00:00Z"
  }'
```

---

## Troubleshooting

### Webhook not received

1. Check URL is publicly accessible
2. Verify HTTPS certificate is valid
3. Check firewall allows incoming requests
4. Review webhook status in Admin Dashboard

### Signature verification failing

1. Use raw request body (not parsed JSON)
2. Verify secret matches dashboard value
3. Check for whitespace/encoding issues

### Duplicate webhooks

1. Implement idempotency using `batch_id` + `event`
2. Check if your server is responding with non-2xx status

---

*Document Version: 1.0 | Last Updated: 2026-01-24*
