# 3 万 → 10 万页面：安全增长蓝图（不被打击）

> **核心原则**：分层放量（Tier）、Tier3 先 noindex 养权重、sitemap 分层 + 节奏控制  
> **当前状态**：✅ 优秀（96% 索引率，3.7% 未编入）  
> **目标**：安全扩展到 10 万页面，避免 Google 惩罚

---

## 🎯 一、核心原则（三句话）

### 1. 分层放量（Tier）

**Tier 1（强商业意图）**：
- 功能/模型/价格/API/对比页
- 全 index，优先抓取

**Tier 2（可规模化且可读）**：
- 场景/行业/国家页
- index，正常抓取

**Tier 3（组合长尾池）**：
- 大量组合页
- **先 noindex → 观察 → 再放开**

---

### 2. Tier3 先 noindex 养权重

**为什么？**
- Google 会用 Tier3 的"最差页面"来给你整体打分
- 如果 Tier3 质量不稳定，会影响全站信任度
- 先 noindex 观察，确保质量后再放开

---

### 3. Sitemap 分层 + 节奏控制

**Sitemap 结构**：
- `/sitemap-core.xml`（固定核心）
- `/sitemap-tier1.xml`
- `/sitemap-tier2.xml`
- `/sitemap-tier3.xml`（只放已开放 index 的 tier3）
- `sitemap-index.xml`（只做入口）

**节奏控制**：
- 每天新增：200-500
- 每周新增：1,500-3,000
- 每月净增：不超过现有规模的 30%

---

## 📊 二、站点分层（你现在就该这样做）

### Tier 1（强商业意图）：全 index

**页面类型**：
- 功能页：`/video-generator`、`/text-to-video`、`/image-to-video`
- 模型页：`/sora-2`、`/veo-3`、`/runway-gen-3`
- 价格页：`/pricing`、`/api`、`/enterprise`
- 对比页：`/sora-vs-veo`、`/best-ai-video-generator`

**策略**：
- ✅ 全 index（`noindex = false`）
- ✅ 进入 sitemap（`in_sitemap = true`）
- ✅ 优先抓取（Tier 1 sitemap）
- ✅ 高质量内容（≥ 500 字，完整 FAQ）

**数量**：50-200 页

---

### Tier 2（可规模化且可读）：index

**页面类型**：
- 场景页：`/use-cases/anime-video-generator`、`/use-cases/product-demo-video`
- 行业页：`/use-cases/marketing-video-for-ecommerce`、`/use-cases/education-video-for-schools`
- 国家页：`/video-generator-for-us`、`/video-generator-for-uk`

**策略**：
- ✅ index（`noindex = false`）
- ✅ 进入 sitemap（`in_sitemap = true`）
- ✅ 正常抓取（Tier 2 sitemap）
- ✅ 标准质量（≥ 300 字，3-5 个 FAQ）

**数量**：5,000-10,000 页

---

### Tier 3（组合长尾池）：先 noindex

**页面类型**：
- 长尾组合页：`/use-cases/anime-video-for-tiktok-in-japan`
- 多维度组合：`/use-cases/product-demo-video-for-ecommerce-in-us`
- 实验性内容：新场景/新行业组合

**策略**：
- ⚠️ **先 noindex**（`noindex = true`）
- ⚠️ **不出 sitemap**（`in_sitemap = false`）
- ✅ **内链打通**（至少 3 条来自 Tier1/Tier2）
- ✅ **观察 7-14 天**（曝光/点击/抓取数据）
- ✅ **批量改为 index**（质量确认后）

**数量**：50,000-90,000 页（最终目标）

---

## 📅 三、放量节奏（大站最关键）

### 阶段 1：稳定期（第 1-4 周）

**目标**：
- 稳定当前 3 万页面
- 优化现有页面质量
- 建立监控体系

**行动**：
- ✅ 修复所有 Soft 404
- ✅ 增强现有页面差异化
- ✅ 建立每周 GSC 检查流程
- ✅ 优化 sitemap 结构

**新页面发布**：**0 个**（专注优化现有）

---

### 阶段 2：小规模测试（第 5-8 周）

**目标**：
- 测试 Google 对新页面的反应
- 验证内容质量
- 建立发布节奏

**行动**：
- 📝 每周发布 **500-1,000 个新页面**（Tier 2）
- 📊 监控索引率（目标：≥ 95%）
- 📊 监控 crawl budget（目标：稳定或上升）
- 📊 监控未编入索引原因

**新页面发布**：**2,000-4,000 个**（4 周累计）

**判断标准**：
- 如果索引率 ≥ 95% → 进入下一阶段
- 如果索引率 < 90% → 延长测试期
- 如果出现异常 → 暂停并分析

---

### 阶段 3：加速扩张（第 9-16 周）

**目标**：
- 逐步增加发布量
- 持续监控质量
- 建立稳定节奏

