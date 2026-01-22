# Enterprise Landing Page（官网用 · 可直接上）

## 目标
- CTO 看了点头
- 财务看了不反对
- 老板看了敢签 Pilot

---

## Hero 区（第一屏）

### 标题
# Enterprise-Grade AI Video Generation
## Only Pay for Successful Videos

### 副标题
**Batch. Audit. Refund-Safe.**

Generate AI videos at scale with:

- ✅ **Batch jobs & concurrency control**
- ✅ **Credits-based billing with automatic refunds**
- ✅ **Full audit logs for finance & compliance**

### CTA
[👉 Book an Enterprise Demo](#contact)

---

## Why Enterprises Choose Us（第二屏）

### ❌ The Problem with AI Video APIs

- **Batch failures burn budget**  
  Failed videos still cost money. No refunds, no control.

- **No idempotency, no retries**  
  Network issues? System crashes? You pay twice.

- **Finance can't audit "what was paid for"**  
  No clear records. Manual reconciliation required.

- **Engineers end up building billing logic themselves**  
  3-6 months to build what we've already solved.

### ✅ Our Solution

We built what enterprises actually need:

- **Batch-first execution model**  
  Submit 10-10,000 videos in one request. Unified status, unified billing.

- **Ledger-based credits system**  
  Every credit movement is recorded. Finance can audit anytime.

- **Automatic refund for failed videos**  
  Network errors, model failures, timeouts → automatic refund. No tickets needed.

- **Admin dashboards for ops & finance**  
  Complete visibility. No need to ask engineers.

---

## How It Works（第三屏）

### 1️⃣ Create a Batch

Send a batch of prompts via API or UI.

**Example**:
```json
POST /api/enterprise/video-batch
{
  "items": [
    {"prompt": "A cat playing piano", "model": "sora-2"},
    {"prompt": "A dog in space", "model": "sora-2"}
    // ... up to 10,000
  ]
}
```

**Response**:
```json
{
  "batch_id": "...",
  "total_count": 100,
  "required_credits": 1000,
  "status": "queued"
}
```

### 2️⃣ Credits Are Reserved

We pre-deduct credits for the batch (no surprises later).

- Balance pre-check before execution
- Full batch cost frozen upfront
- Clear visibility of what will be spent

### 3️⃣ Videos Are Generated

Tasks run concurrently across Sora / Veo models.

- Configurable concurrency limits
- Independent task execution
- Real-time status updates
- Webhook notifications (optional)

### 4️⃣ Automatic Settlement

**Successful videos** → credits finalized  
**Failed videos** → credits refunded instantly

**You only pay for what succeeds.**

**Example**:
- Batch: 100 videos, 1000 credits frozen
- Result: 85 succeeded, 15 failed
- Final: 850 credits charged, 150 credits refunded

---

## Built for Scale & Control（第四屏）

### 🔐 Enterprise-Ready Architecture

- **API Keys with rate limits**  
  Per-key rate limiting. IP whitelisting available.

- **Idempotent requests (safe retries)**  
  `request_id` prevents duplicate charges. Network-safe.

- **Webhook callbacks**  
  HMAC-signed notifications. Exponential backoff retries.

- **Full access & billing audit logs**  
  Every generation, download, embed is tracked.

### 📊 Finance-Friendly

- **Credits never expire**  
  Enterprise credits are permanent. Use at your pace.

- **Every deduction & refund is traceable**  
  Complete ledger history. CSV / JSON export available.

- **Batch-level cost breakdown**  
  Admin dashboard shows: upfront, spent, refunded, net.

---

## Use Cases（第五屏）

### Marketing Agencies
Generating videos for clients at scale.  
**Pain point**: Failed videos burn agency budget.  
**Our solution**: Automatic refunds. Only pay for success.

### E-commerce Brands
Creating product videos at scale.  
**Pain point**: Finance needs to audit spending.  
**Our solution**: Complete audit logs. Finance-friendly dashboard.

### AI Startups
Embedding video generation in their product.  
**Pain point**: Don't want to build batch + billing infrastructure.  
**Our solution**: Production-ready system. Focus on your product.

### Enterprises
Needing compliant, auditable AI workflows.  
**Pain point**: Compliance requires full audit trails.  
**Our solution**: Every action is logged. GDPR-ready.

---

## Pricing（第六屏）

### Pay-as-you-go
- **Sora-2**: From $0.49 / video
- **Veo-Pro**: From $5.99 / video
- Minimum batch: 10 videos
- Automatic refund for failures

### Enterprise Credits
- **Volume discounts**: 12-27% off
- **Credits never expire**: Use at your pace
- **Monthly invoicing**: Available
- **Prepaid packages**: $2K, $5K, $10K+

[👉 View Full Pricing](#pricing)

---

## Security & Compliance（第七屏）

- ✅ **Signed URLs**: Time-limited, authenticated access
- ✅ **Controlled download & embed**: Per-video access policies
- ✅ **Full access logs**: Every play, download, embed tracked
- ✅ **Enterprise API keys**: Rate limits, usage tracking
- ✅ **Idempotent requests**: `request_id` prevents duplicate charges
- ✅ **Data retention**: Configurable (30/90/180 days)
- ✅ **GDPR-ready**: Data export available

---

## CTA（底部）

### Start with a Pilot. No Lock-In.

- ✅ **Small batch** (10-20 videos)
- ✅ **No minimum spend**
- ✅ **Pay only for successful videos**

[👉 Talk to Sales](#contact)  
[👉 Run a Pilot Batch](#pilot)

---

## Footer

**Links**:
- [API Documentation](#docs)
- [Pricing Details](#pricing)
- [Security & Compliance](#security)
- [Support](#support)

**Contact**:
- Email: enterprise@yourcompany.com
- Sales: sales@yourcompany.com
- Support: support@yourcompany.com

---

## 使用说明

### 1. 页面结构建议

1. **Hero Section**: 全屏，突出标题和 CTA
2. **Why Enterprises Choose Us**: 左右分栏，对比问题/解决方案
3. **How It Works**: 4 步流程图，图文并茂
4. **Built for Scale & Control**: 图标 + 文字列表
5. **Use Cases**: 用例卡片网格
6. **Pricing**: 表格或卡片展示
7. **Security & Compliance**: 图标 + 文字列表
8. **CTA**: 全宽，醒目
9. **Footer**: 标准页脚

### 2. SEO 建议

- **Meta Title**: Enterprise AI Video Generation | Batch API with Automatic Refunds
- **Meta Description**: Production-grade batch video generation with financial safety, full auditability, and automatic refunds. Built for scale.
- **Keywords**: enterprise video generation, batch API, AI video API, Sora API, Veo API, automatic refunds

### 3. A/B 测试建议

- **CTA 文案**: "Talk to Sales" vs "Get Started"
- **Hero 标题**: 强调"Enterprise" vs 强调"Scale"
- **Pricing 展示**: 表格 vs 卡片

### 4. 转化优化

- **Hero CTA**: 放在第一屏，醒目位置
- **Pricing CTA**: 每个定价方案都有 CTA
- **Bottom CTA**: 重复出现，降低决策门槛

---

## 关键卖点总结

### 对 CTO 最有价值
- Batch-first architecture
- Idempotent requests
- Webhook callbacks
- Full audit logs

### 对财务最有价值
- Credits never expire
- Automatic refunds
- Complete audit trails
- Finance-friendly dashboard

### 对老板最有价值
- Only pay for success
- No lock-in
- Start with pilot
- Production-ready
