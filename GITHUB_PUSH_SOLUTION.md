# GitHub 推送大文件问题解决方案

## 🎯 当前状态

- ✅ `.gitignore` 已更新（包含 `.next/` 和 `node_modules/`）
- ✅ 只有 `.gitignore` 被修改，没有删除任何文件
- ⚠️ 大文件已经在 Git 历史中（之前的提交）

## ✅ 解决方案

### 方案 1: 只提交 .gitignore（推荐）

如果你只是想更新 `.gitignore`，不删除已提交的文件：

```bash
# 1. 提交 .gitignore 的更新
git commit -m "Update .gitignore to exclude .next and node_modules"

# 2. 尝试推送
git push origin main
```

**如果推送成功**：问题解决！以后这些文件不会再被提交。

**如果推送失败**（因为历史中的大文件）：
- 使用方案 2 或 3

---

### 方案 2: 使用 Git LFS（保留文件在 Git 中）

如果你想保留这些文件在 Git 中，但使用 LFS 存储：

```bash
# 1. 安装 Git LFS
brew install git-lfs
git lfs install

# 2. 配置跟踪大文件
git lfs track ".next/cache/webpack/**/*.pack"
git lfs track "node_modules/**/*.node"

# 3. 提交 .gitattributes
git add .gitattributes
git commit -m "Add Git LFS tracking"

# 4. 迁移现有大文件到 LFS
git lfs migrate import --include=".next/cache/webpack/**/*.pack,node_modules/**/*.node" --everything

# 5. 强制推送（⚠️ 会重写历史）
git push origin main --force
```

---

### 方案 3: 从 Git 历史中移除大文件（但保留本地文件）

如果你想从 Git 历史中移除这些文件，但保留本地文件：

```bash
# 1. 使用 git filter-branch 移除大文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r .next/cache/webpack node_modules/@next/swc-darwin-arm64" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送（⚠️ 会重写历史）
git push origin main --force
```

⚠️ **注意**: 这会重写 Git 历史，如果其他人也在使用这个仓库，需要先通知他们。

---

## 🎯 推荐操作

**现在先尝试方案 1**：

```bash
# 提交 .gitignore
git commit -m "Update .gitignore to exclude .next and node_modules"

# 尝试推送
git push origin main
```

如果推送成功，问题解决！

如果推送失败（因为历史中的大文件），再考虑方案 2 或 3。
