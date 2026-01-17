# Admin 后台重构进度

## 📋 重构目标
将 admin 一级菜单收敛到 6 个以内，按业务域组织文件结构。

## ✅ 已完成

### 1. 新的路由结构已创建
- ✅ `/admin/billing` - 计费中心（充值/消耗/调整合并为 Tab）
- ✅ `/admin/content` - 内容库（待创建）
- ✅ `/admin/prompts` - 提示词（待创建）
- ✅ `/admin/landing` - 首页管理（待创建）
- ✅ `/admin/ops` - 运营（可选，待创建）
- ✅ `/admin/tools/*` - 研发工具（隐藏，待创建）

### 2. Billing 页面已实现 ✅
- 位置: `/app/admin/billing/page.tsx` 和 `AdminBillingPage.tsx`
- 功能: 
  - Tab1: 充值记录 (payments)
  - Tab2: 消耗记录 (usage)
  - Tab3: 积分调整 (adjustments)
- 状态: **已完成，可以直接使用**

### 3. 主导航菜单已更新
- 已更新 `AdminClient.tsx` 的导航菜单
- 新增指向 `/admin/billing`、`/admin/content`、`/admin/prompts`、`/admin/landing` 的链接

## 🚧 进行中

### Content 页面 (待完成)
需要合并以下页面为 Tab:
- 使用场景 (use-cases) 
- 长尾词 (keywords)
- 对比页 (compare-pages)
- 批量生成 (batches) - 需要合并 3 个生成器

### Prompts 页面 (待完成)
- 提示词库 (保持现有功能)

### Landing 页面 (待完成)
- 首页管理 (homepage)

## 📝 待迁移的研发工具 (移到 /admin/tools/*)
以下工具将从一级菜单移除，隐藏到 `/admin/tools/*`:
- SEO 助手 (seo-chat) → `/admin/tools/seo`
- AI 助手 (admin-chat) → `/admin/tools/ai`
- 聊天调试 (chat-debug) → `/admin/tools/chat-debug`
- 场景配置 (scene-config) → `/admin/tools/models/scene`
- 行业配置 (industry-config) → `/admin/tools/models/industry`
- Geo 管理 (geo) → `/admin/tools/geo`

## 📊 文件映射表

| 当前文件 | 新位置 | 状态 |
|---------|--------|------|
| AdminClient.tsx (recharges/consumption/adjustments tabs) | `/admin/billing/AdminBillingPage.tsx` | ✅ 已迁移 |
| AdminUseCasesManager.tsx | `/admin/content/use-cases/page.tsx` | 🚧 待迁移 |
| AdminKeywordsManager.tsx | `/admin/content/keywords/page.tsx` | 🚧 待迁移 |
| AdminComparePagesManager.tsx | `/admin/content/compare/page.tsx` | 🚧 待迁移 |
| AdminBatchContentGenerator.tsx | `/admin/content/batches` (合并) | 🚧 待迁移 |
| UseCaseBatchGenerator.tsx | `/admin/content/batches` (合并) | 🚧 待迁移 |
| IndustrySceneBatchGenerator.tsx | `/admin/content/batches` (合并) | 🚧 待迁移 |
| AdminPromptsManager.tsx | `/admin/prompts/page.tsx` | 🚧 待迁移 |
| AdminHomepageManager.tsx | `/admin/landing/home/page.tsx` | 🚧 待迁移 |
| AdminSEOChatManager.tsx | `/admin/tools/seo/page.tsx` | 🚧 待迁移 |
| AdminChatManager.tsx | `/admin/tools/ai/page.tsx` | 🚧 待迁移 |
| AdminChatDebug.tsx | `/admin/tools/chat-debug/page.tsx` | 🚧 待迁移 |
| AdminSceneModelConfig.tsx | `/admin/tools/models/scene/page.tsx` | 🚧 待迁移 |
| AdminIndustryModelConfig.tsx | `/admin/tools/models/industry/page.tsx` | 🚧 待迁移 |

## 🎯 最终目标结构

```
/admin
├── page.tsx (Dashboard/总览)
├── billing/
│   ├── page.tsx ✅
│   └── AdminBillingPage.tsx ✅
├── content/
│   ├── page.tsx (Tab: use-cases, keywords, compare, batches)
│   └── AdminContentPage.tsx
├── prompts/
│   ├── page.tsx
│   └── AdminPromptsPage.tsx
├── landing/
│   ├── page.tsx
│   └── AdminLandingPage.tsx
├── ops/ (可选)
│   └── page.tsx (Tab: videos, issues)
└── tools/ (隐藏，不在一级菜单)
    ├── chat-debug/
    ├── seo/
    ├── ai/
    ├── models/
    └── geo/
```

## ⚠️ 注意事项
1. Billing 页面已可使用，其他页面仍需迁移
2. 旧 AdminClient.tsx 的 tab 模式仍保留用于向后兼容
3. 研发工具需要隐藏到 `/admin/tools/*`，不在侧边栏显示
