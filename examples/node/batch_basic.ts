/**
 * Sora2 Batch API - Basic Example
 * 
 * This example demonstrates:
 * 1. Creating a batch with multiple items
 * 2. Using idempotency with request_id
 * 3. Waiting for batch completion
 * 4. Handling results and refunds
 * 
 * Run with:
 *   npx ts-node batch_basic.ts
 * 
 * Environment variables:
 *   SORA2_API_KEY - Your Enterprise API key
 */

import { Sora2Client, BatchDetail } from './sora2-client';

async function main() {
  // ─────────────────────────────────────────────────────────────────
  // 1. Initialize client
  // ─────────────────────────────────────────────────────────────────
  
  const client = new Sora2Client({
    apiKey: process.env.SORA2_API_KEY!,
    // baseUrl: 'http://localhost:3000/api/v1', // For local testing
  });

  console.log('✅ Client initialized\n');

  // ─────────────────────────────────────────────────────────────────
  // 2. Check credits balance
  // ─────────────────────────────────────────────────────────────────
  
  const balance = await client.getCreditsBalance();
  console.log('💰 Credits Balance:');
  console.log(`   Available: ${balance.available}`);
  console.log(`   Reserved:  ${balance.reserved}`);
  console.log(`   Total:     ${balance.total}\n`);

  // ─────────────────────────────────────────────────────────────────
  // 3. Create a batch with idempotency
  // ─────────────────────────────────────────────────────────────────
  
  // Use a unique request_id for idempotency
  // Same request_id = same batch (no duplicate charges)
  const orderId = `order-${Date.now()}`;
  
  console.log(`📦 Creating batch with request_id: ${orderId}`);
  
  const batch = await client.createBatch({
    requestId: orderId,
    items: [
      {
        prompt: 'A cinematic shot of a city skyline at sunset, golden hour lighting',
        model: 'sora-2',
        aspectRatio: '16:9',
        duration: 5,
        metadata: { sku: 'CITY-001' },
      },
      {
        prompt: 'An anime style forest scene with cherry blossoms falling',
        model: 'sora-2',
        aspectRatio: '16:9',
        duration: 5,
        metadata: { sku: 'ANIME-001' },
      },
      {
        prompt: 'Abstract flowing colors in a dynamic composition',
        model: 'sora-2',
        aspectRatio: '9:16',
        duration: 5,
        metadata: { sku: 'ABSTRACT-001' },
      },
    ],
    // Optionally set webhook for async notification
    // webhookUrl: 'https://your-server.com/webhook/sora2',
  });

  console.log('\n✅ Batch created:');
  console.log(`   Batch ID:        ${batch.batchId}`);
  console.log(`   Request ID:      ${batch.requestId}`);
  console.log(`   Status:          ${batch.status}`);
  console.log(`   Total Items:     ${batch.totalCount}`);
  console.log(`   Cost per Video:  ${batch.costPerVideo} credits`);
  console.log(`   Total Reserved:  ${batch.requiredCredits} credits`);
  console.log(`   Idempotent:      ${batch.idempotentReplay ? 'Yes (replay)' : 'No (new)'}`);

  // ─────────────────────────────────────────────────────────────────
  // 4. Wait for batch completion with progress updates
  // ─────────────────────────────────────────────────────────────────
  
  console.log('\n⏳ Waiting for batch to complete...\n');
  
  const result = await client.waitForBatch(batch.batchId, {
    pollIntervalMs: 5000,  // Check every 5 seconds
    timeoutMs: 300000,     // 5 minute timeout
    onProgress: (status: BatchDetail) => {
      const completed = status.succeededCount + status.failedCount;
      const percent = Math.round((completed / status.totalCount) * 100);
      console.log(`   Progress: ${completed}/${status.totalCount} (${percent}%) - Status: ${status.status}`);
    },
  });

  // ─────────────────────────────────────────────────────────────────
  // 5. Process results
  // ─────────────────────────────────────────────────────────────────
  
  console.log('\n✅ Batch completed:');
  console.log(`   Status:           ${result.status}`);
  console.log(`   Succeeded:        ${result.succeededCount}`);
  console.log(`   Failed:           ${result.failedCount}`);
  console.log(`   Credits Reserved: ${result.creditsReserved}`);
  console.log(`   Credits Settled:  ${result.creditsSettled}`);
  console.log(`   Credits Refunded: ${result.creditsRefunded}`);

  // ─────────────────────────────────────────────────────────────────
  // 6. Get individual item results
  // ─────────────────────────────────────────────────────────────────
  
  const { items } = await client.getBatchItems(batch.batchId);
  
  console.log('\n📋 Item Results:\n');
  
  for (const item of items) {
    console.log(`   [${item.index}] ${item.status.toUpperCase()}`);
    console.log(`       Prompt: ${item.prompt.substring(0, 50)}...`);
    
    if (item.status === 'succeeded') {
      console.log(`       Video:  ${item.videoUrl}`);
      console.log(`       Thumb:  ${item.thumbnailUrl}`);
    } else if (item.status === 'failed') {
      console.log(`       Error:  ${item.error}`);
      console.log(`       Type:   ${item.failureType}`);
    }
    
    if (item.metadata) {
      console.log(`       Meta:   ${JSON.stringify(item.metadata)}`);
    }
    console.log();
  }

  // ─────────────────────────────────────────────────────────────────
  // 7. View ledger for this batch
  // ─────────────────────────────────────────────────────────────────
  
  const { entries } = await client.getCreditsLedger({ batchId: batch.batchId });
  
  console.log('📒 Ledger Entries for this batch:\n');
  
  for (const entry of entries) {
    const sign = entry.delta >= 0 ? '+' : '';
    console.log(`   ${entry.type.padEnd(8)} ${sign}${entry.delta} → Balance: ${entry.balanceAfter}`);
  }

  // ─────────────────────────────────────────────────────────────────
  // 8. Verify ledger invariant
  // ─────────────────────────────────────────────────────────────────
  
  console.log('\n🔒 Ledger Invariant Check:');
  console.log(`   Reserved:  -${result.creditsReserved}`);
  console.log(`   Settled:   -${result.creditsSettled}`);
  console.log(`   Refunded:  +${result.creditsRefunded}`);
  console.log(`   Net:       ${-result.creditsSettled} (you paid for ${result.succeededCount} successful videos)`);
  
  // Verify: reserved = settled + refunded
  const invariantOk = result.creditsReserved === result.creditsSettled + result.creditsRefunded;
  console.log(`   Invariant: reserved = settled + refunded → ${invariantOk ? '✅ PASS' : '❌ FAIL'}`);
}

// Run
main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
