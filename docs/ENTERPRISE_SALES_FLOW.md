# Enterprise 成交流程模拟（从冷邮件到签约）

## 完整流程概览

1. **第一封冷邮件** → 建立联系
2. **客户回复询问** → 深入解答
3. **技术评审电话** → 三句话说服
4. **试点（Pilot）** → 验证价值
5. **签约 / 扩容** → 成交

---

## Step 1: 第一封冷邮件

**主题**: Enterprise-Grade Batch Video Generation API

**内容**: (使用 `docs/ENTERPRISE_SALES_EMAIL.md` 中的第一封邮件)

**关键点**:
- 强调"enterprise-grade"
- 突出"batch execution"
- 提到"financial safety"
- 明确"no subscription lock-in"

**发送时机**: 初次接触潜在客户

---

## Step 2: 客户回复："Sounds interesting, how is billing handled?"

**你的回复（关键转折）**:

**主题**: Re: Enterprise-Grade Batch Video Generation API

---

Hi {{Name}},

Great question — billing is exactly where most AI video systems break at scale, so we designed ours differently.

**Here's how it works in practice:**

• **Before a batch starts**, we pre-check your balance  
• **We freeze the full batch cost upfront** (no partial surprises)  
• **Each video is executed independently**  
• **Failed items are automatically refunded**  
• **You're charged only for successful outputs**

**Every step is auditable:**

- Ledger entries per batch
- Per-video success/failure records
- Admin reconciliation view

This means finance teams can approve usage without manual reconciliation.

**If helpful, I can run a small pilot batch (10–20 videos)** so your team can see the flow end-to-end.

Best,  
{{Your Name}}

---

**关键点**:
- 直接回答客户最关心的问题（billing）
- 强调"finance teams can approve"
- 主动提出 pilot（降低决策门槛）

---

## Step 3: 技术评审电话（你要说的三句话）

### 第一句：Batch-first Architecture

> "We are batch-first, not request-first."

**解释**:
- 单次 API 调用 ≠ 企业级批量生产
- 我们设计就是为批量而生
- 一次提交，批量执行，统一结算

**技术细节**（如果被问）:
- Batch Job 状态机：queued → processing → completed/partial/failed
- 每个任务独立执行，失败不影响其他任务
- Worker 并发可控，避免下游压力

---

### 第二句：Financial Safety

> "We freeze credits so finance never gets surprised."

**解释**:
- 预扣机制：批量任务创建时预扣整单 credits
- 结算机制：成功数 × 单价 = 实际扣费
- 自动退款：失败任务自动退款，无需人工干预

**财务细节**（如果被问）:
- 所有资金变动记录在 `credit_ledger`
- Admin 面板可完整对账
- 支持月结、发票

---

### 第三句：Automatic Refund

> "Every failure refunds automatically."

**解释**:
- 网络错误、模型失败、超时 → 自动退款
- 无需工单、无需人工干预
- 100% 退款保障（SLA）

**技术细节**（如果被问）:
- Worker 自动检测失败任务
- `finalize_batch_credits` RPC 自动计算退款
- 退款立即回到钱包，可继续使用

---

### 电话后的跟进邮件

**主题**: Re: Technical Review Call

---

Hi {{Name}},

Thanks for the call today. As discussed, here's a quick recap:

**Three things that make us different:**

1. **Batch-first** — Built for scale, not single requests
2. **Financial safety** — Pre-freeze, auto-refund, full audit
3. **Production guarantees** — 99.9% uptime, 100% refund SLA

**Next step:**

I'll set up a **20-video pilot batch** for your team. This will let you:
- See the full flow end-to-end
- Test with your actual use case
- Review the admin dashboard
- Verify the refund mechanism

I'll send the pilot setup details by {{Date}}.

Best,  
{{Your Name}}

---

## Step 4: 试点（Pilot）

### Pilot 设置

**规模**: 20 videos  
**定价**: Pay-as-you-go  
**交付**: 1-2 天内完成  
**跟踪**: Webhook + Admin Dashboard

### Pilot 邮件模板

**主题**: Pilot Batch Setup — {{Company Name}}

---

Hi {{Name}},

Your pilot batch is ready. Here's what you need:

**API Endpoint**: `POST /api/enterprise/video-batch`

**Authentication**: 
- API Key: `{{api_key}}`
- Header: `X-API-Key: {{api_key}}`

**Request Example**:
```json
{
  "items": [
    {"prompt": "A cat playing piano", "model": "sora-2"},
    {"prompt": "A dog in space", "model": "sora-2"}
    // ... 18 more
  ],
  "webhook_url": "https://your-domain.com/webhook",
  "x-request-id": "pilot-{{timestamp}}"
}
```

**What to expect**:

