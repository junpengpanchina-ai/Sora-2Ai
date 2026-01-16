# 构建配置指南

## 🚀 推荐配置

### 本地开发

```bash
# 使用默认值（生成 10 个静态页面）
npm run build
```

**说明**：
- 生成最新的 10 个 use cases 页面为静态页面
- 其他页面使用动态渲染 + ISR
- 构建时间：约 1-3 分钟

### CI/CD 环境

```bash
# 跳过静态生成，加快构建速度
SKIP_STATIC_GENERATION=true npm run build
```

**说明**：
- 所有页面使用动态渲染 + ISR
- 构建时间：约 30-60 秒
- 首次访问时动态生成，后续使用缓存

### 生产环境（Vercel）

**推荐配置**：
- 在 Vercel Dashboard 中设置环境变量：
  - `SKIP_STATIC_GENERATION=true` （推荐）
  - 或 `BUILD_STATIC_LIMIT=20` （如果需要预生成一些页面）

**说明**：
- Vercel 会自动使用 ISR（Incremental Static Regeneration）
- 首次访问时动态生成，后续使用缓存（1小时）
- 无需担心构建超时

## 📋 环境变量说明

| 变量名 | 说明 | 默认值 | 推荐值 |
|--------|------|--------|--------|
| `SKIP_STATIC_GENERATION` | 跳过静态生成，全部使用动态渲染 | `false` | `true` (CI/CD) |
| `BUILD_STATIC_LIMIT` | 静态生成的最大页面数 | `10` | `5-20` |

## ⚙️ 配置位置

### GitHub Actions

已自动配置在：
- `.github/workflows/ci.yml`
- `.github/workflows/vercel-notify.yml`

### Vercel Dashboard

1. 进入项目设置
2. Environment Variables
3. 添加以下变量：

**Production 环境**:
```
SKIP_STATIC_GENERATION=true
```

**或**（如果需要预生成一些页面）:
```
BUILD_STATIC_LIMIT=20
```

## 🔍 验证配置

### 检查构建日志

构建时会看到以下日志：

**跳过静态生成**:
```
[generateStaticParams] SKIP_STATIC_GENERATION=true, skipping static generation, using dynamic rendering
```

**限制静态生成数量**:
```
[generateStaticParams] Generating 10 static pages (limit: 10)
```

### 检查构建输出

构建成功后，查看页面类型：

- `○ (Static)` - 静态预生成
- `● (SSG)` - 静态站点生成
- `ƒ (Dynamic)` - 动态渲染

使用 `SKIP_STATIC_GENERATION=true` 时，`/use-cases/[slug]` 会显示为 `ƒ (Dynamic)`。

## 📊 性能对比

| 配置 | 构建时间 | 首次访问 | 后续访问 | 推荐场景 |
|------|---------|---------|---------|---------|
| 默认（10个静态） | 1-3 分钟 | 快 | 快 | 本地开发 |
| 跳过静态生成 | 30-60 秒 | 稍慢 | 快 | CI/CD、生产 |
| 限制为 5 个 | 1-2 分钟 | 快 | 快 | 快速构建 |

## 🚨 常见问题

### Q: 为什么 CI/CD 构建超时？

A: 默认会尝试生成 100 个静态页面，导致超时。解决方案：
```bash
SKIP_STATIC_GENERATION=true npm run build
```

### Q: 跳过静态生成会影响 SEO 吗？

A: 不会。Next.js ISR 会在首次访问时生成页面，并缓存 1 小时。搜索引擎爬虫访问时会得到完整的 HTML。

### Q: 如何知道页面是静态还是动态？

A: 查看构建输出中的页面类型标记：
- `○` = 静态
- `●` = SSG
- `ƒ` = 动态

## 📚 相关文档

- [Next.js Static Generation](https://nextjs.org/docs/app/building-your-application/data-fetching/generating-static-params)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
- [构建问题排查](./BUILD_TROUBLESHOOTING.md)
