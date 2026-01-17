# Admin 迁移 TODO 清单

## ✅ 已完成

- [x] 创建新路由结构 (`/admin/dashboard`, `/admin/billing`, `/admin/content`, etc.)
- [x] 迁移 Content 相关文件到新位置
- [x] 创建 Billing 页面（合并充值/消耗/调整为 Tab）
- [x] 创建 Content 页面（合并使用场景/长尾词/对比页/博客/批量生成为 Tab）
- [x] 创建 Prompts 页面
- [x] 创建 Landing 页面
- [x] 合并 Batch 生成器到统一入口
- [x] 迁移 Tools 文件到隐藏路径
- [x] 更新主导航菜单（收敛到 5 个一级）
- [x] 创建 Sidebar 配置 JSON

## 🚧 进行中

### 1. 更新 AdminClient.tsx 以支持旧 URL 重定向
**优先级**: 🔴 高

**任务**:
- [ ] 在 `AdminClient.tsx` 中添加旧 tab 参数检测
- [ ] 实现重定向逻辑（旧 tab → 新 URL）
- [ ] 保留过渡期的向后兼容性

**文件**: `app/admin/AdminClient.tsx`

**代码位置**: 在 `useEffect` 中添加 tab 参数检测和重定向

### 2. 更新所有导入路径
**优先级**: 🔴 高

**任务**:
- [ ] 检查 `app/admin/AdminClient.tsx` 中的所有导入
- [ ] 更新为新路径
- [ ] 检查 Content 页面的导入路径
- [ ] 检查 Batches 页面的导入路径

**影响文件**:
- `app/admin/AdminClient.tsx`
- `app/admin/content/AdminContentPage.tsx`
- `app/admin/content/batches/AdminBatchesPage.tsx`
- `app/admin/content/use-cases/AdminUseCasesManager.tsx`

### 3. 创建 Tools 页面包装器
**优先级**: 🟡 中

**任务**:
- [ ] 创建 `/admin/tools/chat/debug/page.tsx` 包装器
- [ ] 创建 `/admin/tools/chat/manager/page.tsx` 包装器
- [ ] 创建 `/admin/tools/geo/page.tsx` 包装器
- [ ] 创建 `/admin/tools/models/scene/page.tsx` 包装器
- [ ] 创建 `/admin/tools/models/industry/page.tsx` 包装器

**文件模板**:
```typescript
import { validateAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import AdminXXX from '../../AdminXXX' // 相对路径

export const dynamic = 'force-dynamic'

export default async function ToolsPage() {
  const adminUser = await validateAdminSession()
  if (!adminUser) redirect('/admin/login')
  return <AdminXXX onShowBanner={() => {}} />
}
```

## ⏳ 待开始

### 4. 清理旧组件文件
**优先级**: 🟢 低（确认新路由工作后）

**任务**:
- [ ] 删除 `app/admin/AdminSEOChatManager.tsx` ❌
- [ ] 删除 `app/admin/AdminGrsaiChatManager.tsx` ❌
- [ ] 删除 `app/admin/AdminBatchContentGenerator.tsx` (已合并到 Batches)
- [ ] 删除 `app/admin/UseCaseBatchGenerator.tsx` (已合并到 Batches)
- [ ] 删除 `app/admin/IndustrySceneBatchGenerator.tsx` (已合并到 Batches)
- [ ] 删除 `app/admin/AdminUseCasesManager.tsx` (已迁移)
- [ ] 删除 `app/admin/AdminKeywordsManager.tsx` (已迁移)
- [ ] 删除 `app/admin/AdminComparePagesManager.tsx` (已迁移)
- [ ] 删除 `app/admin/AdminBlogManager.tsx` (已迁移)
- [ ] 删除 `app/admin/AdminPromptsManager.tsx` (已包装，可选保留)
- [ ] 删除 `app/admin/AdminHomepageManager.tsx` (已包装，可选保留)
- [ ] 删除 Tools 旧文件（已复制到新位置）

