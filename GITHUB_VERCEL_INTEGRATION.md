# GitHub Actions 与 Vercel 集成指南

本指南将帮助你在 GitHub 上连接 Vercel，并设置自动部署检查。

## 📋 前置要求

1. ✅ GitHub 仓库已创建
2. ✅ Vercel 项目已创建
3. ✅ 代码已推送到 GitHub

## 🔗 步骤 1: 在 Vercel 中连接 GitHub 仓库

### 1.1 访问 Vercel Dashboard

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目设置

### 1.2 连接 GitHub 仓库

1. 在项目设置中，进入 **Settings** > **Git**
2. 如果还没有连接，点击 **Connect Git Repository**
3. 选择你的 GitHub 仓库（例如：`sora-2-ai`）
4. 授权 Vercel 访问你的 GitHub 仓库

### 1.3 配置部署设置

在 **Settings** > **Git** 中：

- **Production Branch**: `main`（或你的主分支）
- **Deploy Hooks**: 可以创建自定义部署钩子（可选）

## 🔧 步骤 2: 在 Vercel 中启用 GitHub Checks

### 2.1 进入 GitHub 集成设置

1. 在 Vercel 项目设置中，进入 **Settings** > **Git**
2. 找到 **GitHub** 部分
3. 确保 **GitHub Checks** 已启用

### 2.2 配置部署检查

1. 在 **Settings** > **Git** > **Deployment Protection** 中
2. 启用 **Require GitHub Checks to pass before promoting to Production**
3. 添加检查名称：`Vercel - sora-2-ai: notify vercel`

## 📝 步骤 3: GitHub Actions 工作流已配置

项目已包含以下 GitHub Actions 工作流：

### 3.1 CI 工作流 (`.github/workflows/ci.yml`)

这个工作流会在每次推送或创建 Pull Request 时运行：

- ✅ 代码检查
- ✅ 安装依赖
- ✅ 运行 linter
- ✅ 构建项目
- ✅ 通知 Vercel

### 3.2 Vercel 通知工作流 (`.github/workflows/vercel-notify.yml`)

专门用于通知 Vercel 部署状态的工作流。

## 🚀 步骤 4: 推送代码到 GitHub

### 4.1 提交工作流文件

```bash
git add .github/workflows/
git commit -m "Add GitHub Actions workflows for Vercel integration"
git push origin main
```

### 4.2 如果遇到权限错误

如果推送时遇到以下错误：

```
! [remote rejected] main -> main (refusing to allow a Personal Access Token to create or update workflow `.github/workflows/ci.yml` without `workflow` scope)
```

**解决方案**：你的 Personal Access Token 需要 `workflow` 权限。

1. 访问 [GitHub Settings > Personal access tokens](https://github.com/settings/tokens)
2. 创建新的 token 或更新现有 token
3. 确保勾选了 `workflow` 权限范围
4. 使用新 token 重新推送

详细步骤请参考：`GITHUB_WORKFLOW_PERMISSION_FIX.md`

### 4.3 验证工作流运行

1. 访问你的 GitHub 仓库
2. 进入 **Actions** 标签页
3. 你应该能看到工作流正在运行
4. 等待工作流完成

## ✅ 步骤 5: 在 Vercel 中验证集成

### 5.1 检查部署状态

1. 在 Vercel Dashboard 中，进入 **Deployments**
2. 你应该能看到部署状态与 GitHub Actions 检查关联

### 5.2 测试部署保护

1. 创建一个新的 Pull Request
2. 在 PR 中，你应该能看到 Vercel 的部署检查
3. 只有当所有检查通过后，才能合并到主分支

## 🔍 工作流文件说明

### CI 工作流 (`ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
        continue-on-error: true

      - name: Build project
        run: npm run build

      - name: 'notify vercel'
        uses: 'vercel/repository-dispatch/actions/status@v1'
        with:
          name: Vercel - sora-2-ai: notify vercel
        if: always()
```

### Vercel 通知工作流 (`vercel-notify.yml`)

```yaml
name: Vercel Deployment Checks

on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  notify-vercel:
    runs-on: ubuntu-latest
    name: Notify Vercel
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint
        continue-on-error: true

      - name: Build project
        run: npm run build

      - name: 'notify vercel'
        uses: 'vercel/repository-dispatch/actions/status@v1'
        with:
          name: Vercel - sora-2-ai: notify vercel
        if: always()
```

## 🎯 关键配置说明

### 检查名称

工作流中使用的检查名称是：`Vercel - sora-2-ai: notify vercel`

这个名称必须与 Vercel 中配置的检查名称完全匹配。

### 工作流触发条件

- **Push 到主分支**: 自动触发
- **Pull Request**: 自动触发
- **手动触发**: 可以在 GitHub Actions 中手动运行

### 通知 Vercel

`notify vercel` 步骤使用 `vercel/repository-dispatch/actions/status@v1` action，它会：

- 将 GitHub Actions 的工作流状态发送到 Vercel
- 在 Vercel 部署页面显示检查状态
- 如果启用了部署保护，会阻止未通过检查的部署

## 🔐 权限要求

### GitHub 权限

- ✅ 仓库的读写权限（用于推送代码）
- ✅ Actions 权限（用于运行工作流）

### Vercel 权限

- ✅ GitHub 仓库访问权限
- ✅ 部署权限

## 🐛 故障排除

### 问题 1: 工作流未运行

**解决方案**：
- 检查 `.github/workflows/` 目录是否存在
- 确认文件已提交到 GitHub
- 检查 GitHub Actions 是否已启用（Settings > Actions > General）

### 问题 2: Vercel 未收到通知

**解决方案**：
- 确认检查名称完全匹配
- 检查 Vercel 项目设置中的 GitHub 集成是否正常
- 查看 GitHub Actions 日志，确认 `notify vercel` 步骤是否成功

### 问题 3: 部署保护未生效

**解决方案**：
- 在 Vercel 中确认已启用 "Require GitHub Checks to pass"
- 确认检查名称正确
- 等待工作流完成后再尝试部署

## 📊 监控和验证

### 在 GitHub 中查看

1. 进入仓库的 **Actions** 标签页
2. 查看工作流运行历史
3. 点击具体运行查看详细日志

### 在 Vercel 中查看

1. 进入项目的 **Deployments** 页面
2. 查看部署状态
3. 点击部署查看关联的 GitHub 检查

## ✅ 完成检查清单

- [ ] Vercel 项目已连接到 GitHub 仓库
- [ ] GitHub Actions 工作流文件已创建
- [ ] 工作流文件已推送到 GitHub
- [ ] 工作流在 GitHub Actions 中正常运行
- [ ] Vercel 中已启用 GitHub Checks
- [ ] 部署保护已配置
- [ ] 测试 Pull Request 显示检查状态
- [ ] 部署保护正常工作

## 🎉 完成！

现在你的 GitHub 仓库已与 Vercel 集成，每次推送代码或创建 Pull Request 时：

1. ✅ GitHub Actions 会自动运行检查
2. ✅ 检查结果会通知 Vercel
3. ✅ Vercel 会显示部署检查状态
4. ✅ 如果启用了部署保护，只有通过检查的代码才能部署到生产环境

祝你使用愉快！🚀

