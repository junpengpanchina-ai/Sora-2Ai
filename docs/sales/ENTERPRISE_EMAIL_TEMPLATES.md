# Enterprise 销售邮件模板

> **用途**：Demo 后跟进、冷启动、异议处理
> **原则**：短、稳、不推销，但很难拒绝

---

## 邮件 1：Demo 后 Follow-up（标准版）

**发送时机**：Demo / Call 后 2-24 小时内

**主题行**：`Following up — Sora2 SEO Infrastructure overview`

---

Hi {{Name}},

Great speaking with you today — really appreciated the discussion around scaling AI-generated content safely.

As promised, here's a quick summary of what we showed and why it matters for Enterprise teams:

• Sora2 treats SEO as infrastructure, not content
• We monitor the full Google pipeline: Discovered → Crawled → Indexed
• Scaling is automatically frozen if index health degrades
• SEO risks never affect Batch API delivery or production workloads

This is how we help teams scale to tens of thousands of pages without risking brand or search visibility.

If helpful, we're happy to:
– Walk through the Index Health Dashboard with your SEO or engineering team
– Share a short technical overview of our sitemap & index safeguards
– Discuss how this fits into your rollout timeline

Just let me know what's most useful on your side.

Best regards,
{{Your Name}}

---

**可选收尾杀句**（如果客户很专业）：

> *Most AI tools generate content. We control whether Google will index it at scale.*

---

## 邮件 2：技术团队深入跟进

**发送时机**：客户要求技术 deep-dive 后

**主题行**：`Sora2 SEO Infrastructure — Technical Overview`

---

Hi {{Name}},

Following up on your request for more technical details on how we handle SEO at scale.

**Attached / Linked:**
- SEO Infrastructure Whitepaper (PDF)
- Sitemap Architecture Overview
- Index Health Dashboard screenshots

**Key technical points:**

1. **Tier-based Sitemap Architecture**
   - Tier1: High-value pages (1k/chunk, strong constraints)
   - Tier2: Scale pages (2-5k/chunk, rollback-ready)
   - Core: Brand/trust pages (manual control)

2. **Automatic Safeguards**
   - Database constraint: Tier1-0 cannot be empty
   - CI gate: Deployment blocked if health check fails
   - Runtime: Daily automated monitoring

3. **Decoupled Systems**
   - SEO issues don't affect Batch API
   - Credits and delivery isolated from indexing

Happy to schedule a call with your engineering team if you'd like to go deeper on any of these.

Best,
{{Your Name}}

---

## 邮件 3：异议处理 - "担心 Google 惩罚"

**发送时机**：客户表达 SEO 风险担忧后

**主题行**：`Re: SEO risk concerns — how we handle this`

---

Hi {{Name}},

Totally understand the concern — it's the right question to ask.

Here's how we think about it:

**The risk isn't AI-generated content itself.**
The risk is scaling blindly without knowing whether Google is actually indexing.

Most tools generate → hope for the best.
We generate → monitor → freeze if signals degrade.

Specifically:
- We track Index Rate (Indexed / Crawled) daily
- If it drops below 40%, scaling stops automatically
- No manual override — the system enforces it

This isn't about gaming Google. It's about not scaling faster than Google can digest.

Would it help to show you the dashboard in action? We can walk through a real scenario.

Best,
{{Your Name}}

---

## 邮件 4：异议处理 - "我们有自己的 SEO 团队"

**发送时机**：客户认为不需要 SEO Infra

**主题行**：`Re: SEO team coverage — clarification`

---

Hi {{Name}},

That's great — a strong SEO team is essential for strategy.

To clarify: our SEO Infrastructure isn't meant to replace your team.

It's meant to give them tools:
- **Visibility**: Real-time pipeline monitoring (Discovered → Crawled → Indexed)
- **Safety rails**: Automatic scaling freeze when risk appears
- **Audit trail**: Every decision logged and traceable

Think of it like CI/CD for code: your developers write the code, but you still need automated testing and deployment gates.

We provide the same for SEO at scale.

Happy to walk through this with your SEO lead if helpful.

Best,
{{Your Name}}

---

## 邮件 5：冷启动 - Enterprise Outreach

**发送时机**：主动触达潜在 Enterprise 客户

**主题行**：`Scaling AI content safely — quick question`

---

Hi {{Name}},

Quick question: if you're generating AI content at scale, how do you know whether Google is actually indexing it?

Most teams find out too late — after traffic drops.

At Sora2, we built SEO Infrastructure specifically for this:
- Monitor the full indexing pipeline daily
- Automatically freeze scaling if index health degrades
- Never let SEO issues affect content delivery

We're working with teams scaling to 50k-100k pages without blind spots.

Would a 15-minute overview be useful?

Best,
{{Your Name}}

---

## 邮件 6：成交推进 - 限时/紧迫感

**发送时机**：客户犹豫不决时

**主题行**：`Quick check-in — Sora2 Enterprise`

---

Hi {{Name}},

Just wanted to check in on your timeline for the Enterprise plan.

A few things that might be relevant:
- Our onboarding team has availability in the next 2 weeks
- We can prioritize your account for Index Health Dashboard setup
- Happy to include a technical walkthrough for your engineering team

Let me know if there's anything blocking the decision — happy to address directly.

Best,
{{Your Name}}

---

## 签名档建议

```
{{Your Name}}
Enterprise Sales | Sora2

"Most AI tools generate content. We control whether Google will index it at scale."

📧 {{email}}
📞 {{phone}}
🔗 sora2aivideos.com/enterprise
```

---

## 邮件发送 Checklist

| 场景 | 邮件模板 | 时机 |
|------|----------|------|
| Demo 后 | 邮件 1 | 2-24 小时内 |
| 技术深入 | 邮件 2 | 客户要求后 |
| SEO 担忧 | 邮件 3 | 异议出现时 |
| 有 SEO 团队 | 邮件 4 | 异议出现时 |
| 冷启动 | 邮件 5 | 主动触达 |
| 推进成交 | 邮件 6 | 犹豫期 |

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
