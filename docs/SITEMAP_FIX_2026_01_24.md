# Sitemap Off-by-One Bug 修复记录

> **日期**: 2026-01-24
> **状态**: ✅ 已修复并部署
> **影响**: GSC 显示 "已发现网页 = 0" 的根本原因

---

## 问题诊断

### 症状

在 Google Search Console 中观察到：

| Sitemap | 状态 | 已发现网页 |
|---------|------|-----------|
| `/sitemap.xml` | 成功 | **0** |
| `/sitemap-index.xml` | 成功 | 0 |
| `/sitemap-core.xml` | 成功 | 276 |

用户最初以为这是 GSC 的 UI 延迟，但实际上是一个代码 bug。

### 根本原因

**Sitemap index 指向了空的 chunk 文件**

```
错误状态：
/sitemap.xml (index)
└── 引用 /sitemaps/tier1-1.xml ← 这个是空的！(0 URLs)

/sitemaps/tier1-0.xml (1000 URLs) ← 没有被 index 引用！
```

### 技术细节

项目中存在两套 sitemap 路由，使用不同的索引起始值：

| 路由文件 | 处理的 URL | 索引起始 | 数据源 |
|----------|-----------|----------|--------|
| `app/sitemaps/[name]/route.ts` | `tier1-0.xml` | 从 0 开始 | `get_tier1_sitemap_chunk` RPC |
| `app/sitemaps/tier1-[...n]/route.ts` | `tier1-1.xml`+ | 从 1 开始 | `page_scores` 表 |

而 `/sitemap.xml` 和 `/sitemap-index.xml` 的代码使用 `i + 1` 生成 chunk 引用：

```typescript
// 错误代码
const tier1Sitemaps = Array.from({ length: tier1Chunks }, (_, i) => ({
  loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,  // ❌ 从 1 开始
  lastmod: now,
}))
```

这导致：
- `tier1-1.xml` 被引用（但它查询 `page_scores` 表返回 0 条）
- `tier1-0.xml` 没有被引用（但它有 1000 个 URL）

---

## 修复方案

### 代码变更

**文件 1**: `app/sitemap.xml/route.ts`

```diff
-    // 构建 Tier1 分片列表（从 1 开始，与 /sitemaps/tier1-[...n]/route.ts 保持一致）
+    // 构建 Tier1 分片列表（从 0 开始，与 /sitemaps/[name]/route.ts 保持一致）
+    // 注意：[name]/route.ts 处理 tier1-0.xml，使用 get_tier1_sitemap_chunk RPC
     const tier1Sitemaps = Array.from({ length: tier1Chunks }, (_, i) => ({
-      loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
+      loc: `${baseUrl}/sitemaps/tier1-${i}.xml`,
       lastmod: now,
     }))
```

**文件 2**: `app/sitemap-index.xml/route.ts`

```diff
-    // 构建 Tier1 分片列表
+    // 构建 Tier1 分片列表（从 0 开始，与 /sitemaps/[name]/route.ts 保持一致）
     const tier1Sitemaps = Array.from({ length: tier1Chunks }, (_, i) => ({
-      loc: `${baseUrl}/sitemaps/tier1-${i + 1}.xml`,
+      loc: `${baseUrl}/sitemaps/tier1-${i}.xml`,
       lastmod: now,
     }))
```

### Git 操作记录

```bash
# 分支
git checkout -b fix/sitemap-tier1-off-by-one

# 提交
git commit -m "fix(seo): sitemap tier1 chunk index off-by-one (tier1-0 instead of empty tier1-1)"

# 合并到 main
git checkout main
git merge fix/sitemap-tier1-off-by-one
git push origin main
```

**Commit**: `d3558f12`

---

## 部署验证

### 验证结果 (2026-01-24 19:52 CST)

| 检查项 | 状态 | 详情 |
|--------|------|------|
| `/sitemap.xml` 指向 `tier1-0.xml` | ✅ | 已确认 |
| `/sitemap-index.xml` 指向 `tier1-0.xml` | ✅ | 已确认 |
| `tier1-0.xml` HTTP 状态 | ✅ | 200 |
| `tier1-0.xml` Content-Type | ✅ | application/xml |
| `tier1-0.xml` URL 数量 | ✅ | 1000 |
| 抽样 URL 可访问 | ✅ | 200 |
| 抽样 URL canonical 正确 | ✅ | 指向自己 |

### 修复后的 Sitemap 结构

