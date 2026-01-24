# Enterprise Landing Page 内容文档

> **页面地址**: https://sora2aivideos.com/enterprise  
> **更新时间**: 2026-01-24  
> **定位**: B2B 企业客户销售页

---

## Hero 区

```
Enterprise

Enterprise-Grade AI Video Generation
Only Pay for Successful Videos

Batch generation with ledger-based credits, idempotency, 
automatic refunds, webhooks, and full audit logs — 
built for real production workloads.

[Book an Enterprise Demo]  [View API Docs]

✅ Batch API    ✅ Automatic Refunds    ✅ Admin Audit    ✅ SLA Options
```

---

## Problem / Solution

### The Problem

- Batch failures burn budget
- No idempotency → unsafe retries
- Finance cannot audit what was paid for
- Teams rebuild billing + ops from scratch

### Our Solution

- Batch-first execution model
- Ledger-based credits (every delta traceable)
- Automatic settlement + refund for failures
- Admin dashboards for ops & finance

---

## How It Works

| Step | 标题 | 说明 |
|------|------|------|
| **Step 1** | Create a Batch | Submit prompts via API or UI. |
| **Step 2** | Credits Reserved | Batch-level pre-deduct (equivalent to freeze). |
| **Step 3** | Run Concurrently | Controlled concurrency, retries, and failure reasons. |
| **Step 4** | Settle + Refund | Pay only for succeeded items, auto-refund failed items. |

### Guarantee

```
If a task fails, the system automatically refunds credits 
and records the ledger entry for audit.
```

---

## Built for Scale & Control

### API Keys & Rate Limits

Per-key limits, usage audit, safe retries with request_id idempotency.

### Webhooks & Integrations

Push batch completion + per-item status back to your system.

### Admin Audit Dashboard

Trends, top videos, batch detail, failure reasons, refund reconciliation.

---

## Pricing

### Start with a Pilot

**No lock-in. Credits never expire. Upgrade to SLA when ready.**

| Plan | Price | Features |
|------|-------|----------|
| **Pilot** | $999 | Batch API access, Webhook callbacks, Admin audit (read), Email support |
| **Growth** | $4,999 | Higher limits & concurrency, Priority queue, Monthly usage report, Slack channel (optional) |
| **Enterprise** | Custom | SLA options, IP allowlist, Dedicated support, Contract & invoicing |

### 详细对比

#### Pilot - $999

- ✅ Batch API access
- ✅ Webhook callbacks
- ✅ Admin audit (read)
- ✅ Email support

**CTA**: [Get Started](https://buy.stripe.com/6oUfZh03E6sbcttbyU0kE07)

#### Growth - $4,999

- ✅ Higher limits & concurrency
- ✅ Priority queue
- ✅ Monthly usage report
- ✅ Slack channel (optional)

**CTA**: [Get Started](https://buy.stripe.com/aFa4gz5nY2bV799auQ0kE08)

#### Enterprise - Custom

- ✅ SLA options
- ✅ IP allowlist
- ✅ Dedicated support
- ✅ Contract & invoicing

**CTA**: [Contact Sales](/contact?intent=enterprise-pricing)

---

## FAQ

### Do you watermark outputs?

Paid plans provide watermark-free outputs (subject to model capability). The platform enforces access control and audit logs without degrading media quality.

### How do refunds work?

Credits are reserved at batch start. On settlement, failed items are automatically refunded with ledger entries for audit.

### Can we integrate with our system?

Yes. Use API keys, webhooks, and idempotency with request_id. We also support rate limiting and usage reporting.

### Is there an SLA?

SLA is available on Enterprise plans. Pilot and Growth plans are best-effort with priority options.

---

## Footer

```
This service complies with applicable United States laws and regulations 
and is offered to enterprise customers. For information about data handling 
and compliance, please review the following documents.

[Terms of Service]  [Privacy Policy]

Data Usage Transparency: We use Google Sign-In to securely authenticate 
your account. We only request your email address and basic profile information 
(name, profile picture) to create your account and provide personalized video 
generation services. Your data is encrypted and stored securely.
```

---

## 页面核心卖点

### 技术层面

| 卖点 | 说明 |
|------|------|
| **Batch-first** | 一次提交，批量执行 |
| **Ledger-based** | 每笔扣费/退款都有账本记录 |
| **Idempotency** | request_id 幂等，重试安全 |
| **Auto-refund** | 失败任务自动退款 |

### 商业层面

| 卖点 | 说明 |
|------|------|
| **Only Pay for Success** | 只为成功视频付费 |
| **Credits Never Expire** | Credits 永不过期 |
| **No Lock-in** | 无锁定，随时升级 |
| **Finance-friendly** | 财务可审计 |

### 三档定价策略

| Tier | 目标客户 | 定价逻辑 |
|------|---------|---------|
| **Pilot** | 试水客户 | 低门槛入场，验证产品 |
| **Growth** | 规模化客户 | 高并发 + 优先队列 |
| **Enterprise** | 大客户 | SLA + 合同 + 定制 |

---

## 转化路径

```
访客
  ↓
Hero CTA: [Book an Enterprise Demo]
  ↓
了解 How It Works
  ↓
看到 Pricing：$999 Pilot
  ↓
点击 [Get Started] → Stripe 支付
  ↓
开始使用 Batch API
  ↓
升级到 Growth / Enterprise
```

---

## 源代码位置

```
app/enterprise/page.tsx
```

---

*文档更新时间: 2026-01-24*
