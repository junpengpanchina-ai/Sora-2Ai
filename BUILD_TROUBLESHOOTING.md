# 构建问题排查指南

## 🚨 构建超时问题

如果构建时遇到超时错误（特别是 `/use-cases/[slug]` 页面），可以使用以下解决方案：

### 方案 1：跳过静态生成（快速构建）

在构建时设置环境变量，跳过静态生成：

```bash
# 跳过静态生成，所有页面使用动态渲染
SKIP_STATIC_GENERATION=true npm run build
```

### 方案 2：限制静态生成数量

设置较小的静态生成数量：

```bash
# 只生成 5 个静态页面
BUILD_STATIC_LIMIT=5 npm run build
```

### 方案 3：在 CI/CD 中配置

在 GitHub Actions 或 Vercel 中设置环境变量：

**GitHub Actions (.github/workflows/ci.yml)**:
```yaml
env:
  SKIP_STATIC_GENERATION: 'true'
  # 或
  BUILD_STATIC_LIMIT: '10'
```

**Vercel Dashboard**:
1. 进入项目设置
2. Environment Variables
3. 添加 `SKIP_STATIC_GENERATION=true` 或 `BUILD_STATIC_LIMIT=10`

## 📋 环境变量说明

| 变量名 | 说明 | 默认值 | 推荐值 |
|--------|------|--------|--------|
| `SKIP_STATIC_GENERATION` | 跳过静态生成，全部使用动态渲染 | `false` | `true` (构建时) |
| `BUILD_STATIC_LIMIT` | 静态生成的最大页面数 | `10` | `5-20` |

## ⚠️ 注意事项

1. **跳过静态生成的影响**：
   - ✅ 构建速度大幅提升
   - ✅ 避免构建超时
   - ⚠️ 首次访问页面时可能稍慢（需要动态渲染）
   - ✅ 后续访问会使用 ISR 缓存

2. **限制静态生成数量的影响**：
   - ✅ 构建速度提升
   - ✅ 最新的 N 个页面会预生成
   - ✅ 其他页面使用动态渲染 + ISR

## 🔧 推荐配置

### 开发环境
```bash
# 不设置，使用默认值（10个静态页面）
npm run build
```

### CI/CD 环境
```bash
# 跳过静态生成，加快构建速度
SKIP_STATIC_GENERATION=true npm run build
```

### 生产环境（Vercel）
- 使用 Vercel 的 ISR（Incremental Static Regeneration）
- 设置 `revalidate` 时间（已在代码中设置为 3600 秒）
- 首次访问时动态生成，后续使用缓存

## 📚 相关文档

- [Next.js Static Generation](https://nextjs.org/docs/app/building-your-application/data-fetching/generating-static-params)
- [Next.js ISR](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration)
