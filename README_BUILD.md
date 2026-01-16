# 构建配置快速参考

## 🚀 快速开始

### 本地开发构建

```bash
npm run build
```

**默认行为**：
- 生成最新的 10 个 use cases 页面为静态页面
- 构建时间：约 1-3 分钟

### CI/CD 构建（推荐）

```bash
SKIP_STATIC_GENERATION=true npm run build
```

**行为**：
- 跳过静态生成，所有页面使用动态渲染 + ISR
- 构建时间：约 30-60 秒
- ✅ 已自动配置在 GitHub Actions

## 📋 环境变量

| 变量 | 说明 | 默认值 | CI/CD 设置 |
|------|------|--------|-----------|
| `SKIP_STATIC_GENERATION` | 跳过静态生成 | `false` | `true` ✅ |
| `BUILD_STATIC_LIMIT` | 静态生成数量限制 | `10` | - |

## ✅ 已配置的 CI/CD

- ✅ GitHub Actions CI (`.github/workflows/ci.yml`)
- ✅ Vercel Notify (`.github/workflows/vercel-notify.yml`)
- ✅ 中文内容检查 (`.github/workflows/check-chinese.yml`)

所有 CI/CD 工作流已自动配置 `SKIP_STATIC_GENERATION=true`。

## 📚 更多信息

- [完整构建配置](./BUILD_CONFIG.md)
- [构建问题排查](./BUILD_TROUBLESHOOTING.md)
