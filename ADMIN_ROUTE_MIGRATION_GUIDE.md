# Admin 路由迁移指南

## 📋 当前路由状态

### 旧路由方式（AdminClient.tsx 中的 tab 模式）
```
/admin?tab=overview
/admin?tab=recharges
/admin?tab=consumption
/admin?tab=videos
/admin?tab=issues
/admin?tab=adjustments
/admin?tab=prompts
/admin?tab=keywords
/admin?tab=homepage
/admin?tab=blog
/admin?tab=use-cases
/admin?tab=compare-pages
/admin?tab=batch-generator
/admin?tab=seo-chat
/admin?tab=admin-chat
/admin?tab=chat-debug
/admin?tab=scene-config
```

### 新路由方式（已创建）
```
/admin → 重定向到 /admin/dashboard
/admin/dashboard
/admin/billing
/admin/content
/admin/prompts
/admin/landing
/admin/tools/* (隐藏)
```

## 🗺️ 旧 URL → 新 URL 映射表

| 旧 URL (Tab 模式) | 新 URL | 301 Redirect | 状态 |
|------------------|--------|--------------|------|
| `/admin?tab=overview` | `/admin/dashboard` | ✅ | 需添加 |
| `/admin?tab=recharges` | `/admin/billing?tab=payments` | ✅ | 需添加 |
| `/admin?tab=consumption` | `/admin/billing?tab=usage` | ✅ | 需添加 |
| `/admin?tab=adjustments` | `/admin/billing?tab=adjustments` | ✅ | 需添加 |
| `/admin?tab=use-cases` | `/admin/content?tab=use-cases` | ✅ | 需添加 |
| `/admin?tab=keywords` | `/admin/content?tab=keywords` | ✅ | 需添加 |
| `/admin?tab=compare-pages` | `/admin/content?tab=compare` | ✅ | 需添加 |
| `/admin?tab=blog` | `/admin/content?tab=blog` | ✅ | 需添加 |
| `/admin?tab=batch-generator` | `/admin/content?tab=batches` | ✅ | 需添加 |
| `/admin?tab=prompts` | `/admin/prompts` | ✅ | 需添加 |
| `/admin?tab=homepage` | `/admin/landing` | ✅ | 需添加 |
| `/admin?tab=videos` | `/admin/ops/video-tasks` | ⚠️ 可选 | 待创建 |
| `/admin?tab=issues` | `/admin/ops/feedback` | ⚠️ 可选 | 待创建 |
| `/admin?tab=seo-chat` | ❌ 删除 | ❌ | 建议删除 |
| `/admin?tab=admin-chat` | ❌ 删除 | ❌ | 建议删除 |
| `/admin?tab=chat-debug` | `/admin/tools/chat/debug` | ⚠️ 隐藏 | 已迁移 |
| `/admin?tab=scene-config` | `/admin/tools/models/scene` | ⚠️ 隐藏 | 已迁移 |

## 📁 文件迁移对照表

| 旧文件位置 | 新文件位置 | 状态 | 操作 |
|-----------|-----------|------|------|
| `app/admin/AdminClient.tsx` | `app/admin/dashboard/page.tsx` | ✅ | 已创建，需更新导入 |
| `app/admin/AdminUseCasesManager.tsx` | `app/admin/content/use-cases/AdminUseCasesManager.tsx` | ✅ | 已迁移 |
| `app/admin/AdminKeywordsManager.tsx` | `app/admin/content/keywords/AdminKeywordsManager.tsx` | ✅ | 已迁移 |
| `app/admin/AdminComparePagesManager.tsx` | `app/admin/content/compare/AdminComparePagesManager.tsx` | ✅ | 已迁移 |
| `app/admin/AdminBlogManager.tsx` | `app/admin/content/blog/AdminBlogManager.tsx` | ✅ | 已迁移 |
| `app/admin/AdminBatchContentGenerator.tsx` | 合并到 `app/admin/content/batches/AdminBatchesPage.tsx` | ✅ | 已合并 |
| `app/admin/UseCaseBatchGenerator.tsx` | 合并到 `app/admin/content/batches/AdminBatchesPage.tsx` | ✅ | 已合并 |
| `app/admin/IndustrySceneBatchGenerator.tsx` | 合并到 `app/admin/content/batches/AdminBatchesPage.tsx` | ✅ | 已合并 |
| `app/admin/AdminPromptsManager.tsx` | `app/admin/prompts/AdminPromptsPage.tsx` | ✅ | 已包装 |
| `app/admin/AdminHomepageManager.tsx` | `app/admin/landing/AdminLandingPage.tsx` | ✅ | 已包装 |
| `app/admin/AdminChatDebug.tsx` | `app/admin/tools/chat/debug/page.tsx` | ⚠️ | 已复制，需创建包装器 |
| `app/admin/AdminChatManager.tsx` | `app/admin/tools/chat/manager/page.tsx` | ⚠️ | 已复制，需创建包装器 |
| `app/admin/AdminSEOChatManager.tsx` | ❌ 建议删除 | ❌ | 建议删除 |
| `app/admin/AdminGrsaiChatManager.tsx` | ❌ 建议删除 | ❌ | 建议删除 |
| `app/admin/AdminGeoManager.tsx` | `app/admin/tools/geo/page.tsx` | ⚠️ | 已复制，需创建包装器 |
| `app/admin/AdminSceneModelConfig.tsx` | `app/admin/tools/models/scene/page.tsx` | ⚠️ | 已复制，需创建包装器 |
| `app/admin/AdminIndustryModelConfig.tsx` | `app/admin/tools/models/industry/page.tsx` | ⚠️ | 已复制，需创建包装器 |