**行动**：
- 📝 每周发布 **1,500-2,500 个新页面**（Tier 2 + Tier 3 noindex）
- 📊 每周检查 GSC 健康指标
- 📊 每月分析索引率趋势
- 🔧 持续优化内容质量

**新页面发布**：**12,000-20,000 个**（8 周累计）

**Tier 3 策略**：
- 新页面先 `noindex = true`
- 内链打通（至少 3 条）
- 观察 7-14 天
- 质量确认后批量改为 `index`

**判断标准**：
- 如果索引率 ≥ 94% → 继续加速
- 如果索引率 90-94% → 维持当前节奏
- 如果索引率 < 90% → 降速或暂停

---

### 阶段 4：规模化扩张（第 17-24 周）

**目标**：
- 达到每周 3,000-5,000 个新页面
- 保持高质量标准
- 持续监控

**行动**：
- 📝 每周发布 **3,000-5,000 个新页面**（Tier 2 + Tier 3 noindex）
- 📊 每周深度检查 GSC
- 📊 每月全面分析
- 🔧 持续优化模板和内容

**新页面发布**：**24,000-40,000 个**（8 周累计）

**Tier 3 解封**：
- 每周解封 500-1,000 个 Tier 3 页面（`noindex = false`）
- 进入 sitemap-tier3
- 持续监控索引率

**判断标准**：
- 如果索引率 ≥ 93% → 可以继续
- 如果索引率 90-93% → 维持或微调
- 如果索引率 < 90% → 必须降速

---

### 阶段 5：达到目标（第 25-32 周）

**目标**：
- 达到 10 万页面
- 保持健康指标
- 建立长期节奏

**行动**：
- 📝 根据实际情况调整发布量
- 📊 持续监控所有指标
- 🔧 持续优化

**累计新页面**：**70,000 个**（达到 10 万总页面）

---

## 🛡️ 四、Tier3 解封流程（标准化）

### 步骤 1：Tier3 上线（noindex）

**SQL**：
```sql
-- 新 Tier3 页面上线：noindex, follow
UPDATE use_cases
SET 
  noindex = true,
  in_sitemap = false,
  tier = 3,
  index_health_status = 'tier3_noindex',
  updated_at = NOW()
WHERE is_published = true
  AND tier = 3
  AND noindex IS NULL;
```

---

### 步骤 2：内链打通（至少 3 条来自 Tier1/Tier2）

**要求**：
- 至少 3 条内链来自 Tier1/Tier2 页面
- 内链文本包含 Tier3 页面的关键词
- 内链位置：正文、相关页面、导航

**检查 SQL**：
```sql
-- 检查 Tier3 页面的内链数量
SELECT 
  uc.id,
  uc.slug,
  uc.title,
  COUNT(link.id) as internal_link_count
FROM use_cases uc
LEFT JOIN tier1_internal_links link ON link.target_slug = uc.slug
WHERE uc.tier = 3
  AND uc.noindex = true
GROUP BY uc.id, uc.slug, uc.title
HAVING COUNT(link.id) < 3;
```

---

### 步骤 3：观察 7-14 天数据

**监控指标**：
- 曝光数（GSC）
- 点击数（GSC）
- 抓取次数（GSC）
- 内链点击（如果有追踪）

**SQL 检查**：
```sql
-- 检查 Tier3 页面是否有足够数据
SELECT 
  uc.id,
  uc.slug,
  uc.title,
  uc.created_at,
  CASE 
    WHEN uc.created_at < NOW() - INTERVAL '14 days' THEN 'READY'
    WHEN uc.created_at < NOW() - INTERVAL '7 days' THEN 'CHECKING'
    ELSE 'TOO_NEW'
  END as status
FROM use_cases uc
WHERE uc.tier = 3
  AND uc.noindex = true
  AND uc.index_health_status = 'tier3_noindex'
ORDER BY uc.created_at ASC;
```

---

### 步骤 4：批量改为 index

**SQL**：
```sql
-- Tier3 解封：批量改为 index
UPDATE use_cases
SET 
  noindex = false,
  in_sitemap = true,
  index_health_status = 'tier3_indexed',
  updated_at = NOW()
WHERE tier = 3
  AND noindex = true
  AND index_health_status = 'tier3_noindex'
  AND created_at < NOW() - INTERVAL '14 days'  -- 至少 14 天
  AND (
    -- 检查内链数量
    (SELECT COUNT(*) FROM tier1_internal_links WHERE target_slug = use_cases.slug) >= 3
  );
```

---

### 步骤 5：进入 sitemap-tier3

**自动处理**：
- `in_sitemap = true` 的 Tier3 页面会自动进入 sitemap-tier3
- sitemap-tier3 只包含已解封的 Tier3 页面

---

## 📋 五、Sitemap 结构（最终版）

### 当前结构

```
/sitemap.xml (唯一入口)
└── /sitemaps/tier1-1.xml
    /sitemaps/tier1-2.xml
    ...
```

### 目标结构

