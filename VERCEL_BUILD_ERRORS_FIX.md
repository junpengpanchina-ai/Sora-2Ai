# Vercel 构建错误修复指南

## 🔴 问题描述

Vercel 部署时出现 100+ 个错误，导致构建失败。

## 📋 常见原因

### 1. API 路由缺少 `dynamic = 'force-dynamic'`

Next.js 默认会尝试静态生成 API 路由，如果路由在构建时访问环境变量或外部 API，会导致错误。

**修复方法**：在所有需要动态执行的 API 路由中添加：

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### 2. 环境变量未配置

Vercel 构建时如果代码访问了未设置的环境变量，会导致错误。

**必需的环境变量**：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

**可选但推荐的环境变量**：
- `GRSAI_API_KEY`（如果使用视频生成功能）
- `GRSAI_HOST`
- `STRIPE_SECRET_KEY`（如果使用支付功能）
- R2 相关变量（如果使用文件存储）

### 3. 静态生成时访问数据库

在 `generateStaticParams` 中必须使用 `createServiceClient()` 而不是 `createSupabaseServerClient()`，因为静态生成时没有请求上下文。

### 4. 导入错误或类型错误

确保所有依赖都已正确安装，TypeScript 类型检查通过。

## ✅ 已修复的问题

### 修复 1: 批量修复 API 路由缺少 `dynamic = 'force-dynamic'`

**问题**: 多个 API 路由缺少 `dynamic = 'force-dynamic'`，导致构建时尝试静态生成，调用需要环境变量或数据库的函数。

**已修复的文件**:
- `app/api/debug/test-grsai-api/route.ts`
- `app/api/chat/route.ts`
- `app/api/admin/blog-posts/route.ts`
- `app/api/admin/blog-posts/[id]/route.ts`
- `app/api/admin/consumption/[id]/refund/route.ts`
- `app/api/admin/consumption/[id]/route.ts`
- `app/api/admin/credits/[id]/route.ts`
- `app/api/admin/grsai-chat/route.ts`
- `app/api/admin/homepage/route.ts`
- `app/api/admin/issues/[id]/route.ts`
- `app/api/admin/payment-plans/route.ts`
- `app/api/admin/r2/cleanup/route.ts`
- `app/api/admin/r2/list/route.ts`
- `app/api/admin/r2/upload/route.ts`
- `app/api/admin/recharges/[id]/route.ts`
- `app/api/admin/videos/[id]/route.ts`
- `app/api/auth/admin-login/route.ts`
- `app/api/auth/admin-logout/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/debug/add-credits/route.ts`
- `app/api/debug/refund-task/route.ts`

**修复**: 为所有需要动态执行的 API 路由添加了：
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### 修复 2: 移除重复的 `revalidate` 定义

**问题**: 某些文件在脚本批量修复后出现了重复的 `export const revalidate = 0`。

**已修复的文件**:
- `app/api/admin/payment-plans/route.ts`
- `app/api/admin/r2/list/route.ts`
- `app/api/admin/homepage/route.ts`

**修复**: 移除了重复的 `revalidate` 定义。

## 🔍 检查清单

在部署到 Vercel 前，请确认：

- [ ] 所有 API 路由都设置了 `dynamic = 'force-dynamic'`（如果需要在运行时执行）
- [ ] 所有必需的环境变量都在 Vercel 中配置
- [ ] 本地构建成功 (`npm run build`)
- [ ] TypeScript 类型检查通过 (`npx tsc --noEmit`)
- [ ] ESLint 检查通过 (`npm run lint`)
- [ ] 所有使用 `generateStaticParams` 的页面都使用 `createServiceClient()`

## 🚀 部署步骤

### 1. 检查本地构建

```bash
npm run build
```

如果本地构建失败，先修复本地问题。

### 2. 配置 Vercel 环境变量

在 Vercel Dashboard 中：
1. 进入项目 **Settings** > **Environment Variables**
2. 添加所有必需的环境变量
3. 确保为 **Production**、**Preview** 和 **Development** 环境都设置了变量

### 3. 检查 API 路由

运行以下命令检查哪些 API 路由缺少 `dynamic` 配置：

```bash
grep -L "export const dynamic" app/api/**/route.ts
```

对于需要动态执行的 API 路由，添加：

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### 4. 重新部署

在 Vercel Dashboard 中：
1. 进入 **Deployments**
2. 点击最新部署旁边的 **Redeploy**
3. 或者推送新的提交触发自动部署

## 📝 常见错误及解决方案

### 错误 1: "GRSAI_API_KEY 环境变量未配置"

**原因**: 代码在构建时访问了需要环境变量的函数。

**解决方案**:
1. 确保相关 API 路由设置了 `dynamic = 'force-dynamic'`
2. 在 Vercel 中配置 `GRSAI_API_KEY` 环境变量（如果使用视频生成功能）

### 错误 2: "Cannot find module" 或导入错误

**原因**: 依赖未正确安装或路径错误。

**解决方案**:
1. 检查 `package.json` 中的依赖是否正确
2. 运行 `npm install` 确保所有依赖已安装
3. 检查导入路径是否正确

### 错误 3: TypeScript 类型错误

**原因**: 类型定义不匹配或缺少类型。

**解决方案**:
1. 运行 `npx tsc --noEmit` 检查类型错误
2. 修复所有类型错误
3. 确保 `types/database.ts` 中的类型定义是最新的

### 错误 4: 数据库连接错误

**原因**: 在静态生成时使用了错误的 Supabase 客户端。

**解决方案**:
- 在 `generateStaticParams` 中使用 `createServiceClient()` 而不是 `createSupabaseServerClient()`
- 确保 `SUPABASE_SERVICE_ROLE_KEY` 环境变量已配置

## 🔧 快速修复脚本

如果需要批量添加 `dynamic = 'force-dynamic'` 到 API 路由，可以使用以下脚本：

```bash
# 查找缺少 dynamic 的 API 路由
find app/api -name "route.ts" -exec grep -L "export const dynamic" {} \;
```

然后手动为每个文件添加：

```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

## 📞 获取帮助

如果问题持续存在：

1. **检查 Vercel 构建日志**
   - 在 Vercel Dashboard 中查看详细的构建日志
   - 查找第一个错误，通常后续错误是由第一个错误引起的

2. **检查环境变量**
   - 确认所有必需的环境变量都已配置
   - 确认环境变量值正确（没有多余的空格或引号）

3. **联系支持**
   - 如果问题持续，可以联系 Vercel 支持团队
   - 提供构建日志和错误信息

## ✅ 验证修复

部署成功后，检查：

- [ ] 构建日志中没有错误
- [ ] 网站可以正常访问
- [ ] API 路由正常工作
- [ ] 数据库连接正常
- [ ] 环境变量正确加载

