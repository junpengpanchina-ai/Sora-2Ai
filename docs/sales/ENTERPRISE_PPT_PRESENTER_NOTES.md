# Enterprise Demo PPT 逐页备注稿

> **用途**：Keynote / PowerPoint 的 Presenter Notes
> **原则**：照读都不会翻车

---

## Slide 1｜封面

### 画面内容

```
Scaling AI Content Without SEO Risk

Enterprise SEO Infrastructure by Sora2

Safe. Observable. Controllable.
```

### 备注稿（你怎么说）

```
今天我们不先聊 AI 怎么生成内容，
我们先聊一个更重要的问题：

当规模上来时，SEO 风险谁来兜？
```

---

## Slide 2｜Why AI SEO Fails at Scale

### 画面内容

```
Why AI SEO Fails at Scale

• AI generates faster than Google can evaluate
• Valid sitemaps ≠ indexed pages
• Most failures are silent — discovered too late

The real risk is not bad content.
It's scaling blindly.
```

### 备注稿

```
大多数 AI SEO 的失败不是内容差，
而是失败是"无声的"。

页面合法、sitemap 合法，但 Google 就是不索引。
等你发现，往往已经是流量腰斩。

（停 1 秒，看对方反应）
```

---

## Slide 3｜How Most Tools Scale

### 画面内容

```
How Most AI Content Tools Scale

Traditional Approach:
• Generate → Publish → Hope
• Assume Google will index
• Detect problems after traffic drops

Result:
• Indexing stalls
• Brand risk
• Cleanup is expensive
```

### 备注稿

```
大多数工具的流程其实很简单：
生成 → 发布 → 祈祷。

它们假设 Google 会配合扩容，
但 Google 从来没答应过这件事。
```

---

## Slide 4｜SEO Is Infrastructure

### 画面内容

```
SEO Is Infrastructure, Not Content

• Indexing is a pipeline, not a checkbox
• Scaling must be gated by real signals
• Expansion must always be reversible

We don't guess if Google will index.
We measure it.
```

### 备注稿

```
在 Sora2，我们把 SEO 当成基础设施。

就像支付、日志、风控一样，
不是出了问题再补救，而是提前阻断。
```

---

## Slide 5｜Indexing Pipeline

### 画面内容

```
Full Indexing Pipeline Visibility

Discovered → Crawled → Indexed

• Discovered: Google found the URL
• Crawled: Google fetched the page
• Indexed: Google shows it in search

If Indexed doesn't follow Crawled, scaling stops.
```

### 备注稿

```
Google 的索引不是一个状态，而是一条流水线：

Discovered → Crawled → Indexed

真正危险的信号是：
Crawled 在涨，但 Indexed 不动。
```

---

## Slide 6｜Index Health Dashboard

### 画面内容

```
Index Health Dashboard

• Real-time pipeline visibility
• Index Rate as safety metric
• Automatic scaling freeze below threshold

Below 40% Index Rate, expansion is blocked automatically.
```

### 备注稿

```
这是我们的 Index Health Dashboard。

这个指标叫 Index Rate，
一旦低于 40%，系统自动冻结扩容。

没有人拍板，也没有人工 override。

（强调 "automatic"）
```

---

## Slide 7｜Sitemap & Silent Failure

### 画面内容

```
Preventing Silent SEO Failures

• Tier-based sitemap architecture
• Empty sitemap detection
• Deployment blocked on risk

Google never sees broken signals.
```

### 备注稿

```
一个技术上合法、但内容为空的 sitemap，
可以在不报错的情况下直接杀死 SEO。

我们在部署阶段就会阻断这种情况。
```

---

## Slide 8｜Enterprise Risk Isolation

### 画面内容

```
Enterprise-Grade Risk Isolation

• SEO and delivery are isolated
• Batch API & credits never blocked
• Kill-switch for AI pages

SEO frozen ≠ Business frozen
```

### 备注稿

```
很关键的一点：
SEO 冻结 ≠ 业务冻结。

Batch API、交付、credits 全部独立运行。

这就是 Enterprise 和工具的区别。
```

---

## Slide 9｜Why It Matters

### 画面内容

```
Why This Matters for Enterprise Teams

• Scale to 10k–100k pages safely
• Protect brand & domain trust
• Avoid costly SEO rollbacks

Scaling without control is not growth.
It's risk.
```

### 备注稿

```
扩到 10 万页并不难，
难的是 扩完之后还能不能回头。

我们卖的不是"生成能力"，
而是 可控的扩容能力。
```

---

## Slide 10｜Closing & CTA

### 画面内容

```
Built for Teams Who Scale Responsibly

SEO Infrastructure included in all Enterprise plans.
Not an add-on. A requirement.

Most tools generate content.
We control whether Google will index it at scale.
```

### 备注稿（慢慢说）

```
Most tools generate content.

We control whether Google will index it at scale.

对 Enterprise 来说，
这是一条生死线。

（停 2 秒）

有什么问题吗？还是我们直接聊一下你们的规模和时间线？
```

---

## Q&A 应对备注

### Q: "你能保证 Google 一定会收录吗？"

```
我们不做这个承诺。

我们承诺的是：
一旦 Google 不再收录，我们会立刻停止扩容。
```

### Q: "那这和人工盯 GSC 有什么区别？"

```
人工发现问题，通常已经晚了。

我们的系统是在 Index Rate 下降时自动阻断，
不是等流量掉了再看报表。
```

### Q: "如果 Index Rate 一直很低怎么办？"

```
那说明当前策略不适合继续扩。

我们宁愿停，也不会用客户域名去赌。
```

### Q: "别的工具便宜很多。"

```
是的，因为他们不承担规模化风险。

他们卖生成量，我们卖后果控制。

（停 1 秒）
```

### Q: "你们适合所有客户吗？"

```
不适合。

如果只是试验、小规模，Starter 就够了。

Enterprise 是给已经在规模边缘的团队。
```

---

## 收尾话术

### 选项 A（推进）

```
接下来我们可以：
1. 看一下 Dashboard 的实际界面
2. 聊一下你们目前的规模和时间线
3. 我发一份技术白皮书给你们技术团队看

哪个对你们最有帮助？
```

### 选项 B（留空间）

```
今天先到这里，我会发一封 follow-up 邮件，
附上我们聊到的材料。

如果有任何问题，随时联系我。
```

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
