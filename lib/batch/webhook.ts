import crypto from "crypto";

/**
 * 企业 Webhook 回调（签名 + 超时 + 重试）
 * 
 * 期望你有一个 RPC（推荐）：
 *   get_enterprise_webhook_for_batch(p_batch_id uuid)
 * 返回：
 *   { url: text, secret: text|null }
 *
 * 没有这个 RPC 也没关系：sendBatchWebhook 会直接返回 false，不影响结算。
 */

type WebhookPayload = {
  batch_id: string;
  user_id: string;
  status: string; // completed/partial/failed
  total_count: number;
  success_count: number;
  failed_count: number;
  credits_spent: number;
  timestamp: number;
};

function sign(secret: string, body: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

export async function sendBatchWebhook(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  input: Omit<WebhookPayload, "timestamp">,
): Promise<boolean> {
  const retries = Number(process.env.ENTERPRISE_WEBHOOK_RETRIES ?? 3);
  const timeoutMs = Number(process.env.ENTERPRISE_WEBHOOK_TIMEOUT_MS ?? 5000);

  // 1) 取 webhook 配置（RPC 优先，避免 schema 不确定导致 select 列失败）
  let cfg: { url?: string | null; secret?: string | null } | null = null;
  try {
    const { data, error } = await supabase.rpc("get_enterprise_webhook_for_batch", {
      p_batch_id: input.batch_id,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.warn(
        "[batch-webhook] missing/failed rpc get_enterprise_webhook_for_batch",
        error,
      );
      return false;
    }
    cfg = data ?? null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[batch-webhook] rpc exception", e);
    return false;
  }

  const url = cfg?.url ?? null;
  if (!url) return false;

  const payload: WebhookPayload = { ...input, timestamp: Date.now() };
  const body = JSON.stringify(payload);

  // 2) 生成签名（如果 secret 为空，也照样投递，但不带签名）
  // secret 从环境变量读取（因为 RPC 返回的 secret 是 null）
  const secret = cfg?.secret ?? process.env.ENTERPRISE_WEBHOOK_SECRET ?? null;
  const signature = secret ? sign(secret, body) : null;

  // 3) 重试投递（指数退避）
  for (let i = 0; i < retries; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-batch-id": payload.batch_id,
          ...(signature ? { "x-webhook-signature": signature } : {}),
        },
        body,
        signal: ctrl.signal,
      });

      clearTimeout(timer);

      // 2xx 视为成功
      if (res.ok) {
        // eslint-disable-next-line no-console
        console.log("[batch-webhook] delivered", {
          batch_id: payload.batch_id,
          status: res.status,
        });
        return true;
      }

      // eslint-disable-next-line no-console
      console.warn("[batch-webhook] non-2xx", {
        batch_id: payload.batch_id,
        status: res.status,
      });
    } catch (e: unknown) {
      clearTimeout(timer);
      // eslint-disable-next-line no-console
      console.warn("[batch-webhook] delivery error", {
        batch_id: payload.batch_id,
        error: (e as { message?: string })?.message || String(e),
      });
    }

    // 退避：500ms, 1500ms, 3500ms...
    await sleep(500 + i * i * 1000);
  }

  return false;
}
