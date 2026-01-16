# 中文内容检查 - 快速开始

## 🚀 快速设置

### 1. 设置 Git Hooks（提交前自动检查）

```bash
# 方式 1: 使用设置脚本（推荐）
./scripts/setup-git-hooks.sh

# 方式 2: 如果使用 Husky
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run check:chinese:changed"
```

### 2. 验证设置

```bash
# 测试 pre-commit hook（模拟提交）
git add .
git commit --dry-run
```

## 📋 日常使用

### 提交代码前

```bash
# 检查变更的文件
npm run check:chinese:changed
```

### 创建 PR 前

```bash
# 检查相对于 main 分支的变更
npm run check:chinese:changed -- --base=main --head=HEAD
```

### 定期全面检查

```bash
# 检查整个代码库
npm run check:chinese
```

## ✅ CI/CD 已配置

- ✅ **GitHub Actions CI** - 自动检查 PR 和推送
- ✅ **Pre-commit Hook** - 提交前自动检查
- ✅ **PR 评论** - 发现问题时自动添加评论

## 🔍 检查范围

### ✅ 会检查
- 用户界面文本（按钮、标签、占位符）
- 错误消息
- 成功消息
- 内容生成模板

### ❌ 不会检查
- Markdown 文档（`.md` 文件）
- 调试脚本（`CONSOLE_*.js`, `*DEBUG*.js` 等）
- 代码注释（除非是用户提示）

## 🚨 检查失败时

### Pre-commit 失败

1. 查看错误信息
2. 修复所有用户可见的中文
3. 重新提交

### CI 失败

1. 查看 GitHub Actions 日志
2. 修复问题
3. 推送修复

## ❓ 常见问题

### Q: Pre-commit hook 不工作怎么办？

```bash
# 检查 hook 是否存在
ls -la .git/hooks/pre-commit

# 检查 hook 权限
chmod +x .git/hooks/pre-commit

# 重新设置
./scripts/setup-git-hooks.sh
```

### Q: 如何跳过 pre-commit 检查？

```bash
# 使用 --no-verify 跳过（不推荐）
git commit --no-verify -m "your message"
```

**注意**: 只有在紧急情况下才跳过检查，之后必须修复问题。

### Q: CI 检查失败但本地通过？

可能原因：
1. 本地和 CI 的 git 历史不同
2. 检查脚本版本不同

解决方案：
```bash
# 使用相同的 base 分支检查
npm run check:chinese:changed -- --base=main --head=HEAD
```

### Q: 调试脚本中的中文需要修复吗？

不需要。以下文件中的中文可以保留：
- `CONSOLE_*.js`
- `*DEBUG*.js`
- `*TEST*.js`
- `*DIAGNOSTIC*.js`
- `PASTE_TO_CONSOLE.js`

这些是开发工具，不影响用户。

### Q: 如何只检查特定文件？

```bash
# 检查单个文件
node scripts/check-chinese-content-changed.js --base=HEAD~1 --head=HEAD

# 或使用 grep 手动检查
grep -n "[\u4e00-\u9fff]" path/to/file.tsx
```

## 🔧 故障排除

### Hook 执行失败

```bash
# 检查 Node.js 版本
node --version  # 应该是 18+

# 检查脚本权限
ls -la scripts/check-chinese-content-changed.js
chmod +x scripts/check-chinese-content-changed.js
```

### Git 命令失败

```bash
# 确保在正确的分支
git branch

# 确保有变更
git status

# 检查 git 历史
git log --oneline -5
```

### CI 检查超时

如果 CI 检查超时，可能是：
1. 变更文件太多
2. 网络问题

解决方案：
- 分批提交
- 检查 GitHub Actions 日志

## 📚 更多信息

- [完整文档](./docs/CI_CD_CHINESE_CHECK.md)
- [上线前检查清单](./GEO_AND_SEO_UNIFIED.md#-上线前检查清单必须执行)
- [检查脚本源码](./scripts/check-chinese-content-changed.js)
