# Enterprise Sales Email Template

## 技术说明邮件（第一封）

**主题**: Enterprise-Grade Batch Video Generation API

---

Hi {{Name}},

I'm reaching out because we recently opened our enterprise-grade batch video generation API, designed specifically for teams that need reliable, auditable, and scalable AI video production.

**What's different from typical AI video APIs:**

• **True batch execution** — submit hundreds or thousands of prompts in one job
• **Financial safety by design** — credits are pre-checked, pre-deducted, and automatically refunded for failed items
• **Idempotent & auditable** — every request, generation, download, and embed is traceable
• **No subscription lock-in** — pay only for successful outputs
• **Supports Sora-2 & Veo-Pro** — production-grade quality, not demos

**Typical use cases we support:**

- Marketing video variants (A/B testing)
- Programmatic social media content
- Product demos at scale
- AI-assisted creative pipelines

**We provide:**

- Pay-as-you-go or prepaid enterprise pricing
- SLA-backed execution & refund guarantees
- Webhook delivery and admin-level reporting

If this matches what your team is building, I'd be happy to:

- Share a live API example
- Run a small pilot batch
- Discuss enterprise pricing & SLA

Best regards,  
{{Your Name}}  
{{Company / Product Name}}  
{{Contact Info}}

---

## 后续跟进邮件（第二封）

**主题**: Follow-up: Enterprise Batch API Demo

---

Hi {{Name}},

Following up on our conversation about enterprise batch video generation.

**Quick recap of what we offer:**

✅ **Batch API** — Submit 10-10,000 videos in one request  
✅ **Auto-refund** — Failed generations automatically refunded  
✅ **SLA-backed** — 99.9% uptime, 100% idempotency guarantee  
✅ **Full audit trail** — Every generation, download, embed tracked  

**Next steps:**

1. **API Test** — I can send you a test API key for a small batch (10-50 videos)
2. **Pricing Discussion** — Pay-as-you-go ($0.49 Sora / $5.99 Veo) or prepaid packages
3. **Pilot Project** — Run a real batch for your team, we'll handle setup

Which option works best for you?

Best,  
{{Your Name}}

---

## 技术细节邮件（针对 CTO/技术负责人）

**主题**: Technical Deep-Dive: Enterprise Batch API Architecture

---

Hi {{Name}},

You asked about the technical architecture of our batch system. Here's how it works:

**1. Financial Safety (Pre-debit + Auto-refund)**

- Batch creation → Pre-check balance → Pre-deduct credits
- Task execution → Success = keep credits, Failure = auto-refund
- All transactions logged in `credit_ledger` (audit-grade)

**2. Idempotency (100% guarantee)**

- `request_id` prevents duplicate batch creation
- RPC functions (`freeze_credits_for_batch`, `finalize_batch_credits`) are idempotent
- Worker uses CAS updates to prevent duplicate execution

**3. Execution Model**

- **Dispatch**: Claim queued batches → Freeze credits → Enqueue tasks
- **Poll**: Monitor task status → Update succeeded/failed
- **Settle**: Calculate spent credits → Refund failures → Update batch status

**4. Webhook Delivery**

- HMAC-SHA256 signature verification
- Exponential backoff retry (3 attempts)
- Failure doesn't affect settlement

**5. Compliance & Audit**

- All generations, downloads, embeds logged in `video_external_access_log`
- Full transaction history in `credit_ledger`
- Support for enterprise retention policies (30/90/180 days)

**Technical Stack:**

- Backend: Next.js API Routes + Supabase (PostgreSQL)
- Worker: Internal worker with configurable concurrency
- Models: Sora-2, Veo-Pro (via Grsai API)

**SLA:**

- System availability: 99.9% / month
- Batch idempotency: 100%
- Auto-refund: 100% (no manual intervention)
- Task completion: 95% within 2 min (Sora) / 10 min (Veo)

Would you like to see:
- API documentation
- Database schema
- Worker implementation details
- A live demo

Best,  
{{Your Name}}

---

## 使用说明

1. **替换占位符**：
   - `{{Name}}` → 收件人姓名
   - `{{Your Name}}` → 你的姓名
   - `{{Company / Product Name}}` → 公司/产品名称
   - `{{Contact Info}}` → 联系方式

2. **个性化调整**：
   - 根据客户行业调整用例
   - 根据客户规模调整定价方案
   - 根据技术背景选择邮件版本

3. **发送时机**：
   - 第一封：初次接触
   - 第二封：3-5 天后跟进
   - 第三封：技术负责人询问时
