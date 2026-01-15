# Sitemap 和索引验证工具

本目录包含用于验证和诊断 Google Search Console 索引问题的工具脚本。

## 📋 可用工具

### 1. 基础验证脚本
**文件**: `validate-sitemap-urls.ts`

**功能**: 快速检查数据库中的无效 slug

**使用方法**:
```bash
npx tsx scripts/validate-sitemap-urls.ts
```

**输出**: 
- 检查 use cases 和 keywords 的 slug 格式
- 报告无效的 slug

---

### 2. 全面验证脚本 ⭐ 推荐
**文件**: `comprehensive-sitemap-validation.ts`

**功能**: 检查所有页面类型并生成详细报告

**使用方法**:
```bash
# 基础验证
npx tsx scripts/comprehensive-sitemap-validation.ts

# 导出 CSV 报告
npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
```

**输出**:
- 验证所有页面类型（use-cases, keywords, blog, prompts, compare, industries）
- 生成验证摘要
- 可选：导出 CSV 格式报告

---

### 3. 分析 404 URL 脚本 ⭐ 推荐
**文件**: `analyze-404-urls.ts`

**功能**: 分析 Google Search Console 导出的 404 URL

**使用方法**:
```bash
# 从 Google Search Console 导出 404 URL 列表为 CSV
# 然后运行：
npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv
```

**输出**:
- 解析 CSV 文件中的 URL
- 分析 URL 类型和模式
- 检查 URL 是否在数据库中存在
- 生成详细的分析报告（CSV 格式）

**CSV 文件格式**:
Google Search Console 导出的 CSV 应该包含 URL 列，例如：
```csv
URL,其他列...
https://sora2aivideos.com/use-cases/xxx,...
https://sora2aivideos.com/keywords/yyy,...
```

---

### 4. HTTP Sitemap 验证脚本 ⭐ 推荐
**文件**: `validate-sitemap-http.ts`

**功能**: 通过 HTTP 请求验证实际 sitemap 中的 URL

**使用方法**:
```bash
# 基础验证（只检查数据库）
npx tsx scripts/validate-sitemap-http.ts

# 检查 HTTP 状态码（较慢）
npx tsx scripts/validate-sitemap-http.ts --check-http

# 导出 CSV 报告
npx tsx scripts/validate-sitemap-http.ts --export-csv

# 指定不同的 base URL
npx tsx scripts/validate-sitemap-http.ts --base-url=https://sora2aivideos.com --check-http --export-csv
```

**输出**:
- 获取并解析所有 sitemap
- 提取所有 URL
- 检查每个 URL 是否在数据库中存在
- 可选：检查 HTTP 状态码
- 可选：导出 CSV 格式报告

---

## 🚀 推荐工作流程

### 场景 1: 快速检查数据库中的无效 URL
```bash
npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
```

### 场景 2: 分析 Google Search Console 报告的 404 错误
1. 从 Google Search Console 导出 404 URL 列表（CSV 格式）
2. 运行分析脚本：
   ```bash
   npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv
   ```
3. 查看生成的 `404-urls-analysis-report.csv` 文件

### 场景 3: 验证实际 sitemap 中的 URL
```bash
# 完整验证（包括 HTTP 状态码检查）
npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv
```

### 场景 4: 全面诊断索引问题
1. 运行全面验证：
   ```bash
   npx tsx scripts/comprehensive-sitemap-validation.ts --export-csv
   ```

2. 验证实际 sitemap：
   ```bash
   npx tsx scripts/validate-sitemap-http.ts --check-http --export-csv
   ```

3. 分析 Google Search Console 的 404 报告：
   ```bash
   npx tsx scripts/analyze-404-urls.ts <404-urls.csv>
   ```

---

## 📊 生成的报告文件

- `sitemap-validation-report.csv` - 全面验证报告
- `404-urls-analysis-report.csv` - 404 URL 分析报告
- `sitemap-http-validation-report.csv` - HTTP sitemap 验证报告

---

## ⚙️ 环境变量要求

所有脚本都需要以下环境变量（从 `.env.local` 加载）：

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key
- `NEXT_PUBLIC_SITE_URL` - 网站基础 URL（可选，默认: https://sora2aivideos.com）

---

## 💡 使用建议

1. **定期运行验证**: 每周运行一次全面验证，确保没有无效的 URL
2. **发布新内容后**: 运行验证确保新内容正确添加到 sitemap
3. **删除内容后**: 运行验证确保已删除的内容从 sitemap 中移除
4. **收到 Google Search Console 警告后**: 立即运行相应的分析脚本

---

## 🔍 故障排除

### 问题: 脚本无法连接到数据库
**解决方案**: 
- 检查 `.env.local` 文件是否存在
- 确认环境变量已正确设置
- 检查 Supabase 项目状态

### 问题: HTTP 验证失败
**解决方案**:
- 确保网站正在运行
- 使用 `--base-url` 参数指定正确的 URL
- 检查网络连接

### 问题: CSV 文件解析失败
**解决方案**:
- 确保 CSV 文件格式正确
- 检查文件编码（应该是 UTF-8）
- 确保第一列包含完整的 URL

---

**最后更新**: 2026-01-13
