# 大规模 AI 站点的 GSC 健康指标 Checklist

> **适用场景**：大规模 AI 自动生成站点（如 sora2aivideos.com）  
> **更新频率**：每周 / 每月检查  
> **当前状态**：✅ 优秀区间（已编入 ≈ 29,000，未编入 ≈ 1,126，≈ 3.7%）

---

## 📋 一、6 个「未编入索引原因」逐条解读

### 当前比例分析

- **已编入索引**：≈ 29,000
- **未编入索引**：≈ 1,126（≈ 3.7%）
- **结论**：✅ **非常健康，不是危险信号**

---

### 1️⃣ 已发现 - 目前未编入索引（最常见）

**GSC 文案**：
> 已发现 – 尚未编入索引

**含义（非常重要）**：
- Google 已经抓到了 URL
- 但暂时没决定是否值得进主索引
- 对你来说 = **正常 + 健康**

**为什么会出现**：
- 短时间生成成千上万页面
- 页面模板高度一致（AI 场景页）
- Google 的策略：先放观察池 → 看是否有点击 / 内链 / 行为数据

**处理方式**：
- ✅ **你不需要处理**
- ❌ **不要删**
- ❌ **不要 noindex**

**📌 什么时候才需要动？**
- 如果 **30–45 天后**，这一类 URL 完全没变化
- 再考虑增强内容差异化

---

### 2️⃣ 抓取 - 尚未编入索引

**和 #1 很像，但更偏技术侧**

**常见原因**：
- 爬虫抓得太快（你页面增长很猛）
- crawl budget 在排队
- 新页面还没轮到

**👉 大站的必经阶段**

**处理方式**：
- ✅ 你的 sitemap、HTTP 200、robots 都正常
- 👉 这类 = **等**

---

### 3️⃣ 重复网页，Google 选择了不同的规范网页（canonical）

**这是 AI 站点一定会遇到的**

**典型触发方式**：
- 国家页 / 场景页 / 关键词页
- 结构类似、正文相似
- Google 觉得："这些我只要留一个代表页就好"

**这不是惩罚，是"去重决策"**

**📌 危险吗？**
- ❌ **不危险**
- ⚠️ 但说明你页面差异度不够强

**👉 后面可以通过**：
- 模板中引入变量段落
- 示例视频 / use case 差异
- 国家/行业独立 FAQ
- 来"抢回 canonical 主权"

---

### 4️⃣ 替代网页（带有正确的规范标记）

**含义**：
- 你自己声明了 canonical
- Google 接受了
- 👉 **这是好事，不是坏事**

**典型情况**：
- `/video-generator`
- `/ai-video-generator-free`
- 你选了一个主页面，其他当辅助页

**处理方式**：
- ✅ **完全不用管**

---

### 5️⃣ 软 404（Soft 404）⚠️

**⚠️ 这是 6 个里唯一需要关注的**

**常见触发**：
- 页面内容太薄（像占位页）
- "暂无内容""正在生成"这种文案
- AI 页还没填完就放出来

**📌 对策（非常简单）**：

确保每个 indexable 页面：
- ✅ 有实质性正文（**300+ 字**）
- ✅ 有明确用途说明
- ✅ 不要出现"coming soon"语义

**👉 这类页面建议后处理**

**检查 SQL**：
```sql
-- 检查内容过薄的已发布页面
SELECT id, slug, title, 
       LENGTH(content) as content_length
FROM use_cases 
WHERE is_published = true 
  AND in_sitemap = true
  AND (content IS NULL 
       OR LENGTH(content) < 300
       OR content LIKE '%coming soon%'
       OR content LIKE '%暂无内容%'
       OR content LIKE '%正在生成%')
ORDER BY content_length ASC;
```

---

### 6️⃣ 被 robots.txt 或 noindex 阻止

**如果你看到这个**：
- 👉 **优先级最高，立刻修**

**但从你截图判断**：
- 你现在基本没有这个问题 👍

**检查 SQL**：
```sql
-- 检查被阻止的已发布页面
SELECT id, slug, title, noindex, in_sitemap
FROM use_cases 
WHERE is_published = true 
  AND (noindex = true OR in_sitemap = false);
```

---

## 📊 二、大规模 AI 站点的 GSC 健康指标 Checklist

### ✅ 1️⃣ 索引健康（最重要）

| 指标 | 健康区间 | 当前状态 | 判断 |
|------|---------|---------|------|
| **已编入 / 已发现** | ≥ 70% | ≈ 96% | 🔥 **优秀** |
| **未编入原因 ≤ 10%** | ✅ | ≈ 3.7% | ✅ **健康** |
| **Soft 404** | < 3% | 需检查 | ⚠️ **需监控** |
| **被阻止** | 0 或接近 0 | 接近 0 | ✅ **正常** |

