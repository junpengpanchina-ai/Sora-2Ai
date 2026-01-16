# Tier 1 Sitemap - 快速开始

## ✅ 已完成实施

### 1. 新增文件

- ✅ `/app/sitemap-tier1.xml/route.ts` - Tier 1 sitemap 生成器
- ✅ `/app/sitemap-index.xml/route.ts` - Sitemap 索引（主入口）
- ✅ `/lib/utils/tier1-checker.ts` - Tier 1 判定工具

### 2. 更新文件

- ✅ `/app/robots.ts` - 更新为指向 `sitemap-index.xml`

## 🎯 Tier 1 判定规则

页面需要满足 **≥4 条**以下条件：

1. ✅ **有 industry** - `use_cases.industry` 不为空
2. ✅ **有 scene** - `use_cases.use_case_type` 不为空
3. ✅ **正文 ≥ 800 词** - 计算 `content` 的英文单词数
4. ✅ **FAQ ≥ 3 个** - 从 `content` 中解析 FAQ
5. ✅ **有 Steps** - 从 `content` 中检查 How-to / Steps 结构

## 🧩 Sitemap 结构

```
/sitemap-index.xml          # 主入口（Google 从这里开始）
├── /sitemap-tier1.xml      # Tier 1 页面（GEO 核心，优先抓取，priority=0.9）
└── /sitemap.xml            # 全量 sitemap（所有其他页面）
```

## 📋 下一步操作

### 1. 验证 Sitemap（本地测试）

```bash
# 启动开发服务器
npm run dev

# 访问以下 URL 验证：
# http://localhost:3000/sitemap-index.xml
# http://localhost:3000/sitemap-tier1.xml
```

### 2. 部署到生产环境

```bash
# 构建并部署
SKIP_STATIC_GENERATION=true npm run build
```

### 3. 提交到 Google Search Console

1. 打开 Google Search Console
2. 进入 **站点地图** (Sitemaps)
3. 提交新 sitemap：
   ```
   https://sora2aivideos.com/sitemap-index.xml
   ```

**注意**：不用删旧的 sitemap，Google 会自动合并理解。

## 📊 预期效果时间线

### 第 1-7 天
- ✅ Tier1 sitemap 抓取量 ↑
- ✅ "Crawled but not indexed" 会先↑（正常，Google 在消化）

### 第 7-21 天
- ✅ Tier1 的 Index Rate 明显高于 Tier2
- ✅ Avg position 稳定在 10-20

### 第 30-45 天
- ✅ 开始出现长尾 queries
- ✅ AI Overview / 引用型摘要
- ✅ 非品牌曝光

## 🚨 重要提醒

### ❌ 千万不要做的 3 件事

1. ❌ **不要把 Tier1 再扩大到 5 万**
   - Tier1 应该是精选的核心页面
   - 扩大范围会降低 Tier1 的价值

2. ❌ **不要因为"没流量"改结构**
   - 流量是"后果"，不是"信号"
   - 保持 GEO 结构稳定

3. ❌ **不要删 Tier2 / Tier3 页面**
   - 全量 sitemap 仍然重要
   - 只是优先级不同

## 🧠 核心认知

**你现在不是在"等流量"，**  
**你是在把自己从"模板站候选"升级成"可引用知识库"。**

Tier1 sitemap 是这个转变的"官方声明"。

## 📚 相关文档

- [完整实施指南](./docs/TIER1_SITEMAP_GUIDE.md)
- [GEO 和 SEO 统一策略](./GEO_AND_SEO_UNIFIED.md)