1. **Balance pre-check**: If insufficient, you'll get 402 Payment Required
2. **Batch creation**: Returns `batch_id` and `status: "queued"`
3. **Execution**: Worker processes tasks asynchronously
4. **Completion**: Webhook notification with final status
5. **Refund**: Failed tasks automatically refunded

**Admin Dashboard**: 
- URL: `https://your-domain.com/admin/batches/{{batch_id}}`
- View: Tasks, Billing, Webhooks

**Questions?** Reply to this email or ping me on {{Slack/Teams}}.

Best,  
{{Your Name}}

---

### Pilot 完成后的跟进

**主题**: Pilot Batch Complete — Results & Next Steps

---

Hi {{Name}},

Your pilot batch is complete. Here's what happened:

**Results**:
- Total: 20 videos
- Success: {{X}} videos
- Failed: {{Y}} videos (auto-refunded)
- Credits spent: {{Z}} credits
- Refunded: {{W}} credits

**What worked well**:
- {{Positive feedback}}

**What we can improve**:
- {{Improvement areas}}

**Next steps**:

1. **Review the admin dashboard** — See full audit trail
2. **Discuss pricing** — Pay-as-you-go or enterprise prepaid?
3. **Plan production batch** — When are you ready to scale?

**I'm available for a quick call** to discuss results and answer any questions.

Best,  
{{Your Name}}

---

## Step 5: 签约 / 扩容

### 客户常见成交句式

> "Can we prepay $5k and increase limits?"

### 你的标准回复

**主题**: Re: Enterprise Prepaid Package

---

Hi {{Name}},

Absolutely! Here's what the $5,000 prepaid package includes:

**Package Details**:
- **Credits**: Equivalent to ~1,050 Veo videos or ~10,200 Sora videos
- **Effective Price**: ~$4.76 per Veo video (20% discount)
- **Credits Never Expire**: Use at your pace
- **Monthly Invoicing**: Available upon request
- **Rate Limits**: Increased to {{custom_limit}} / minute

**What you get**:
- ✅ All credits in your wallet immediately
- ✅ Automatic refund for failures (as before)
- ✅ Full admin dashboard access
- ✅ Priority support

**Next steps**:
1. I'll send the invoice
2. Once paid, credits are activated
3. You can start using immediately

**Questions?** Let me know.

Best,  
{{Your Name}}

---

### 签约后的欢迎邮件

**主题**: Welcome to Enterprise Plan — {{Company Name}}

---

Hi {{Name}},

Welcome to our Enterprise plan! Your account is now set up:

**Account Details**:
- API Key: `{{api_key}}`
- Credits Balance: {{credits}}
- Rate Limit: {{rate_limit}} / minute

**Resources**:
- API Docs: {{docs_url}}
- Admin Dashboard: {{admin_url}}
- Support: {{support_email}}

**Getting Started**:
1. Review the API documentation
2. Run your first production batch
3. Monitor via admin dashboard

**I'm here to help** — ping me anytime with questions.

Best,  
{{Your Name}}

---

## 关键话术库

### 当客户说"太贵了"

> "我们不是更贵，我们是更安全。失败任务自动退款、全链路审计、幂等保障，这些是成本，也是价值。企业客户最怕的不是 API 调用失败，而是财务对不上账、失败任务白扣钱。"

### 当客户说"我们需要考虑"

> "完全理解。要不这样，我们先跑一个 20 条视频的 pilot，你们团队看看完整流程，包括退款机制。不收费，就当验证一下我们的系统是否适合你们的需求。"

### 当客户说"我们已经有 XX API"

> "XX API 很好，但它是单次调用模式。如果你们需要批量生成，我们的 batch-first 架构会更适合。而且，我们的财务安全保障（预扣+自动退款）是很多 API 没有的。"

### 当客户说"能保证 SLA 吗？"

> "我们敢写 99.9% 可用性和 100% 退款保障，因为系统设计就是为这个目标服务的。不是承诺，是架构保证。而且，我们的 admin 面板可以实时查看所有交易记录，完全透明。"

---

## 成交指标

### 健康信号

- ✅ 客户主动询问 pricing
- ✅ 客户要求 pilot
- ✅ 客户询问 enterprise prepaid
- ✅ 客户提到"finance team needs to approve"

### 危险信号

- ❌ 客户只问价格，不问功能
- ❌ 客户要求"免费试用 1000 条"
- ❌ 客户说"我们只是看看"

---

## 最后一句掏心窝子的评价

你现在这套不是「创业者自嗨系统」，而是：

> **一个 CFO 不会骂你的 AI 视频系统**

**为什么**:
- ✅ 钱不乱扣（预扣+结算+自动退款）
- ✅ 失败可解释（完整的错误信息和失败类型）
- ✅ 数据能对账（账本记录 + Admin 详情页）

**这就是企业客户愿意付钱的原因。**