**👉 你现在明显在优秀区间**

---

### ✅ 2️⃣ Sitemap 健康

| 项 | 标准 | 当前状态 | 判断 |
|---|------|---------|------|
| **sitemap 入口** | 1 个（index） | ✅ `/sitemap.xml` | ✅ **已统一** |
| **sitemap 返回码** | 200 | ✅ | ✅ **正常** |
| **sitemap 中 URL** | ≤ 50,000 / 文件 | ✅ 每片 20k | ✅ **符合** |
| **lastmod** | 有，且随内容更新 | ✅ | ✅ **正常** |

**👉 你现在只需要合并 sitemap 入口即可（已完成）**

**验证命令**：
```bash
# 检查 sitemap 结构
curl -s https://sora2aivideos.com/sitemap.xml | grep -c "<loc>"

# 检查 sitemap 状态码
curl -I https://sora2aivideos.com/sitemap.xml
```

---

### ✅ 3️⃣ Crawl & 渲染

| 项 | 判断 | 当前状态 | 说明 |
|---|------|---------|------|
| **URL 检查 → Google 渲染** | 正常 | ✅ | Next.js SSR |
| **JS 依赖内容** | SSR 或静态可见 | ✅ | Next.js + Vercel |
| **页面首屏** | 非空 | ✅ | 内容完整 |

**👉 Next.js + Vercel = 天然优势**

**验证工具**：
- Google Search Console → URL 检查工具
- 测试实际网址功能

---

### ✅ 4️⃣ AI 站点专属质量信号（很关键）

**Google 已经在针对 AI 内容做筛选，你要看这几件事：**

#### 页面是否：

| 检查项 | 标准 | 当前状态 | 说明 |
|--------|------|---------|------|
| **明确解决某个问题** | ✅ | ✅ | 场景页明确 |
| **有真实使用场景** | ✅ | ✅ | use case 驱动 |
| **有示例 / 操作步骤** | ✅ | ✅ | 内容模板包含 |
| **有站内引用 / 内链** | ✅ | ✅ | slug matrix |

#### 是否避免：

| 检查项 | 标准 | 当前状态 | 说明 |
|--------|------|---------|------|
| **纯模板重复** | ❌ | ⚠️ | 需持续优化 |
| **关键词堆砌** | ❌ | ✅ | 内容自然 |

**👉 你已经在做场景 + 国家 + 功能矩阵，方向完全对**

**持续优化建议**：
- 增加页面间内容差异化
- 引入更多变量段落
- 强化国家/行业特定内容

---

### ✅ 5️⃣ "不用慌"的信号（反而是好事）

**看到这些，不要紧张**：

| 现象 | 含义 | 判断 |
|------|------|------|
| **「已发现未编入」数量增加** | Google 在观察池 | ✅ **正常** |
| **GSC 图表突然暴涨** | 快速感知新内容 | ✅ **正常** |
| **Google 过几天又回收一部分** | 质量筛选机制 | ✅ **正常** |

**👉 这说明**：
- 你已经进入 Google 的"规模评估池"
- Google 在认真评估你的内容
- 这是能做成"大站"的信号

---

## 🎯 三、当前 SEO 状态判断

### 🔥 你已经不是"能不能做 SEO"的阶段
### 🔥 你现在在"Google 是否愿意长期给你 crawl budget"阶段

**从你这波数据看**：
- ✅ sitemap 正常
- ✅ 编入比例极高（≈ 96%）
- ✅ 页面增长被快速感知
- ✅ 未编入比例极低（≈ 3.7%）

**👉 这是一个能做成"大站"的信号**

---

## 📅 四、每周 / 每月检查清单

### 每周检查（5 分钟）

1. **打开 GSC → Pages**
   - [ ] 记录：已编入索引数量
   - [ ] 记录：未编入索引数量
   - [ ] 计算：编入比例（目标 ≥ 70%）

2. **打开 GSC → Pages → 未编入索引原因**
   - [ ] 检查 Soft 404 数量（目标 < 3%）
   - [ ] 检查"被阻止"数量（目标 = 0）
   - [ ] 记录"已发现未编入"趋势

3. **打开 GSC → Sitemaps**
   - [ ] 确认 `/sitemap.xml` 状态正常
   - [ ] 检查最后读取时间（应在 24 小时内）

### 每月检查（15 分钟）

1. **索引健康趋势**
   - [ ] 对比 30 天前的编入比例
   - [ ] 分析未编入原因的变化趋势
   - [ ] 识别需要优化的类别

2. **内容质量检查**
   - [ ] 运行 Soft 404 检查 SQL
   - [ ] 检查内容过薄页面（< 300 字）
   - [ ] 分析重复内容 / canonical 问题

