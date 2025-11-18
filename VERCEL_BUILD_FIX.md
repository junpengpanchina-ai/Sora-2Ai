# Vercel 构建错误修复指南

## 🔴 问题

Vercel 构建失败，错误信息：
```
Type error: Object literal may only specify known properties, and 'flowType' does not exist in type...
```

## 📋 原因

Vercel 构建时使用了旧的提交 `2735b30`，该提交包含已修复的错误代码。

## ✅ 解决方案

### 方案 1: 手动触发新部署（推荐）

1. **访问 Vercel Dashboard**
   - 网址：https://vercel.com/dashboard
   - 选择你的项目

2. **触发新部署**
   - 进入 **Deployments** 标签页
   - 点击 **Redeploy** 按钮（在最新部署旁边）
   - 或者点击 **Create Deployment** > 选择 `main` 分支 > **Deploy**

3. **验证部署**
   - 等待构建完成
   - 检查构建日志，确认使用的是最新提交

### 方案 2: 推送新提交触发自动部署

如果方案 1 不起作用，可以创建一个空提交来触发新的部署：

```bash
# 创建一个空提交
git commit --allow-empty -m "Trigger Vercel rebuild"

# 推送到 GitHub
git push origin main
```

### 方案 3: 检查 Vercel 项目设置

1. **检查 Git 连接**
   - 进入项目 **Settings** > **Git**
   - 确认连接的仓库和分支正确
   - 确认是 `main` 分支

2. **检查部署设置**
   - 进入 **Settings** > **Git**
   - 确认 **Production Branch** 设置为 `main`
   - 检查是否有任何部署钩子或过滤器

3. **清除构建缓存**
   - 在 Vercel Dashboard 中
   - 进入 **Settings** > **Build & Development Settings**
   - 点击 **Clear Build Cache**（如果可用）

## 🔍 验证修复

部署成功后，检查：

1. **构建日志**
   - 确认构建使用的提交是 `5133a39` 或更新
   - 确认没有 `flowType` 相关的错误

2. **部署状态**
   - 确认部署状态为 **Ready**
   - 确认所有检查通过

## 📝 当前状态

- ✅ 本地代码已修复（提交 `5133a39`）
- ✅ 远程仓库已更新（提交 `56f7578`）
- ❌ Vercel 仍在使用旧提交 `2735b30`

## 🚀 快速操作

最快的方法是：

1. 访问 Vercel Dashboard
2. 找到你的项目
3. 点击 **Redeploy** 或创建新部署
4. 选择 `main` 分支
5. 等待构建完成

## ⚠️ 注意事项

如果多次重新部署仍然使用旧提交，可能需要：

1. **断开并重新连接 Git 仓库**
   - 在 Vercel 项目设置中
   - 断开 Git 连接
   - 重新连接仓库

2. **检查 GitHub Actions**
   - 确认 GitHub Actions 工作流没有干扰
   - 检查是否有部署保护规则

3. **联系 Vercel 支持**
   - 如果问题持续，可能需要联系 Vercel 支持团队

