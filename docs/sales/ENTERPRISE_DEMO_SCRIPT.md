# Enterprise Demo 讲解稿（10 分钟版）

> **使用对象**：Enterprise 客户 demo、CTO / Head of Growth / SEO Lead
> **场景**：线上会议 / 线下路演 / 录制视频

---

## 时间结构

| 时间 | 内容 | 关键词 |
|------|------|--------|
| 0–1 min | 开场 & 问题共识 | "How do you know?" |
| 1–3 min | 为什么 AI SEO 会失败 | "Silent failure" |
| 3–6 min | Sora2 的 Index Infra | "Infrastructure, not content" |
| 6–8 min | Dashboard 实例讲解 | "Real-time visibility" |
| 8–10 min | 商业保障 + 收尾 | "Control, not hope" |

---

## 【0–1 分钟】开场

### 讲稿

Before we talk about AI content generation,
I want to talk about something more fundamental.

**How do you know whether Google is actually indexing your pages?**

*(停 1 秒)*

Most teams don't.
They only realize something is wrong after traffic drops.

---

## 【1–3 分钟】问题定义

### 讲稿

The biggest risk with AI-generated content is not quality.

**It's silent failure.**

Sitemaps look valid. Pages look fine.
But Google simply stops indexing — without warnings.

Most tools keep generating anyway.

### 可选补充（如果客户点头）

We actually experienced this ourselves.
Our sitemap was technically valid, but pointing to an empty file.
Google Search Console showed "Success" with zero discovered pages.

That's when we realized:
**"Success" in GSC doesn't mean "working."**

---

## 【3–6 分钟】Sora2 的核心不同

### 讲稿

At Sora2, we treat SEO as infrastructure, not content.

That means we monitor the full indexing pipeline:

**Discovered → Crawled → Indexed**

If Indexed doesn't follow Crawled,
we don't guess, we don't hope —
**we freeze scaling automatically.**

### 补充说明（如果客户问"怎么做到"）

Three layers of protection:

1. **Database constraint** — Tier1 sitemap cannot be empty
2. **CI gate** — Deployment blocked if health check fails
3. **Runtime monitoring** — Daily automated checks with alerts

*(切到 Dashboard)*

---

## 【6–8 分钟】Dashboard 实例讲解

### 讲稿（配合屏幕展示）

*(打开 Dashboard)*

This is our Index Health Dashboard.

**On top**, you see how Google discovers, crawls, and indexes pages over time.

- Blue line: Discovered
- Orange line: Crawled
- Green line: Indexed

If these lines diverge significantly, something is wrong.

---

**This metric here — Index Rate —**
determines whether scaling is allowed.

- Above 70%: Safe to scale
- 40-70%: Proceed with caution
- **Below 40%: Expansion is blocked automatically**

No manual override.

---

**This indicator — Tier1 Sitemap Health —**
shows whether our primary sitemap is intact.

If it turns red, everything freezes.
Google never sees broken signals.

---

**And here — the Alert Feed —**
every SEO event is logged.

This is your audit trail.

---

### 总结句

This prevents SEO damage before it happens.

---

## 【8–9 分钟】商业保障

### 讲稿

One important thing:

**SEO issues never affect delivery.**

Our Batch API, credits, and production workloads
are fully isolated from indexing risk.

Even if SEO is frozen,
enterprise delivery continues normally.

### 如果客户问"为什么要解耦"

Because SEO is a signal from Google — it's not in our control.
But delivery is a promise to you — that's 100% in our control.

We don't let external factors block enterprise operations.

---

## 【9–10 分钟】收尾

### 讲稿

Most AI tools generate content.

**We control whether Google will index it at scale.**

*(停 1 秒)*

That's why SEO Infrastructure is built into
every Sora2 Enterprise plan.

*(停)*

**Scaling without control is not growth.
It's risk.**

---

### 收尾选项 A（直接 CTA）

Would you like to see this with your own data?
We can set up a pilot in about a week.

### 收尾选项 B（留空间）

Any questions on the infrastructure side?
Happy to go deeper on any of these.

---

## 常见问题应对

### Q: "这个能力是加钱的吗？"

**A:**
No. SEO Infrastructure is included in all Enterprise plans.
Because without it, scaling would be irresponsible.

---

### Q: "我们有自己的 SEO 团队"

**A:**
That's great for strategy.
This is about execution safety — giving your team real-time visibility and automatic guardrails.
Like CI/CD for code.

---

### Q: "Google 会不会惩罚 AI 内容？"

**A:**
The risk isn't AI content itself.
The risk is scaling faster than Google can digest.
We control the pace — that's the difference.

---

### Q: "如果 Index Rate 一直不涨怎么办？"

**A:**
That's exactly what the system is designed to catch.
If growth stalls, scaling freezes.
Then we investigate — not blindly push more pages.

---

## 演示 Checklist

| 准备项 | 状态 |
|--------|------|
| Dashboard 已打开 | ☐ |
| 截图备用（网络问题时） | ☐ |
| 白皮书 PDF 准备好 | ☐ |
| Follow-up 邮件草稿 | ☐ |

---

## 核心金句（随时可用）

> "Most AI tools generate content. We control whether Google will index it at scale."

> "SEO Infrastructure is not a feature. It's how we protect your investment."

> "Scaling without control is not growth. It's risk."

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
