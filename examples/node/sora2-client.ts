/**
 * Sora2 Enterprise API Client
 * 
 * A minimal TypeScript client for the Sora2 Batch API.
 * For production use, consider adding more robust error handling.
 * 
 * @example
 * ```ts
 * const client = new Sora2Client({ apiKey: 'your-api-key' });
 * const batch = await client.createBatch({
 *   requestId: 'order-123',
 *   items: [{ prompt: 'A sunset over the ocean' }]
 * });
 * const result = await client.waitForBatch(batch.batchId);
 * ```
 */

export interface Sora2ClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface BatchItem {
  prompt: string;
  model?: 'sora-2' | 'veo-flash' | 'veo-pro';
  aspectRatio?: '16:9' | '9:16';
  duration?: 5 | 10;
  metadata?: Record<string, unknown>;
}

export interface CreateBatchOptions {
  requestId?: string;
  items: BatchItem[];
  webhookUrl?: string;
}

export interface BatchResponse {
  ok: boolean;
  batchId: string;
  requestId: string;
  status: BatchStatus;
  totalCount: number;
  costPerVideo: number;
  requiredCredits: number;
  availableCredits: number;
  idempotentReplay?: boolean;
}

export interface BatchDetail {
  ok: boolean;
  batchId: string;
  requestId: string;
  status: BatchStatus;
  totalCount: number;
  succeededCount: number;
  failedCount: number;
  costPerVideo: number;
  creditsReserved: number;
  creditsSettled: number;
  creditsRefunded: number;
  createdAt: string;
  completedAt?: string;
}

export interface BatchItemDetail {
  itemId: string;
  index: number;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  prompt: string;
  model: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  failureType?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  completedAt?: string;
}

export interface CreditsBalance {
  ok: boolean;
  available: number;
  reserved: number;
  total: number;
}

export interface LedgerEntry {
  id: string;
  type: 'reserve' | 'settle' | 'refund' | 'purchase' | 'bonus';
  delta: number;
  balanceAfter: number;
  batchId?: string;
  itemId?: string;
  description?: string;
  createdAt: string;
}

export type BatchStatus = 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'partial';

export class Sora2Error extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'Sora2Error';
  }
}

