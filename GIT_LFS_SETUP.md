# Git LFS 设置指南（处理大文件）

## 🎯 问题

GitHub 限制单个文件大小为 100MB。`.next/` 和 `node_modules/` 中的某些文件超过了这个限制。

## ✅ 解决方案：使用 Git LFS

Git LFS (Large File Storage) 可以将大文件存储在 GitHub 的 LFS 服务器上，而不是 Git 仓库中。

### 步骤 1: 安装 Git LFS

**macOS**:
```bash
brew install git-lfs
```

**其他系统**:
- 访问 https://git-lfs.github.com/
- 下载并安装

### 步骤 2: 初始化 Git LFS

```bash
cd /Users/p/Documents/GitHub/Sora-2Ai
git lfs install
```

### 步骤 3: 配置要跟踪的大文件类型

```bash
# 跟踪 .next 目录中的大文件
git lfs track ".next/cache/webpack/**/*.pack"
git lfs track ".next/cache/webpack/**/*.pack.gz"

# 跟踪 node_modules 中的二进制文件
git lfs track "node_modules/**/*.node"
git lfs track "node_modules/**/*.so"
git lfs track "node_modules/**/*.dylib"

# 跟踪 .next/trace 文件（如果很大）
git lfs track ".next/trace"
```

### 步骤 4: 提交 .gitattributes 文件

```bash
git add .gitattributes
git commit -m "Add Git LFS tracking for large files"
```

### 步骤 5: 将现有的大文件迁移到 LFS

```bash
# 迁移所有已跟踪的大文件
git lfs migrate import --include=".next/cache/webpack/**/*.pack,node_modules/**/*.node,.next/trace" --everything
```

### 步骤 6: 推送到 GitHub

```bash
git push origin main
```

## ⚠️ 注意事项

1. **Git LFS 有配额限制**：
   - 免费账户：1 GB 存储空间，1 GB/月 带宽
   - 如果超过，需要升级到付费计划

2. **更好的方案**：
   实际上，`.next/` 和 `node_modules/` **不应该**提交到 Git：
   - `.next/` 是构建产物，每次构建都会变化
   - `node_modules/` 可以通过 `npm install` 重新安装
   
   建议使用 `.gitignore` 忽略这些目录。

## 🔄 如果已经提交了大文件

如果这些文件已经在 Git 历史中，需要从历史中移除：

```bash
# 使用 git filter-branch 或 BFG Repo-Cleaner
# 注意：这会重写 Git 历史，需要强制推送
```

## 📚 参考

- [Git LFS 文档](https://git-lfs.github.com/)
- [GitHub LFS 文档](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-git-large-file-storage)
