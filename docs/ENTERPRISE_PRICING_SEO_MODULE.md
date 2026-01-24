# Enterprise 定价页：SEO Infra 模块包装

> **用途**：定价页文案、销售材料、技术说明
> **定位**：SEO Infrastructure 是 Enterprise 的内置能力，不是 add-on

---

## 定价页模块（推荐位置：Features 区域）

### 模块标题

```
Enterprise SEO Infrastructure (Built-in)
```

### 副标题

```
Scale to 100,000+ pages without index collapse
```

### 卖点列表

```markdown
✔ Tier-based sitemap architecture
✔ Automatic empty-sitemap prevention  
✔ Crawl → Index pipeline monitoring
✔ Kill-switch for instant rollback
✔ Index Health Dashboard
```

---

## 三个核心卖点（客户语言版）

### 卖点 1：Index Reliability

**技术表述**：
```
Tier-based sitemap architecture with automatic integrity validation
```

**客户翻译**：
```
"不会生成一堆 Google 不收录的垃圾页"
```

**证据点**：
- 每个 sitemap chunk 部署前自动验证
- Tier1 空 chunk = 部署阻断
- 数据库层面强约束

---

### 卖点 2：Safe Scaling

**技术表述**：
```
Controlled rollout with kill-switch and rollback capabilities
```

**客户翻译**：
```
"能扩到 10 万页，但随时能停"
```

**证据点**：
- 分批 rollout（每批 ≤ 5k）
- 一键 noindex 任意 Tier
- Index Rate 阈值自动阻断

---

### 卖点 3：Operational Transparency

**技术表述**：
```
Index Health Dashboard with real-time scaling decisions
```

**客户翻译**：
```
"不是黑盒 SEO"
```

**证据点**：
- Dashboard 可见所有指标
- 告警日志可审计
- 扩容决策有据可查

---

## 定价锚点文案

### 选项 A：包含声明

```markdown
## Enterprise Plan

**SEO Infrastructure is included in all Enterprise plans.**

This is not an add-on. This is how we protect your brand at scale.
```

### 选项 B：差异化声明

```markdown
## Why Enterprise?

| Feature | Pro | Enterprise |
|---------|-----|------------|
| AI Content Generation | ✅ | ✅ |
| Batch API | ✅ | ✅ |
| **SEO Infrastructure** | ❌ | ✅ |
| Index Health Dashboard | ❌ | ✅ |
| Kill-Switch Control | ❌ | ✅ |
```

### 选项 C：风险对比

```markdown
## Scaling Without SEO Infrastructure

| Metric | Without Infra | With Sora2 Enterprise |
|--------|---------------|----------------------|
| Index Rate at 10k pages | 30-50% | 70%+ |
| Silent failures | Common | Prevented |
| Rollback time | Hours/Days | Seconds |
| Index visibility | None | Real-time |
```

---

## 销售对话用一句话

### 英文版

```
"Most AI tools optimize content. We optimize whether Google will index it at all."
```

### 中文版

```
"大多数 AI 工具优化内容。我们优化的是 Google 会不会收录它。"
```

---

## FAQ 补充

### Q: 为什么 SEO Infrastructure 只在 Enterprise？

```
A: 因为这套系统是为 10,000+ 页面规模设计的。
   
   在小规模（<1000 页），手动管理 sitemap 是可行的。
   在大规模（10k-100k），没有自动化监控 = 迟早出事故。
   
   Enterprise 客户需要的不是更多功能，而是更少风险。
```

### Q: 我已经有自己的 SEO 团队，还需要这个吗？

```
A: 这不是替代你的 SEO 团队，而是给他们工具。

   - 你的团队负责策略
   - 我们的系统负责执行安全
   
   类比：你的开发团队写代码，但你仍然需要 CI/CD 和监控。
```

### Q: 如果 Index Rate 下降怎么办？

```
A: 系统会自动：
   1. 在 <50% 时发出警告
   2. 在 <40% 时阻断扩容
   3. 提供一键回滚能力

   你的 SEO 团队会在问题变成危机前收到通知。
```

---

## 技术尽调支持材料

当 Enterprise 客户要求技术评估时，提供：

1. **白皮书**：`ENTERPRISE_SEO_WHITEPAPER.md`
2. **架构图**：`SITEMAP_ARCHITECTURE.md`
3. **事故复盘**：`postmortems/2026-01-sitemap-tier1-off-by-one.md`
4. **Checklist**：`SEO_INFRA_CHECKLIST.md`

**关键信息**：
- 我们自己踩过坑
- 我们建立了防护
- 我们的防护是可验证的

---

## 竞品对比话术

### 当客户说"XXX 也能批量生成"

```
"是的，大多数工具都能生成内容。

但请问他们：
1. 生成的页面有多少被 Google 收录了？
2. 如果 Index Rate 下降，他们有没有告警？
3. 如果出问题，能不能一键回滚？

这就是 Infrastructure 和 Feature 的区别。"
```

### 当客户说"我可以自己监控 GSC"

```
"当然可以。但 GSC 的数据有 24-72 小时延迟。

当你在 GSC 看到问题时，已经发生了好几天。
我们的系统在部署时就会检查，在问题发生前阻断。

这是 reactive 和 proactive 的区别。"
```

---

## 内部定价建议

### SEO Infra 成本构成

| 组件 | 说明 |
|------|------|
| 数据库存储 | 指标历史、告警日志 |
| 计算资源 | 每日健康检查 |
| 工程维护 | 持续优化 |

### 定价策略

```
不单独定价 SEO Infra。

原因：
1. 这是 Enterprise 的核心价值主张之一
2. 单独定价会让客户觉得"可选"
3. 包含在 Enterprise 里提升整体感知价值

定价锚点：
- Pro: $X/月（功能）
- Enterprise: $Y/月（功能 + 安全 + 支持）

SEO Infra 是 "安全" 的一部分。
```

---

*文档版本: 1.0 | 创建时间: 2026-01-24*