**注意**: 删除前确保所有导入已更新，新路由正常工作。

### 5. 添加 301 Redirect 中间件
**优先级**: 🟡 中

**任务**:
- [ ] 在 `middleware.ts` 中添加 admin 路由重定向逻辑
- [ ] 或创建 `app/admin/route.ts` 处理重定向
- [ ] 测试所有旧 URL 重定向是否正常工作

### 6. Content 列表页 UI 增强
**优先级**: 🟢 低（后续功能）

**任务**:
- [ ] 添加 Tier 筛选和显示（T1/T2/T3）
- [ ] 添加 In Sitemap 开关
- [ ] 添加 Noindex 开关
- [ ] 添加 AI_CITATION_SCORE 显示和筛选
- [ ] 添加批量操作功能

### 7. 创建 Ops 页面（可选）
**优先级**: 🟢 低（如需要）

**任务**:
- [ ] 创建 `/admin/ops/page.tsx`
- [ ] 迁移视频任务 Tab
- [ ] 迁移售后反馈 Tab
- [ ] 添加到导航菜单（如需要）

## 📋 文件状态检查清单

### Content 域
- [ ] `app/admin/content/use-cases/page.tsx` - 导入路径正确
- [ ] `app/admin/content/keywords/page.tsx` - 导入路径正确
- [ ] `app/admin/content/compare/page.tsx` - 导入路径正确
- [ ] `app/admin/content/blog/page.tsx` - 导入路径正确
- [ ] `app/admin/content/batches/AdminBatchesPage.tsx` - 导入路径正确

### Billing 域
- [ ] `app/admin/billing/page.tsx` - 正常工作
- [ ] `app/admin/billing/AdminBillingPage.tsx` - 导入路径正确

### Prompts 域
- [ ] `app/admin/prompts/page.tsx` - 正常工作
- [ ] `app/admin/prompts/AdminPromptsPage.tsx` - 导入路径正确

### Landing 域
- [ ] `app/admin/landing/page.tsx` - 正常工作
- [ ] `app/admin/landing/AdminLandingPage.tsx` - 导入路径正确

### Dashboard 域
- [ ] `app/admin/dashboard/page.tsx` - 正常工作
- [ ] `app/admin/page.tsx` - 重定向正常

### Tools 域
- [ ] `/admin/tools/chat/debug/page.tsx` - 有包装器
- [ ] `/admin/tools/chat/manager/page.tsx` - 有包装器
- [ ] `/admin/tools/geo/page.tsx` - 有包装器
- [ ] `/admin/tools/models/scene/page.tsx` - 有包装器
- [ ] `/admin/tools/models/industry/page.tsx` - 有包装器

## 🎯 执行顺序建议

1. **第一步**: 更新 AdminClient.tsx 以支持旧 URL 重定向（确保旧链接不失效）
2. **第二步**: 更新所有导入路径（确保新路由正常工作）
3. **第三步**: 创建 Tools 页面包装器（完成迁移）
4. **第四步**: 测试所有新路由（确保功能正常）
5. **第五步**: 添加 301 Redirect 中间件（永久重定向）
6. **第六步**: 清理旧文件（确认一切正常后）

## ⚠️ 注意事项

1. **保留旧文件**: 在确认新路由正常工作前，不要删除旧文件
2. **测试重定向**: 确保所有旧 URL 都能正确重定向到新 URL
3. **检查导入**: 更新导入路径后，检查所有编译错误
4. **功能验证**: 迁移后验证所有功能是否正常工作

## 📊 迁移进度

- **路由结构**: ✅ 100% 完成
- **文件迁移**: ✅ 90% 完成（Tools 包装器待创建）
- **导入路径**: ⚠️ 50% 完成（部分需要更新）
- **重定向逻辑**: ⚠️ 0% 完成（待添加）
- **清理工作**: ⏳ 0% 完成（待确认后执行）
