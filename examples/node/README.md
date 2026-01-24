# Sora2 Node.js Examples

Minimal examples for integrating with the Sora2 Enterprise Batch API.

## Quick Start

### 1. Install dependencies

```bash
npm install typescript ts-node @types/node
```

### 2. Set your API key

```bash
export SORA2_API_KEY="your-enterprise-api-key"
```

### 3. Run the example

```bash
npx ts-node batch_basic.ts
```

## Files

| File | Description |
|------|-------------|
| `sora2-client.ts` | TypeScript client library |
| `batch_basic.ts` | Complete batch workflow example |

## Example Output

```
✅ Client initialized

💰 Credits Balance:
   Available: 5000
   Reserved:  0
   Total:     5000

📦 Creating batch with request_id: order-1706097600000

✅ Batch created:
   Batch ID:        bat_abc123def456
   Request ID:      order-1706097600000
   Status:          pending
   Total Items:     3
   Cost per Video:  10 credits
   Total Reserved:  30 credits
   Idempotent:      No (new)

⏳ Waiting for batch to complete...

   Progress: 1/3 (33%) - Status: running
   Progress: 2/3 (67%) - Status: running
   Progress: 3/3 (100%) - Status: succeeded

✅ Batch completed:
   Status:           succeeded
   Succeeded:        3
   Failed:           0
   Credits Reserved: 30
   Credits Settled:  30
   Credits Refunded: 0

📋 Item Results:

   [0] SUCCEEDED
       Prompt: A cinematic shot of a city skyline at sunset...
       Video:  https://cdn.sora2aivideos.com/v/abc123.mp4
       Thumb:  https://cdn.sora2aivideos.com/t/abc123.jpg
       Meta:   {"sku":"CITY-001"}

   [1] SUCCEEDED
       ...

📒 Ledger Entries for this batch:

   reserve  -30 → Balance: 4970
   settle   -30 → Balance: 4970

🔒 Ledger Invariant Check:
   Reserved:  -30
   Settled:   -30
   Refunded:  +0
   Net:       -30 (you paid for 3 successful videos)
   Invariant: reserved = settled + refunded → ✅ PASS
```

## Key Concepts

### Idempotency

Use `requestId` to ensure at-most-once execution:

```typescript
// Same request_id = same batch, no duplicate charges
const batch = await client.createBatch({
  requestId: 'order-123',  // Your unique identifier
  items: [...]
});

// If you retry with the same requestId, you get the existing batch
const retry = await client.createBatch({
  requestId: 'order-123',  // Same ID
  items: [...]
});

console.log(retry.idempotentReplay); // true
console.log(retry.batchId === batch.batchId); // true
```

### Billing Model

```
1. Create batch → Credits RESERVED (frozen)
2. Each success  → Credits SETTLED (charged)
3. Each failure  → Credits REFUNDED (returned)

Invariant: reserved = settled + refunded
```

You only pay for successful generations.

### Webhooks (Recommended for Production)

Instead of polling, use webhooks:

```typescript
const batch = await client.createBatch({
  requestId: 'order-123',
  items: [...],
  webhookUrl: 'https://your-server.com/webhook/sora2'
});

// Your server receives:
// - batch.created
// - batch.running
// - batch.completed (with all results)
// - batch.refunded (if any items failed)
```

See [WEBHOOK_EVENTS.md](../../docs/WEBHOOK_EVENTS.md) for full specification.

## Error Handling

```typescript
import { Sora2Error } from './sora2-client';

try {
  const batch = await client.createBatch({...});
} catch (err) {
  if (err instanceof Sora2Error) {
    switch (err.code) {
      case 'INSUFFICIENT_CREDITS':
        console.log('Need more credits:', err.details);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.log('Slow down, retry after delay');
        break;
      default:
        console.log('API error:', err.code, err.message);
    }
  }
}
```

## Support

- API Documentation: [/docs/enterprise](/docs/enterprise)
- OpenAPI Spec: [/openapi.json](/openapi.json)
- Enterprise Support: junpengpanchina@gmail.com
