# 如何从 Google Search Console 导出 404 URL

## 📋 步骤说明

### 步骤 1: 登录 Google Search Console

1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 选择你的网站属性（例如：`https://sora2aivideos.com`）

---

### 步骤 2: 进入索引报告

1. 在左侧导航栏中，点击 **"索引"** (Indexing)
2. 然后点击 **"网页"** (Pages)

---

### 步骤 3: 查看未编入索引的网页

1. 在页面顶部，你会看到两个卡片：
   - **已编入索引** (Indexed)
   - **未编入索引** (Not indexed)

2. 点击 **"未编入索引"** 卡片

---

### 步骤 4: 筛选 404 错误

1. 在未编入索引的网页列表中，找到 **"未找到 (404)"** 原因
2. 点击这个原因

---

### 步骤 5: 导出 URL 列表

1. 在 404 错误页面中，你会看到所有返回 404 的 URL 列表
2. 点击页面右上角的 **"导出"** (Export) 按钮
3. 选择 **"导出为 CSV"** (Export as CSV)

---

### 步骤 6: 保存文件

1. 文件会下载到你的默认下载文件夹（通常是 `~/Downloads`）
2. 文件名通常是类似 `404-urls.csv` 或 `not-indexed-pages.csv`

---

## 📝 CSV 文件格式

Google Search Console 导出的 CSV 文件通常包含以下列：

```csv
URL,其他列...
https://sora2aivideos.com/use-cases/xxx,...
https://sora2aivideos.com/keywords/yyy,...
```

脚本会自动识别第一列中的 URL。

---

## 🚀 使用导出的文件

导出文件后，运行分析脚本：

```bash
# 如果文件在 Downloads 文件夹
npx tsx scripts/analyze-404-urls.ts ~/Downloads/404-urls.csv

# 或者指定完整路径
npx tsx scripts/analyze-404-urls.ts /path/to/your/404-urls.csv
```

---

## 💡 提示

1. **文件格式**: 确保 CSV 文件的第一列包含完整的 URL（包括 `https://`）
2. **文件编码**: 确保文件是 UTF-8 编码
3. **文件路径**: 可以使用相对路径或绝对路径

---

## 🔍 如果无法导出

如果 Google Search Console 没有提供导出功能，你可以：

1. **手动复制 URL**: 复制页面上的 URL 列表
2. **创建 CSV 文件**: 创建一个 CSV 文件，第一列是 URL，例如：

```csv
URL
https://sora2aivideos.com/use-cases/example-1
https://sora2aivideos.com/keywords/example-2
https://sora2aivideos.com/blog/example-3
```

3. **使用脚本分析**: 运行分析脚本处理这个文件

---

## 📄 示例文件

我已经创建了一个示例 CSV 文件：`scripts/example-404-urls.csv`

你可以用它来测试脚本：

```bash
npx tsx scripts/analyze-404-urls.ts scripts/example-404-urls.csv
```

---

**最后更新**: 2026-01-13