## 🔄 301 Redirect 配置建议

### 方案 1: 在 AdminClient.tsx 中添加重定向逻辑

```typescript
// 在 AdminClient.tsx 中，检查旧 tab 参数并重定向
useEffect(() => {
  const tabFromUrl = searchParams?.get('tab')
  if (tabFromUrl) {
    const redirectMap: Record<string, string> = {
      'overview': '/admin/dashboard',
      'recharges': '/admin/billing?tab=payments',
      'consumption': '/admin/billing?tab=usage',
      'adjustments': '/admin/billing?tab=adjustments',
      'use-cases': '/admin/content?tab=use-cases',
      'keywords': '/admin/content?tab=keywords',
      'compare-pages': '/admin/content?tab=compare',
      'blog': '/admin/content?tab=blog',
      'batch-generator': '/admin/content?tab=batches',
      'prompts': '/admin/prompts',
      'homepage': '/admin/landing',
      'chat-debug': '/admin/tools/chat/debug',
      'scene-config': '/admin/tools/models/scene',
    }
    const newUrl = redirectMap[tabFromUrl]
    if (newUrl) {
      router.replace(newUrl)
    }
  }
}, [searchParams, router])
```

### 方案 2: 在 Next.js 中间件中添加重定向

```typescript
// middleware.ts 或 app/admin/route.ts
export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  
  if (url.pathname === '/admin' && url.searchParams.has('tab')) {
    const tab = url.searchParams.get('tab')
    const redirectMap: Record<string, string> = {
      'overview': '/admin/dashboard',
      'recharges': '/admin/billing?tab=payments',
      // ... 其他映射
    }
    const newPath = redirectMap[tab || '']
    if (newPath) {
      return NextResponse.redirect(new URL(newPath, request.url))
    }
  }
  
  return NextResponse.next()
}
```

## ✅ 待执行的迁移步骤

### 步骤 1: 更新 AdminClient.tsx 以支持旧 URL 重定向
- [ ] 添加 tab 参数检测和重定向逻辑
- [ ] 保留旧 tab 模式的向后兼容性（过渡期）

### 步骤 2: 清理旧组件文件（确认新路由工作后）
- [ ] 删除 `app/admin/AdminSEOChatManager.tsx`
- [ ] 删除 `app/admin/AdminGrsaiChatManager.tsx`
- [ ] 删除 `app/admin/AdminBatchContentGenerator.tsx` (已合并)
- [ ] 删除 `app/admin/UseCaseBatchGenerator.tsx` (已合并)
- [ ] 删除 `app/admin/IndustrySceneBatchGenerator.tsx` (已合并)

### 步骤 3: 更新所有导入路径
- [ ] 检查所有文件中对旧组件的导入
- [ ] 更新为新路径

### 步骤 4: 创建 Tools 页面包装器
- [ ] 为 `/admin/tools/chat/debug` 创建包装器
- [ ] 为 `/admin/tools/chat/manager` 创建包装器
- [ ] 为 `/admin/tools/geo` 创建包装器
- [ ] 为 `/admin/tools/models/*` 创建包装器
