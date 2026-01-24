# SEO Infra Checklist（上线前 20 项）

> **原则**：不追求"全绿"，只追求不会出现 silent failure
> **使用场景**：每次发布前、每周例检、事故排查

---

## A. Sitemap & Crawl（1-8）

### 1️⃣ Sitemap Index 必须指向 tier1-0

```bash
curl -s https://sora2aivideos.com/sitemap.xml | grep tier1
# ✅ 必须看到 tier1-0.xml
# ❌ 如果是 tier1-1.xml → 2026-01-24 事故重演
```

- [ ] 确认 sitemap.xml 引用 tier1-0.xml

---

### 2️⃣ 所有 Sitemap Chunk URL 数 > 0

```bash
curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -c "<url>"
# ✅ 必须 > 0
# ❌ = 0 → 阻断发布
```

- [ ] tier1-0.xml URL 数 > 0
- [ ] sitemap-core.xml URL 数 > 0

---

### 3️⃣ Sitemap Content-Type 正确

```bash
curl -I https://sora2aivideos.com/sitemap.xml | grep content-type
# ✅ application/xml
# ❌ text/html（Next.js 常见坑）
```

- [ ] Content-Type: application/xml

---

### 4️⃣ Sitemap 不允许 Redirect

```bash
curl -I https://sora2aivideos.com/sitemap.xml | grep -E "^HTTP|^location"
# ✅ HTTP/2 200
# ❌ 301/302 → Google 不友好
```

- [ ] HTTP 200，无重定向

---

### 5️⃣ Sitemap URL 数 ≤ 50,000

- [ ] 每个 chunk ≤ 50,000（推荐 1k-5k）
- [ ] 实际遵循：Tier1 = 1k，Tier2 = 2-5k

---

### 6️⃣ Sitemap Index "已发现数" 可以是 0

- [ ] 理解：index 显示 0 是正常的
- [ ] 真正看：Pages 报告的 Discovered/Indexed

---

### 7️⃣ Sitemap URL 必须返回 200

```bash
# 抽查 sitemap 中的 URL
URL=$(curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -o '<loc>[^<]*</loc>' | head -1 | sed 's/<[^>]*>//g')
curl -I "$URL" | grep HTTP
# ✅ HTTP/2 200
# ❌ 301/302/403/404
```

- [ ] 抽查 5 个 URL 均返回 200

---

### 8️⃣ Sitemap URL Canonical 必须 Self

```bash
curl -s "$URL" | grep -oE '<link[^>]*rel="canonical"[^>]*>'
# ✅ canonical 指向自己
# ❌ 指向其他 URL
```

- [ ] 抽查 5 个 URL canonical 均正确

---

## B. URL & 内容（9-14）

### 9️⃣ URL 结构必须扁平

- [ ] 推荐：`/country/use-case`
- [ ] 避免：`/country/category/subcategory/use-case`

---

### 🔟 每个 URL 必须有唯一内容指纹

- [ ] AI 生成页有 prompt hash / embedding 去重
- [ ] 不存在纯模板填充（只换变量名）

---

### 1️⃣1️⃣ Canonical 方向正确

- [ ] Tier1 canonical → 自己
- [ ] Tier2 可以 canonical → Tier1
- [ ] ❌ Tier1 永不 canonical → Tier2

---

### 1️⃣2️⃣ 每页必须有内链

- [ ] 每个 Tier2 页至少有 1 条链接指向 Tier1/Core
- [ ] 不存在"孤岛页"

---

### 1️⃣3️⃣ robots.txt 不拦截 Sitemap

```bash
curl -s https://sora2aivideos.com/robots.txt | grep -i sitemap
# ✅ Sitemap: https://...
# ❌ Disallow: /sitemaps
```

- [ ] robots.txt 声明 Sitemap
- [ ] 无误杀 Disallow

---

### 1️⃣4️⃣ noindex 页面不在 Sitemap

- [ ] `noindex = true` 的页面不出现在 sitemap
- [ ] sitemap 是"索引候选白名单"

---

## C. 系统 & 监控（15-20）

### 1️⃣5️⃣ Sitemap 健康检查自动化

```sql
select * from v_seo_dashboard_current;
-- tier1_empty_chunks 必须 = 0
```

- [ ] 每日自动运行 `sitemap_health_check`
- [ ] tier1-0 = 0 → FATAL 告警

---

### 1️⃣6️⃣ GSC 数据不作为实时判断

- [ ] 理解：GSC 数据是日级/周级延迟
- [ ] 不用 GSC 做分钟级决策

---

### 1️⃣7️⃣ Pages 报告是主仪表盘

- [ ] 主要看：Discovered → Crawled → Indexed
- [ ] 不是：Sitemap "已发现网页"

---

### 1️⃣8️⃣ 发布后 24h 必须有 Discovered

- [ ] 如果 24h 后 Discovered 无变化 → 检查 sitemap/内链
- [ ] 不要等 7 天才发现问题

---

### 1️⃣9️⃣ 批量生成必须有 Kill-Switch

- [ ] 一键停止生成（代码开关）
- [ ] 一键 noindex Tier2（数据库操作）
- [ ] Kill-switch 已测试可用

---

### 2️⃣0️⃣ Credit / Batch / SEO 解耦

- [ ] SEO 失败 ≠ 业务失败
- [ ] credit_wallet 独立于 SEO 状态
- [ ] 批量生成不依赖索引成功

---

## 快速检查命令

```bash
# 一键运行所有检查
./scripts/gsc_sitemap_check.sh

# 或者手动快速检查
curl -s https://sora2aivideos.com/sitemap.xml | head -10
curl -s https://sora2aivideos.com/sitemaps/tier1-0.xml | grep -c "<url>"
curl -I https://sora2aivideos.com/sitemaps/tier1-0.xml | head -5
```

---

## Checklist 使用时机

| 场景 | 必检项 |
|------|--------|
| 每次发布 | 1-8（Sitemap & Crawl） |
| 每周例检 | 全部 20 项 |
| 事故排查 | 从 1 开始逐项 |
| 扩容前 | 15-20（系统 & 监控） |

---

## 通过标准

| 级别 | 标准 |
|------|------|
| ✅ 可发布 | 1-8 全部通过，15 通过 |
| ⚠️ 需观察 | 9-14 有 1-2 项未通过 |
| ❌ 禁止发布 | 1-8 任一未通过 |

---

*版本: 1.0 | 创建时间: 2026-01-24*
