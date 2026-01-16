# 解决 GitHub 大文件上传问题

## 🎯 问题

GitHub 限制单个文件大小为 100MB。以下文件超过了限制：
- `.next/cache/webpack/server-production/0.pack` (127MB)
- `node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node` (109MB)
- `node_modules/@workflow/web/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node` (119MB)

## ✅ 方案 1: 使用 Git LFS（保留文件）

### 安装 Git LFS

```bash
# macOS
brew install git-lfs

# 初始化
git lfs install
```

### 配置 Git LFS 跟踪大文件

```bash
cd /Users/p/Documents/GitHub/Sora-2Ai

# 跟踪 .next 中的大文件
git lfs track ".next/cache/webpack/**/*.pack"
git lfs track ".next/cache/webpack/**/*.pack.gz"

# 跟踪 node_modules 中的二进制文件
git lfs track "node_modules/**/*.node"

# 提交 .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking for large files"
```

### 迁移现有大文件到 LFS

```bash
# 迁移所有已跟踪的大文件到 LFS
git lfs migrate import --include=".next/cache/webpack/**/*.pack,node_modules/**/*.node" --everything

# 推送到 GitHub
git push origin main --force
```

⚠️ **注意**: `--force` 会重写 Git 历史，如果其他人也在使用这个仓库，需要先通知他们。

---

## ✅ 方案 2: 只更新 .gitignore（不提交大文件）

如果这些文件已经在 Git 历史中，但你想以后不再提交它们：

### 步骤 1: 更新 .gitignore

```bash
# .gitignore 已经更新，包含 .next/ 和 node_modules/
git add .gitignore
git commit -m "Update .gitignore to exclude .next and node_modules"
```

### 步骤 2: 从 Git 索引中移除（但保留本地文件）

```bash
# 移除 .next 和 node_modules（但保留本地文件）
git rm -r --cached .next node_modules

# 提交删除
git commit -m "Remove .next and node_modules from Git (keep local files)"
```

### 步骤 3: 推送到 GitHub

```bash
git push origin main
```

⚠️ **注意**: 这会从 Git 中删除这些文件，但本地文件仍然存在。以后这些文件不会再被提交。

---

## 🎯 推荐方案

**对于你的情况，推荐方案 2**：
1. `.next/` 是构建产物，每次构建都会变化，不应该提交
2. `node_modules/` 可以通过 `npm install` 重新安装，不需要提交
3. 这些文件已经在 Git 历史中，但以后不会再提交

**如果必须保留这些文件在 Git 中**，使用方案 1（Git LFS）。

---

## 📝 当前状态

- ✅ `.gitignore` 已更新（包含 `.next/` 和 `node_modules/`）
- ✅ 文件已从 Git 索引中移除（但本地文件保留）
- ⏳ 等待你决定使用哪个方案