3. **技术健康检查**
   - [ ] 验证 sitemap 可访问性
   - [ ] 检查 robots.txt 配置
   - [ ] 确认页面渲染正常

---

## 🚨 五、风险信号与应对

### 🟢 健康期（当前状态）

**特征**：
- ✅ 编入比例 ≥ 70%
- ✅ 未编入比例 ≤ 10%
- ✅ Soft 404 < 3%
- ✅ 被阻止 = 0

**行动**：
- ✅ 维持当前节奏
- ✅ 持续监控
- ✅ 优化内容差异化

---

### 🟡 限速期

**特征**：
- ⚠️ 编入比例 50-70%
- ⚠️ 未编入比例 10-20%
- ⚠️ Soft 404 3-5%

**行动**：
- 🔻 发布量减半
- 🔻 增强内容差异化
- 🔻 修复 Soft 404 页面
- ❌ 不要增加新内容类型

---

### 🔴 风险期

**特征**：
- 🚨 编入比例 < 50%
- 🚨 未编入比例 > 20%
- 🚨 Soft 404 > 5%
- 🚨 被阻止 > 0

**行动**：
- ⛔ 立刻停止发布 7 天
- ⛔ 修复所有 Soft 404
- ⛔ 检查 robots.txt / noindex
- ⛔ 增强内容质量
- ❌ 绝对不碰新内容类型

---

## 📝 六、快速诊断 SQL 查询

### 检查 Soft 404 风险页面

```sql
-- 内容过薄的已发布页面
SELECT 
  id, 
  slug, 
  title, 
  LENGTH(content) as content_length,
  CASE 
    WHEN content IS NULL THEN 'NULL'
    WHEN LENGTH(content) < 300 THEN '< 300 chars'
    WHEN content LIKE '%coming soon%' THEN 'Coming Soon'
    WHEN content LIKE '%暂无内容%' THEN 'Empty CN'
    WHEN content LIKE '%正在生成%' THEN 'Generating'
    ELSE 'OK'
  END as issue_type
FROM use_cases 
WHERE is_published = true 
  AND in_sitemap = true
  AND (
    content IS NULL 
    OR LENGTH(content) < 300
    OR content LIKE '%coming soon%'
    OR content LIKE '%暂无内容%'
    OR content LIKE '%正在生成%'
  )
ORDER BY content_length ASC
LIMIT 100;
```

### 检查被阻止的页面

```sql
-- 被 noindex 或不在 sitemap 的已发布页面
SELECT 
  id, 
  slug, 
  title, 
  noindex, 
  in_sitemap,
  CASE 
    WHEN noindex = true THEN 'noindex=true'
    WHEN in_sitemap = false THEN 'in_sitemap=false'
    ELSE 'OK'
  END as issue_type
FROM use_cases 
WHERE is_published = true 
  AND (noindex = true OR in_sitemap = false)
ORDER BY updated_at DESC
LIMIT 100;
```

### 检查内容重复风险

```sql
-- 标题重复的页面（可能触发 canonical 问题）
SELECT 
  title, 
  COUNT(*) as count,
  ARRAY_AGG(slug) as slugs
FROM use_cases
WHERE is_published = true
  AND in_sitemap = true
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY count DESC
LIMIT 50;
```

---

## 🎓 七、关键理解

### 1. 未编入 ≠ 惩罚

**Google 的策略**：
- 先发现 → 再抓取 → 再评估 → 最后索引
- 大规模站点必然有"观察池"
- 这是正常流程，不是惩罚

### 2. 比例比绝对数重要

**关键指标**：
- 编入比例 ≥ 70% = 健康
- 未编入比例 ≤ 10% = 正常
- Soft 404 < 3% = 可接受

### 3. 趋势比单点重要

**判断标准**：
- 编入比例在上升 = 好信号
- 未编入比例在下降 = 好信号
- 单次波动 = 正常现象

### 4. AI 站点特殊考虑

**Google 的筛选机制**：
- 对 AI 内容更谨慎
- 需要更多质量信号
- 需要时间建立信任

**你的优势**：
- 场景 + 国家 + 功能矩阵 = 差异化
- 内容模板完整 = 质量保证
- 内链结构清晰 = 信号明确

---

## 📚 相关文档

- [Index Health Dashboard](./INDEX_HEALTH_DASHBOARD.md)
- [GSC Health Check Report](../GSC_HEALTH_CHECK_REPORT.md)
- [Sitemap 优化指南](./TIER1_SITEMAP_GUIDE.md)

---

**最后更新**：2026-01-22  
**当前状态**：✅ 优秀区间，持续监控即可
