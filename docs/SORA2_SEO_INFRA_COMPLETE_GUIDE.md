# Sora2 SEO Infrastructure 完整指南

> **文档版本**: 1.1  
> **创建日期**: 2026-01-24  
> **最后更新**: 2026-01-24  
> **适用身份**: 超体个体（Individual Operator）  
> **收款模式**: Stripe 一次性充值（Prepaid Credits）  
> **基线版本**: [v1.0 归档](./archive/SORA2_SEO_INFRA_COMPLETE_GUIDE_v1.0.md)  
> **变更记录**: [CHANGELOG.md](./CHANGELOG.md)

---

## 目录

1. [事故复盘：Sitemap Off-by-One Bug](#一事故复盘sitemap-off-by-one-bug)
2. [SEO Infrastructure 架构](#二seo-infrastructure-架构)
3. [Index Health Dashboard](#三index-health-dashboard)
4. [自动化健康检查](#四自动化健康检查)
5. [GSC 冷启动 14 天行动表](#五gsc-冷启动-14-天行动表)
6. [SEO 扩容 SOP](#六seo-扩容-sop)
7. [个人身份运营指南](#七个人身份运营指南)
8. [Enterprise Preview 策略](#八enterprise-preview-策略)
9. [法律文档体系](#九法律文档体系)
10. [公司注册触发条件](#十公司注册触发条件)
11. [文件清单](#十一文件清单)

---

## 一、事故复盘：Sitemap Off-by-One Bug

### 1.1 问题描述

**现象**：
- GSC 显示 `/sitemap.xml` 状态为「成功」
- 但「已发现网页」= 0
- 看起来像 Google 没抓取

**根因**：
```
sitemap.xml 指向 tier1-1.xml（空）
而不是 tier1-0.xml（1000 URLs）
```

这是一个 **off-by-one 错误**：
- 路由从 `tier1-0` 开始
- 但 index 从 `tier1-1` 开始引用

### 1.2 修复方案

**修改文件**：
- `app/sitemap.xml/route.ts`
- `app/sitemap-index.xml/route.ts`

**代码变更**：
```typescript
// 修复前
tier1-${i + 1}.xml  // 从 1 开始

// 修复后
tier1-${i}.xml      // 从 0 开始
```

### 1.3 验证步骤

```bash
# 1. 确认 index 指向 tier1-0
curl -s https://sora2aivideos.com/sitemap.xml | head -20

# 2. 确认 tier1-0 有内容
curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -c "<url>"

# 3. 抽查 URL 可访问性
curl -I "https://sora2aivideos.com/use-cases/anime-video-generator"
```

### 1.4 教训

```
"成功" ≠ "有效"
Google 不会把"合法但空"的 sitemap 当错误
它只是没东西可发现
```

---

## 二、SEO Infrastructure 架构

### 2.1 分层 Sitemap 结构

```
sitemap.xml (唯一入口)
├── sitemap-core.xml     ← 核心页面（200-500）
├── tier1-0.xml          ← 高价值页面（1k/chunk）
├── tier1-1.xml
├── tier2-0.xml          ← 扩容页面（500/chunk）
├── tier2-1.xml
└── ...
```

### 2.2 各层定义

| 层级 | 目标 | URL 数/chunk | 收录目标 | canonical |
|------|------|-------------|---------|-----------|
| **Core** | 品牌信任 | < 500 | 100% | self |
| **Tier1** | 稳定收录 | 1,000 | 90%+ | self |
| **Tier2** | 扩容试错 | 500 | 30-70% | 可指向 Tier1 |

### 2.3 铁律

1. **Tier1 永远不指向 Tier2**
2. **Tier2 可以 canonical → Tier1**
3. **Index sitemap 只做导航，不做筛选**
4. **tier1-0 是 sitemap 的"命门"**

---

## 三、Index Health Dashboard

### 3.1 布局结构

```
┌────────────────────────────────────┐
│ Crawl Pipeline (Line)               │
│ Discovered / Crawled / Indexed      │
└────────────────────────────────────┘

┌───────────────┬────────────────────┐
│ Index Rate    │ Tier1 Sitemap Health│
│ (Line + SLA)  │ (Single Value 🚨)   │
└───────────────┴────────────────────┘

┌────────────────────────────────────┐
│ Index Delta (Daily Net Indexed)     │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Duplicate & Soft 404 (Bar)          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ Alerts Feed (Table)                 │
└────────────────────────────────────┘
```

### 3.2 核心指标

| 指标 | 公式 | 健康值 | 危险值 |
|------|------|--------|--------|
| **Index Rate** | Indexed / Crawled | > 70% | < 40% |
| **Index Rate 7d MA** | 7 日移动平均 | > 60% | < 45% |
| **Index Delta** | 今日 Indexed - 昨日 | > 0 | < 0 连续 3 天 |
| **Empty Chunks** | count(url_count = 0) | 0 | > 0 |
| **Duplicate Rate** | Duplicate / Indexed | < 10% | > 20% |

> **v1.1 新增**: Index Rate 7d MA（7 日移动平均）用于防止单日波动误判。
> 决策时优先看 7d MA，而不是单日值。

### 3.3 扩容决策

```sql
SELECT
  CASE
    -- v1.1: Reason Code 体系
    WHEN tier1_empty > 0 THEN 'BLOCKED_TIER1_EMPTY'
    WHEN index_rate < 0.4 THEN 'BLOCKED_LOW_INDEX_RATE'
    WHEN index_delta < 0 AND days_negative >= 3 THEN 'BLOCKED_INDEX_DELTA_NEGATIVE'
    WHEN duplicate_rate > 0.2 THEN 'BLOCKED_HIGH_DUPLICATE'
    WHEN index_rate < 0.5 THEN 'HOLD'
    WHEN index_rate < 0.7 THEN 'CAUTIOUS'
    ELSE 'SAFE_TO_SCALE'
  END as scaling_decision,
  
  -- v1.1: 7 日移动平均（防止单日波动误判）
  AVG(index_rate) OVER (ORDER BY date ROWS 6 PRECEDING) as index_rate_7d_ma
  
FROM seo_metrics;
```

### 3.4 Reason Code 说明（v1.1 新增）

| Code | 含义 | 严重程度 |
|------|------|----------|
| `BLOCKED_TIER1_EMPTY` | tier1-0 为空 | FATAL |
| `BLOCKED_LOW_INDEX_RATE` | Index Rate < 40% | FATAL |
| `BLOCKED_INDEX_DELTA_NEGATIVE` | 连续 3 天负增长 | FATAL |
| `BLOCKED_HIGH_DUPLICATE` | Duplicate Rate > 20% | FATAL |
| `HOLD` | Index Rate 40-50% | WARNING |
| `CAUTIOUS` | Index Rate 50-70% | INFO |
| `SAFE_TO_SCALE` | 一切正常 | OK |

---

## 四、自动化健康检查

### 4.1 SQL 约束

```sql
-- 防止 tier1-0 为空
ALTER TABLE sitemap_chunks
ADD CONSTRAINT tier1_0_not_empty
CHECK (
  NOT (tier = 1 AND name = 'tier1-0' AND url_count = 0)
);
```

### 4.2 每日检查脚本

```typescript
// scripts/sitemap_health_check.ts
async function runCheck() {
  // 1. 检查 sitemap index
  const indexResponse = await fetch(`${BASE_URL}/sitemap.xml`);
  
  // 2. 检查各 chunk URL 数量
  for (const chunk of chunks) {
    const urlCount = await countUrls(chunk.url);
    if (urlCount === 0 && chunk.tier === 1) {
      throw new Error(`FATAL: ${chunk.name} is empty`);
    }
  }
  
  // 3. 更新数据库
  await updateSitemapChunks(results);
}
```

### 4.3 CI/CD Gate

```typescript
// scripts/seo-scaling-gate.ts
const decision = await supabase
  .from('v_seo_scaling_decision')
  .select('*')
  .single();

if (decision.decision === 'BLOCKED') {
  console.error('❌ SEO scaling blocked');
  process.exit(1);
}
```

---

## 五、GSC 冷启动 14 天行动表

### Day 0：初始化校验

- [ ] `/sitemap.xml` 返回 200 + XML
- [ ] `/sitemaps/tier1-0.xml` 有 URL
- [ ] GSC 提交 `/sitemaps/tier1-0.xml`
- [ ] URL Inspection 抽查 5 个

### Day 1-3：观察信号

**每天看**：
- Pages → 已发现 - 尚未编入索引（是否增长）
- Pages → 已编入索引（是否微增）
- Sitemaps 状态（只看成功/失败）

**正常表现**：
- 「已发现」上升
- 「已编入」小幅增长或不动
- Index 可能仍显示 0（正常）

### Day 4-7：逐步放量

**如果 Day 1-3 有增长**：
- 提交 `tier1-1.xml`
- 每天抽查 10 个 URL

**如果 Day 1-3 无增长**：
- 降低 chunk 大小
- 把重要 URL 放入 `sitemap-core.xml`

### Day 8-14：稳定放量

**每天看**：
- Discovered → Crawled → Indexed 流水线
- Crawl Stats 请求量
- Duplicate / Soft 404 是否爆发

**放量节奏**：
- 每天 tier2 +1-3 个 chunk
- 根据抓取反应调速

---

## 六、SEO 扩容 SOP

### 6.0 Gate Override 禁止条款（v1.1 新增）

```
⛔ No manual override is allowed when SEO Gate is BLOCKED.

这条规则是为"未来的自己"准备的。
当 Gate 显示 BLOCKED 时，不允许：
- 手动跳过检查
- 修改阈值来"通过"
- 以"这次特殊"为由绕过

唯一的出路是：修复根因，让 Gate 自然变绿。
```

### 6.1 扩容准入条件

| 检查项 | 要求 | 阻断级别 | Reason Code |
|--------|------|----------|-------------|
| tier1-0 URL 数 | > 0 | FATAL | `BLOCKED_TIER1_EMPTY` |
| Index Rate | ≥ 40% | FATAL | `BLOCKED_LOW_INDEX_RATE` |
| Index Delta | ≥ 0（3日均） | FATAL | `BLOCKED_INDEX_DELTA_NEGATIVE` |
| Duplicate Rate | < 20% | FATAL | `BLOCKED_HIGH_DUPLICATE` |
| Soft 404 | 不增长 | WARNING | - |

### 6.2 Kill-Switch 机制

**触发条件**：
- tier1-0 = 0
- Index Rate < 30%
- Indexed 突降 > 20%

**执行动作**：
1. 暂停所有内容生成
2. 冻结 sitemap 更新
3. 发送告警通知

### 6.3 回滚机制

```sql
-- 紧急 noindex Tier2
UPDATE pages 
SET meta_robots = 'noindex'
WHERE tier = 2 AND created_at > NOW() - INTERVAL '7 days';
```

---

## 七、个人身份运营指南

### 7.1 当前状态

```
身份：超体个体（Individual Operator）
收款：Stripe 一次性充值
模式：Prepaid Credits
能力：Enterprise 级（Preview 提供）
```

### 7.2 这个状态的优势

| 优势 | 说明 |
|------|------|
| **法律风险低** | 无长期服务承诺 |
| **灵活性高** | 随时调整策略 |
| **成本低** | 无公司运营成本 |
| **升级空间** | 随时可注册公司 |

### 7.3 Credits 模式本质

```
Credits = 预付使用权

不是：
- 结果承诺
- 索引保证
- 流量承诺
```

---

## 八、Enterprise Preview 策略

### 8.1 定位

```
"We're already operating at Enterprise standards.
We're just not forcing Enterprise contracts too early."
```

### 8.2 核心话术

**当客户问 Enterprise**：
```
Currently, Sora2 operates on a prepaid credits model.
For teams scaling seriously, we provide Enterprise-level 
capabilities in preview.
```

**当客户问公司**：
```
Sora2 is currently operated by me as an individual developer.
The systems are Enterprise-grade — that's how I built it.
Formal company registration happens when the scale requires it.
```

**当客户问能不能买**：
```
At this stage, Enterprise features are available case by case.
We start with credits, validate fit, and then discuss 
a formal Enterprise arrangement.
```

### 8.3 筛选姿态

```
你不是在"卖 Enterprise"
你是在"筛选未来的 Enterprise 客户"
```

### 8.4 Preview 不构成承诺（v1.1 新增）

```
Preview features do not imply future availability or contractual obligation.
```

这句话的作用：
- 防止"你上次给我看过"型纠纷
- 明确 Preview = 实验性质
- 保留随时调整的权利

---

## 九、法律文档体系

### 9.1 个人版 Terms of Service

**核心条款**：

1. **Operator 声明**
   ```
   Sora2 is operated by an individual developer.
   Services are provided on a best-effort basis.
   ```

2. **Credits 定义**
   ```
   Credits represent prepaid access to services, 
   not guaranteed outcomes.
   ```

3. **无结果保证**
   ```
   We do not guarantee any specific output, indexing, 
   ranking, or business results.
   ```

4. **责任上限**
   ```
   Liability cap = 3 months of payments
   ```

5. **服务可暂停**
   ```
   We reserve the right to limit or suspend services 
   to ensure system stability.
   ```

### 9.2 未来 Enterprise 合同结构

当注册公司后：

| 文档 | 用途 |
|------|------|
| **MSA** | 主服务协议 |
| **SLA** | 服务级别协议 |
| **SOW** | 具体工作说明 |
| **NDA** | 保密协议 |

---

## 十、公司注册触发条件

### 10.1 必须注册（满足任一）

| 条件 | 标准 |
|------|------|
| Enterprise 客户要求 | 客户要求签合同 |
| 年收入 | ≥ $50,000 |
| 单客户金额 | ≥ $10,000 |
| 长期服务承诺 | 客户要求 SLA/年付 |
| 平台要求 | Stripe/银行要求主体 |
| 雇佣关系 | 任何员工/外包 |

### 10.2 建议注册

| 条件 | 缓冲期 |
|------|--------|
| 2+ 企业客户 | 30 天 |
| 外包/承包商 | 60 天 |
| 投资人沟通 | 沟通前完成 |
| 年收入 $30k-$50k | 提前准备 |

### 10.3 不需要注册

| 条件 | 状态 |
|------|------|
| 个人用户为主 | ✅ OK |
| 一次性充值 | ✅ OK |
| 无合同要求 | ✅ OK |
| 收入 < $30k | ✅ OK |

### 10.4 决策原则

```
注册公司不是"升级"，是"责任切换"。
在你没被迫承担责任前，
保持个人身份 = 最低风险 + 最大灵活性。
```

### 10.5 心理误判提醒（v1.1 新增）

```
❗ "觉得自己应该注册公司" ≠ 触发条件

以下都不是注册理由：
- "感觉更专业"
- "别人都有公司"
- "万一以后需要"
- "有点焦虑"

这些是情绪，不是条件。
```

**自检问题**：
1. 有客户明确要求合同吗？
2. 年收入超过 $50k 了吗？
3. 单客户超过 $10k 了吗？
4. Stripe/银行要求了吗？
5. 要雇人了吗？

如果 5 个都是"没有" = 情绪驱动，不是条件驱动。

---

## 十一、文件清单

### 11.1 技术文档

| 文件 | 用途 |
|------|------|
| `docs/SITEMAP_FIX_2026_01_24.md` | 事故复盘 |
| `docs/SITEMAP_ARCHITECTURE.md` | 分层架构 |
| `docs/SEO_INFRA_CHECKLIST.md` | 20 项检查清单 |
| `docs/SEO_SCALING_SOP.md` | 扩容 SOP |
| `docs/GSC_SITEMAP_14DAY_PLAYBOOK.md` | 14 天行动表 |
| `docs/postmortems/2026-01-sitemap-tier1-off-by-one.md` | 技术复盘文章 |

### 11.2 数据库迁移

| 文件 | 用途 |
|------|------|
| `supabase/migrations/112_sitemap_health_check.sql` | 健康检查表 |
| `supabase/migrations/113_seo_index_health_dashboard.sql` | Dashboard 视图 |

### 11.3 脚本

| 文件 | 用途 |
|------|------|
| `scripts/sitemap_health_check.ts` | 每日健康检查 |
| `scripts/seo-scaling-gate.ts` | CI/CD Gate |
| `scripts/gsc_sitemap_check.sh` | curl 检查脚本 |
| `scripts/verify_sitemap_fix.sh` | 修复验证脚本 |

### 11.4 销售文档

| 文件 | 用途 |
|------|------|
| `docs/ENTERPRISE_SEO_WHITEPAPER.md` | 技术白皮书 |
| `docs/ENTERPRISE_PRICING_PAGE_FINAL.md` | 定价页文案 |
| `docs/DASHBOARD_WEBSITE_COPY.md` | 网站 Dashboard 文案 |
| `docs/sales/ENTERPRISE_DEMO_SCRIPT.md` | 10 分钟 Demo 稿 |
| `docs/sales/ENTERPRISE_PPT_PRESENTER_NOTES.md` | PPT 演讲稿 |
| `docs/sales/ENTERPRISE_EMAIL_TEMPLATES.md` | 邮件模板 |
| `docs/sales/ENTERPRISE_PREVIEW_TALKING_POINTS.md` | Preview 话术 |

### 11.5 法律文档

| 文件 | 用途 |
|------|------|
| `docs/legal/TERMS_OF_SERVICE_INDIVIDUAL.md` | 个人版 ToS |
| `docs/legal/SEO_RISK_CONTRACT_CLAUSES.md` | SEO 风险条款 |
| `docs/legal/ENTERPRISE_MSA_TEMPLATE.md` | MSA 模板 |
| `docs/legal/ENTERPRISE_SLA_TEMPLATE.md` | SLA 模板 |

### 11.6 投资人文档

| 文件 | 用途 |
|------|------|
| `docs/investor/ENTERPRISE_UNIT_ECONOMICS.md` | 单位经济 |
| `docs/investor/WHY_NOT_USAGE_BASED_PRICING.md` | 定价哲学 |
| `docs/investor/MSA_SLA_CEO_SUMMARY.md` | CEO 摘要 |
| `docs/investor/INVESTOR_QA_HARDBALL.md` | 投资人 Q&A |

### 11.7 运营文档

| 文件 | 用途 |
|------|------|
| `docs/operations/COMPANY_REGISTRATION_TRIGGERS.md` | 注册触发条件 |

### 11.8 Policy 文档（v1.1 新增）

| 文件 | 用途 |
|------|------|
| `docs/policies/SITEMAP_CORE_ADMISSION_POLICY.md` | sitemap-core 准入规则 |
| `docs/policies/INDEX_RATE_THRESHOLDS.md` | Index Rate 红/黄/绿阈值 |

### 11.9 Playbook 文档（v1.1 新增）

| 文件 | 用途 |
|------|------|
| `docs/playbooks/14_DAY_OBSERVATION_CHECKLIST.md` | 14 天观测清单 |

### 11.8 网站资源

| 文件 | 用途 |
|------|------|
| `docs/website/SEO_INFRA_SECTION.html` | HTML 结构 |
| `docs/website/DASHBOARD_MOCK_SPECS.md` | Mock 规格 |

---

## 总结

### 你现在拥有的

```
┌─────────────────────────────────────────────────┐
│                 Sora2 SEO Infra                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  技术层                                          │
│  ├── 分层 Sitemap 架构                           │
│  ├── Index Health Dashboard                     │
│  ├── 自动化健康检查                               │
│  └── CI/CD Gate                                 │
│                                                 │
│  运营层                                          │
│  ├── 14 天冷启动 Playbook                        │
│  ├── 扩容 SOP                                   │
│  └── Kill-Switch 机制                           │
│                                                 │
│  商业层                                          │
│  ├── Enterprise Preview 策略                    │
│  ├── 完整销售话术                                 │
│  └── 技术可信度白皮书                             │
│                                                 │
│  法律层                                          │
│  ├── 个人版 Terms of Service                    │
│  ├── MSA/SLA 模板（备用）                        │
│  └── 公司注册触发条件                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 核心原则

```
1. SEO 是基础设施，不是内容问题
2. 不承诺控制不了的结果
3. 宁可不扩，也不盲目扩
4. 个人身份 = 最大灵活性
5. 准备得早，但不被迫升级
6. Gate BLOCKED 时不允许手动 override（v1.1）
7. Preview ≠ 承诺（v1.1）
```

### 一句话总结

```
从一个 sitemap off-by-one bug，
到完整的 Enterprise 级 SEO Infrastructure，
再到个人身份合规运营方案。

技术、商业、法律三者完全一致。
随时可以升级，但不被迫升级。
```

---

## v1.1 变更摘要

| 增强点 | 内容 |
|--------|------|
| **Reason Code** | BLOCKED 细分为 4 种类型 |
| **No Override** | Gate BLOCKED 时禁止手动绕过 |
| **7d MA** | Index Rate 加入 7 日移动平均 |
| **Preview 条款** | 明确不构成长期承诺 |
| **心理误判** | "觉得应该" ≠ 触发条件 |

完整变更记录见 [CHANGELOG.md](./CHANGELOG.md)

---

*文档版本: 1.1 | 创建时间: 2026-01-24 | 基线版本: [v1.0](./archive/SORA2_SEO_INFRA_COMPLETE_GUIDE_v1.0.md)*