```
/sitemap.xml (index)
└── /sitemaps/tier1-0.xml (1000 URLs) ✅

/sitemap-index.xml (备用 index)
├── /sitemaps/tier1-0.xml (1000 URLs) ✅
└── /sitemap.xml

/sitemap-core.xml (独立，276 URLs) ✅
```

### 验证命令

```bash
# 快速验证
curl -s https://sora2aivideos.com/sitemap.xml | head -10

# 完整验证脚本
./scripts/verify_sitemap_fix.sh
```

---

## GSC 操作清单

### 立即执行（部署后 10 分钟内）

- [ ] **重新提交主 sitemap**
  ```
  GSC → Sitemaps → /sitemap.xml → 重新提交
  ```

- [ ] **额外提交 tier1-0**
  ```
  GSC → Sitemaps → 新增：sitemaps/tier1-0.xml → 提交
  ```

- [ ] **URL Inspection 抽查**（可选但推荐）
  - 挑选 2-3 个重要的 `/use-cases/` URL
  - 执行 "请求编入索引"

### 预期时间线

| 指标 | 预期更新时间 |
|------|-------------|
| GSC Sitemap "已发现网页" | 24-72 小时 |
| Pages 报告 "已发现-尚未编入索引" | 几小时内 |
| 实际开始编入索引 | 3-7 天 |

---

## 14 天监控计划

### Day 0（今天）

- [x] 修复代码并部署
- [x] 验证 sitemap 结构正确
- [ ] GSC 重新提交 sitemap
- [ ] GSC 提交 tier1-0.xml
- [ ] URL Inspection 抽查 5 个 URL

### Day 1-3（冷启动关键期）

每天检查 3 个面板：

1. **Pages → 未编入索引**
   - 重点看："已发现 - 尚未编入索引" 是否增长

2. **Pages → 已编入索引**
   - 重点看：总数是否微增

3. **Sitemaps**
   - 只看状态，不看发现数（index 显示 0 是正常的）

**正常表现**：
- "已发现 - 尚未编入索引" 上升
- sitemap index 可能仍显示 0（正常）

### Day 4-7（扩展期）

如果 Day 1-3 有上涨信号：
- 考虑添加更多 tier1 chunk

如果 Day 1-3 没有上涨：
- 降低 chunk 大小
- 检查 robots.txt
- 增加内链

### Day 8-14（放量期）

监控指标：
- Coverage 流水线：Discovered → Crawled → Indexed
- "已抓取 - 尚未编入索引" 数量（说明内容质量问题）
- "重复网页" 数量（说明 canonical 问题）

---

## 相关文件

| 文件 | 描述 |
|------|------|
| `app/sitemap.xml/route.ts` | 主 sitemap index |
| `app/sitemap-index.xml/route.ts` | 备用 sitemap index |
| `app/sitemaps/[name]/route.ts` | tier1-0.xml 路由（使用 RPC） |
| `app/sitemaps/tier1-[...n]/route.ts` | tier1-1+ 路由（查询 page_scores） |
| `scripts/verify_sitemap_fix.sh` | 部署验证脚本 |
| `scripts/gsc_sitemap_check.sh` | 日常健康检查脚本 |
| `docs/GSC_SITEMAP_14DAY_PLAYBOOK.md` | 14 天行动手册 |

---

## 经验教训

### 为什么这个 bug 难以发现

1. **GSC 状态显示 "成功"**
   - 空的 `<urlset>` 在 XML 格式上是合法的
   - Google 不会报错，只是没东西可发现

2. **两套路由系统**
   - `[name]/route.ts` 从 0 开始
   - `tier1-[...n]/route.ts` 从 1 开始
   - 容易混淆

3. **数据源不一致**
   - tier1-0 用 RPC 函数
   - tier1-1+ 直接查表
   - 表里可能没数据

### 防止再次发生

1. **统一索引起始值**
   - 所有 tier chunk 应该使用相同的索引方式

2. **添加监控**
   - 部署后自动检查 sitemap URL 数量
   - 如果任何 chunk 返回 0 URL，发出警报

3. **文档化架构**
   - 明确记录哪个路由处理哪些 URL
   - 明确数据源

---

## 总结

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| sitemap.xml 引用 | tier1-1.xml (空) | tier1-0.xml (1000 URLs) |
| GSC 可发现 URL | 0 | 1000 |
| 根本原因 | off-by-one 索引错误 | 已修复 |

**核心修复**：`tier1-${i + 1}` → `tier1-${i}`

---

*文档创建时间: 2026-01-24 19:55 CST*
