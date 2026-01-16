# 从 Git 历史中移除大文件（保留本地文件）

## 🎯 问题

GitHub 拒绝推送，因为 Git 历史中包含超过 100MB 的文件：
- `node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node` (109.64 MB)
- `node_modules/@workflow/web/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node` (119.92 MB)
- `.next/cache/webpack/server-production/0.pack` (126.87 MB)

## ✅ 解决方案：从 Git 历史中移除大文件

### 方法 1: 使用 git filter-branch（推荐）

```bash
cd /Users/p/Documents/GitHub/Sora-2Ai

# 从所有提交中移除大文件（但保留本地文件）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r .next/cache/webpack/server-production/0.pack \
   node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node \
   node_modules/@workflow/web/node_modules/@next/swc-darwin-arm64/next-swc.darwin-arm64.node" \
  --prune-empty --tag-name-filter cat -- --all

# 清理引用
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin main --force
```

### 方法 2: 移除整个 .next 和 node_modules 目录（更彻底）

```bash
cd /Users/p/Documents/GitHub/Sora-2Ai

# 从所有提交中移除 .next 和 node_modules（但保留本地文件）
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch -r .next node_modules" \
  --prune-empty --tag-name-filter cat -- --all

# 清理引用
git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 强制推送
git push origin main --force
```

⚠️ **重要提示**:
1. 这会重写 Git 历史
2. 如果其他人也在使用这个仓库，需要先通知他们
3. 本地文件不会被删除，只是从 Git 历史中移除
4. 使用 `--force` 推送会覆盖远程仓库的历史

## 🔄 如果方法 1 失败，使用方法 2

如果只移除特定文件不够，可以移除整个 `.next` 和 `node_modules` 目录。