export class Sora2Client {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: Sora2ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl || 'https://sora2aivideos.com/api/v1';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok || data.ok === false) {
      throw new Sora2Error(
        data.error || 'UNKNOWN_ERROR',
        data.message || `Request failed with status ${response.status}`,
        data.details
      );
    }

    return data as T;
  }

  // ─────────────────────────────────────────────────────────────────
  // Batch Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a new batch job.
   * 
   * @param options - Batch creation options
   * @returns The created batch response
   * 
   * @example
   * ```ts
   * const batch = await client.createBatch({
   *   requestId: 'order-123',
   *   items: [
   *     { prompt: 'A cinematic sunset', model: 'sora-2' },
   *     { prompt: 'An anime forest scene', model: 'sora-2' }
   *   ],
   *   webhookUrl: 'https://your-server.com/webhook'
   * });
   * ```
   */
  async createBatch(options: CreateBatchOptions): Promise<BatchResponse> {
    const body = {
      request_id: options.requestId,
      items: options.items.map(item => ({
        prompt: item.prompt,
        model: item.model,
        aspect_ratio: item.aspectRatio,
        duration: item.duration,
        metadata: item.metadata,
      })),
      webhook_url: options.webhookUrl,
    };

    const response = await this.request<{
      ok: boolean;
      batch_id: string;
      request_id: string;
      status: BatchStatus;
      total_count: number;
      cost_per_video: number;
      required_credits: number;
      available_credits: number;
      idempotent_replay?: boolean;
    }>('POST', '/batches', body);

    return {
      ok: response.ok,
      batchId: response.batch_id,
      requestId: response.request_id,
      status: response.status,
      totalCount: response.total_count,
      costPerVideo: response.cost_per_video,
      requiredCredits: response.required_credits,
      availableCredits: response.available_credits,
      idempotentReplay: response.idempotent_replay,
    };
  }

  /**
   * Get batch status and summary.
   * 
   * @param batchId - The batch ID
   * @returns Batch details
   */
  async getBatch(batchId: string): Promise<BatchDetail> {
    const response = await this.request<{
      ok: boolean;
      batch_id: string;
      request_id: string;
      status: BatchStatus;
      total_count: number;
      succeeded_count: number;
      failed_count: number;
      cost_per_video: number;
      credits_reserved: number;
      credits_settled: number;
      credits_refunded: number;
      created_at: string;
      completed_at?: string;
    }>('GET', `/batches/${batchId}`);

    return {
      ok: response.ok,
      batchId: response.batch_id,
      requestId: response.request_id,
      status: response.status,
      totalCount: response.total_count,
      succeededCount: response.succeeded_count,
      failedCount: response.failed_count,
      costPerVideo: response.cost_per_video,
      creditsReserved: response.credits_reserved,
      creditsSettled: response.credits_settled,
      creditsRefunded: response.credits_refunded,
      createdAt: response.created_at,
      completedAt: response.completed_at,
    };
  }

  /**
   * Get items in a batch.
   * 
   * @param batchId - The batch ID
   * @param options - Filter options
   * @returns List of batch items
   */
  async getBatchItems(
    batchId: string,
    options?: {
      status?: 'pending' | 'running' | 'succeeded' | 'failed';
      limit?: number;
      offset?: number;
    }
  ): Promise<{ items: BatchItemDetail[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{
      ok: boolean;
      items: Array<{
        item_id: string;
        index: number;
        status: 'pending' | 'running' | 'succeeded' | 'failed';
        prompt: string;
        model: string;
        video_url?: string;
        thumbnail_url?: string;
        error?: string;
        failure_type?: string;
        metadata?: Record<string, unknown>;
        created_at: string;
        completed_at?: string;
      }>;
      total: number;
    }>('GET', `/batches/${batchId}/items${query}`);

    return {
      items: response.items.map(item => ({
        itemId: item.item_id,
        index: item.index,
        status: item.status,
        prompt: item.prompt,
        model: item.model,
        videoUrl: item.video_url,
        thumbnailUrl: item.thumbnail_url,
        error: item.error,
        failureType: item.failure_type,
        metadata: item.metadata,
        createdAt: item.created_at,
        completedAt: item.completed_at,
      })),
      total: response.total,
    };
  }

  /**
   * Cancel a pending or running batch.
   * 
   * @param batchId - The batch ID
   * @returns Cancellation result
   */
  async cancelBatch(batchId: string): Promise<{ batchId: string; creditsRefunded: number }> {
    const response = await this.request<{
      ok: boolean;
      batch_id: string;
      credits_refunded: number;
    }>('POST', `/batches/${batchId}/cancel`);

    return {
      batchId: response.batch_id,
      creditsRefunded: response.credits_refunded,
    };
  }

  /**
   * Wait for a batch to complete.
   * 
   * @param batchId - The batch ID
   * @param options - Polling options
   * @returns Final batch status
   * 
   * @example
   * ```ts
   * const result = await client.waitForBatch(batch.batchId, {
   *   pollIntervalMs: 5000,
   *   timeoutMs: 300000
   * });
   * ```
   */
  async waitForBatch(
    batchId: string,
    options?: {
      pollIntervalMs?: number;
      timeoutMs?: number;
      onProgress?: (batch: BatchDetail) => void;
    }
  ): Promise<BatchDetail> {
    const pollInterval = options?.pollIntervalMs || 5000;
    const timeout = options?.timeoutMs || 300000; // 5 minutes default
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const batch = await this.getBatch(batchId);

      if (options?.onProgress) {
        options.onProgress(batch);
      }

      if (['succeeded', 'failed', 'cancelled', 'partial'].includes(batch.status)) {
        return batch;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Sora2Error('TIMEOUT', `Batch ${batchId} did not complete within ${timeout}ms`);
  }

  // ─────────────────────────────────────────────────────────────────
  // Credits Operations
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get current credits balance.
   * 
   * @returns Credits balance
   */
  async getCreditsBalance(): Promise<CreditsBalance> {
    return this.request<CreditsBalance>('GET', '/credits/balance');
  }

  /**
   * Get credits ledger (transaction history).
   * 
   * @param options - Filter options
   * @returns Ledger entries
   */
  async getCreditsLedger(options?: {
    batchId?: string;
    type?: 'reserve' | 'settle' | 'refund' | 'purchase';
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: LedgerEntry[]; total: number }> {
    const params = new URLSearchParams();
    if (options?.batchId) params.set('batch_id', options.batchId);
    if (options?.type) params.set('type', options.type);
    if (options?.from) params.set('from', options.from.toISOString());
    if (options?.to) params.set('to', options.to.toISOString());
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await this.request<{
      ok: boolean;
      entries: Array<{
        id: string;
        type: 'reserve' | 'settle' | 'refund' | 'purchase' | 'bonus';
        delta: number;
        balance_after: number;
        batch_id?: string;
        item_id?: string;
        description?: string;
        created_at: string;
      }>;
      total: number;
    }>('GET', `/credits/ledger${query}`);

    return {
      entries: response.entries.map(entry => ({
        id: entry.id,
        type: entry.type,
        delta: entry.delta,
        balanceAfter: entry.balance_after,
        batchId: entry.batch_id,
        itemId: entry.item_id,
        description: entry.description,
        createdAt: entry.created_at,
      })),
      total: response.total,
    };
  }
}
