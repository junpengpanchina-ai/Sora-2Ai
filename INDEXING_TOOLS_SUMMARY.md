# Google 索引问题诊断工具总结

## ✅ 已创建的工具

### 1. 基础验证脚本
**文件**: `scripts/validate-sitemap-urls.ts`

快速检查数据库中的无效 slug，适合日常使用。

---

### 2. 全面验证脚本 ⭐
**文件**: `scripts/comprehensive-sitemap-validation.ts`

检查所有页面类型并生成详细报告，推荐用于定期验证。

**功能**:
- ✅ 检查所有页面类型（use-cases, keywords, blog, prompts, compare, industries）
- ✅ 验证数据库中的 slug 格式
- ✅ 生成验证摘要和详细报告
- ✅ 支持导出 CSV 格式

**使用方法**:
```bash
# 基础验证
npx tsx scripts/comprehensive-sitemap-validation.ts

# 导出 CSV 报告
npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
```

---

### 3. 分析 404 URL 脚本 ⭐⭐
**文件**: `scripts/analyze-404-urls.ts`

分析 Google Search Console 导出的 404 URL，帮助找出问题根源。

**功能**:
- ✅ 解析 CSV 文件中的 404 URL
- ✅ 自动识别 URL 类型（use-case, keyword, blog 等）
- ✅ 检查 URL 是否在数据库中存在
- ✅ 提供修复建议
- ✅ 生成详细的分析报告

**使用方法**:
```bash
# 1. 从 Google Search Console 导出 404 URL 列表（CSV 格式）
# 2. 运行分析脚本
npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv
```

**输出**: `404-urls-analysis-report.csv` - 包含每个 URL 的详细分析结果

---

### 4. HTTP Sitemap 验证脚本 ⭐⭐⭐
**文件**: `scripts/validate-sitemap-http.ts`

通过 HTTP 请求验证实际 sitemap 中的 URL，最全面的验证工具。

**功能**:
- ✅ 获取并解析所有 sitemap（包括子 sitemap）
- ✅ 提取所有 URL
- ✅ 检查每个 URL 是否在数据库中存在
- ✅ 可选：检查 HTTP 状态码（发现 404/5xx 错误）
- ✅ 生成详细的验证报告

**使用方法**:
```bash
# 基础验证（只检查数据库）
npx tsx scripts/validate-sitemap-http.ts

# 完整验证（包括 HTTP 状态码检查，较慢但更全面）
npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv

# 指定不同的 base URL
npx tsx scripts/validate-sitemap-http.ts --base-url=https://sora2aivideos.com --check-http
```

**输出**: `sitemap-http-validation-report.csv` - 包含所有 URL 的验证结果

---

## 🎯 推荐使用场景

### 场景 1: 日常检查
**工具**: `comprehensive-sitemap-validation.ts`

```bash
npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
```

**何时使用**:
- 每周定期检查
- 发布新内容后
- 删除内容后

---

### 场景 2: 收到 Google Search Console 404 警告
**工具**: `analyze-404-urls.ts`

**步骤**:
1. 从 Google Search Console 导出 404 URL 列表（CSV）
2. 运行分析脚本：
   ```bash
   npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv
   ```
3. 查看生成的报告，了解哪些 URL 有问题
4. 根据建议修复问题

---

### 场景 3: 全面诊断索引问题
**工具**: `validate-sitemap-http.ts`

```bash
# 完整验证（推荐）
npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv
```

**何时使用**:
- 发现大量索引问题时
- 部署新版本后
- 修改 sitemap 生成逻辑后

---

### 场景 4: 快速检查
**工具**: `validate-sitemap-urls.ts`

```bash
npx tsx scripts/validate-sitemap-urls.ts
```

**何时使用**:
- 快速检查数据库中的无效 slug
- 不需要详细报告时

---

## 📊 工具对比

| 工具 | 检查范围 | 速度 | 详细程度 | 推荐场景 |
|------|---------|------|---------|---------|
| `validate-sitemap-urls.ts` | 数据库 | ⚡ 快 | 基础 | 快速检查 |
| `comprehensive-sitemap-validation.ts` | 数据库（所有类型） | ⚡ 快 | 详细 | 日常验证 |
| `analyze-404-urls.ts` | 404 URL 列表 | ⚡ 快 | 详细 | 分析 404 错误 |
| `validate-sitemap-http.ts` | 实际 sitemap + HTTP | 🐌 慢（如果检查 HTTP） | 最详细 | 全面诊断 |

---

## 🔄 完整工作流程示例

### 示例 1: 处理 Google Search Console 的 404 警告

```bash
# 步骤 1: 从 Google Search Console 导出 404 URL 列表
# （在 Google Search Console 中操作）

# 步骤 2: 分析 404 URL
npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv

# 步骤 3: 查看报告，了解问题
# 打开 404-urls-analysis-report.csv

# 步骤 4: 根据报告修复问题
# - 如果 URL 不存在：从 sitemap 中移除或创建 301 重定向
# - 如果 URL 存在但未发布：发布或从 sitemap 中移除

# 步骤 5: 验证修复效果
npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
```

---

### 示例 2: 部署新版本后的验证

```bash
# 步骤 1: 全面验证 sitemap
npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv

# 步骤 2: 检查报告中的问题
# 打开 sitemap-http-validation-report.csv

# 步骤 3: 修复发现的问题

# 步骤 4: 重新验证
npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv
```

---

## 📄 生成的报告文件

所有工具都会生成 CSV 格式的报告文件，方便在 Excel 或其他工具中分析：

- `sitemap-validation-report.csv` - 全面验证报告
- `404-urls-analysis-report.csv` - 404 URL 分析报告
- `sitemap-http-validation-report.csv` - HTTP sitemap 验证报告

---

## 💡 最佳实践

1. **定期运行验证**
   - 每周运行一次 `comprehensive-sitemap-validation.ts`
   - 每月运行一次 `validate-sitemap-http.ts --check-http`

2. **及时处理问题**
   - 收到 Google Search Console 警告后立即分析
   - 使用 `analyze-404-urls.ts` 快速定位问题

3. **保持 sitemap 清洁**
   - 删除内容后立即验证
   - 确保 sitemap 只包含已发布的记录

4. **监控索引状态**
   - 每周检查 Google Search Console
   - 跟踪索引率变化

---

## 🛠️ 其他相关工具

### 健康检查端点
**URL**: `https://sora2aivideos.com/api/health`

**功能**: 检查服务器和数据库状态

**使用方法**:
```bash
curl https://sora2aivideos.com/api/health
```

---

## 📚 相关文档

- `GOOGLE_INDEXING_FIX_ACTION_PLAN.md` - 详细的修复行动计划
- `INDEXING_FIXES_IMPLEMENTED.md` - 已实施的修复总结
- `SITEMAP_VALIDATION_RESULTS.md` - 验证结果报告
- `scripts/README.md` - 工具使用说明

---

**最后更新**: 2026-01-13  
**状态**: ✅ 所有工具已创建并可用