```
/sitemap-index.xml (主入口)
├── /sitemap-core.xml (固定核心：功能/模型/价格)
├── /sitemap-tier1.xml (Tier 1 分片)
├── /sitemap-tier2.xml (Tier 2 分片)
└── /sitemap-tier3.xml (Tier 3 分片，只放已解封的)
```

---

## 🚨 六、风险控制机制

### 1. 自动刹车机制（Auto-Brake）

**触发条件**：
- 索引率 < 90% 持续 7 天
- 未编入索引数量激增（+50% 以上）
- Crawl budget 明显下降
- Soft 404 数量 > 5%

**行动**：
- ⛔ 立即停止新页面发布
- 🔍 深度分析问题原因
- 🔧 修复所有问题
- ✅ 等待指标恢复后再继续

---

### 2. Tier3 质量检查

**检查项**：
- 内容完整性（≥ 300 字）
- 差异化程度（行业特定内容）
- 内链数量（≥ 3 条）
- 技术健康（无 404/500 错误）

**SQL**：
```sql
-- Tier3 质量检查
SELECT 
  id,
  slug,
  title,
  LENGTH(content) as content_length,
  CASE 
    WHEN LENGTH(content) < 300 THEN 'THIN_CONTENT'
    WHEN content NOT LIKE '%FAQ%' THEN 'MISSING_FAQ'
    WHEN (SELECT COUNT(*) FROM tier1_internal_links WHERE target_slug = use_cases.slug) < 3 THEN 'MISSING_LINKS'
    ELSE 'OK'
  END as quality_status
FROM use_cases
WHERE tier = 3
  AND noindex = true
  AND index_health_status = 'tier3_noindex'
LIMIT 100;
```

---

## 📊 七、监控仪表板

### 每周监控指标

| 指标 | 健康阈值 | 当前值 | 状态 |
|------|---------|--------|------|
| **总页面数** | - | _____ | - |
| **Tier 1 页面** | - | _____ | - |
| **Tier 2 页面** | - | _____ | - |
| **Tier 3 页面（noindex）** | - | _____ | - |
| **Tier 3 页面（indexed）** | - | _____ | - |
| **已编入索引** | - | _____ | - |
| **索引率** | ≥ 90% | _____% | ⬜ |
| **未编入索引** | ≤ 10% | _____% | ⬜ |
| **Soft 404** | < 3% | _____% | ⬜ |
| **Crawl requests/day** | 稳定或上升 | _____ | ⬜ |
| **新页面发布（本周）** | 按计划 | _____ | ⬜ |

---

## 📝 八、执行检查清单

### 准备阶段（第 1-4 周）

- [ ] 建立站点分层（Tier 1/2/3）
- [ ] 修复所有 Soft 404
- [ ] 增强现有页面差异化
- [ ] 建立每周 GSC 检查流程
- [ ] 优化 sitemap 结构

---

### 测试阶段（第 5-8 周）

- [ ] 每周发布 500-1,000 个新页面（Tier 2）
- [ ] 每周检查索引率（目标：≥ 95%）
- [ ] 每周检查未编入原因
- [ ] 每周检查内容质量
- [ ] 记录所有数据

---

### 扩张阶段（第 9-24 周）

- [ ] 逐步增加发布量（每周 1,500-5,000）
- [ ] Tier3 页面先 noindex
- [ ] 内链打通（至少 3 条）
- [ ] 观察 7-14 天数据
- [ ] 批量解封 Tier3 页面
- [ ] 每周检查所有健康指标
- [ ] 每月分析索引率趋势

---

### 达到目标（第 25-32 周）

- [ ] 达到 10 万页面
- [ ] 保持健康指标（索引率 ≥ 90%）
- [ ] 建立长期节奏
- [ ] 持续监控和优化

---

## 🎯 九、关键成功因素

### 1. 分层策略

**必须**：
- ✅ Tier 1：全 index，高质量
- ✅ Tier 2：index，标准质量
- ✅ Tier 3：先 noindex，观察后再放开

---

### 2. 节奏控制

**必须**：
- ✅ 每天新增：200-500
- ✅ 每周新增：1,500-3,000
- ✅ 每月净增：不超过现有规模的 30%

---

### 3. 质量保证

**必须**：
- ✅ 内容完整性（≥ 300 字）
- ✅ 差异化程度（行业特定）
- ✅ 技术健康（无错误）

---

## 📚 十、相关文档

- [未收录 URL 分类工具](./UNINDEXED_URL_CLASSIFICATION.md)
- [AI 页面模板增强清单](./AI_PAGE_TEMPLATE_ENHANCEMENT.md)
- [Tier Page 模板 V2](./TIER_PAGE_TEMPLATE_V2.md)
- [GSC 健康指标](./GSC_HEALTH_INDICATORS_AI_SITES.md)

---

**最后更新**：2026-01-22  
**当前状态**：✅ 准备阶段（稳定现有 3 万页面）
