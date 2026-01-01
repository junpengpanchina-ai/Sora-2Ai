# 迁移后的下一步操作指南

> **SQL 迁移已执行成功！** ✅  
> 现在需要完成以下步骤来开始使用新功能

---

## ✅ Step 1：验证数据库表已创建

### 在 Supabase Dashboard 中检查

1. 访问：https://supabase.com/dashboard/project/hgzpzsiafycwlqrkzbis
2. 进入 **Table Editor**
3. 确认以下表已创建：
   - ✅ `page_meta`
   - ✅ `index_health_daily`
   - ✅ `page_priority_queue`

---

## ✅ Step 2：测试 Page Meta 功能

### 运行测试脚本

```bash
npm run test:page-meta
```

**预期输出**：
- ✅ 创建 page_meta 记录成功
- ✅ 更新 page_meta 字段成功
- ✅ 查询 page_meta 成功
- ✅ Index Health 函数测试（可能显示"还没有数据"，这是正常的）

---

## ✅ Step 3：为现有页面创建 page_meta 记录

### 方式 1：使用 Supabase Dashboard

1. 进入 **SQL Editor**
2. 执行以下 SQL（示例：为 use_cases 表创建 page_meta）：

```sql
-- 为所有 use_cases 创建 page_meta 记录
INSERT INTO page_meta (page_type, page_id, page_slug, status)
SELECT 
  'use_case' as page_type,
  id as page_id,
  slug as page_slug,
  'published' as status
FROM use_cases
WHERE status = 'published'
ON CONFLICT (page_type, page_id) DO NOTHING;
```

**注意**：根据你的实际表名和字段名调整 SQL。

---

### 方式 2：使用代码批量创建

创建一个脚本 `scripts/init-page-meta.ts`：

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function initPageMeta() {
  // 1. 获取所有已发布的 use_cases
  const { data: useCases } = await supabase
    .from('use_cases')
    .select('id, slug')
    .eq('status', 'published')

  // 2. 批量创建 page_meta 记录
  const pageMetaRecords = useCases?.map(uc => ({
    page_type: 'use_case',
    page_id: uc.id,
    page_slug: uc.slug,
    status: 'published',
  })) || []

  if (pageMetaRecords.length > 0) {
    const { error } = await supabase
      .from('page_meta')
      .upsert(pageMetaRecords, { onConflict: 'page_type,page_id' })

    if (error) {
      console.error('❌ 创建失败:', error)
    } else {
      console.log(`✅ 成功创建 ${pageMetaRecords.length} 条 page_meta 记录`)
    }
  }
}
```

---

## ✅ Step 4：更新 Index Health 数据

### 手动更新（第一次）

1. 进入 **SQL Editor**
2. 执行以下 SQL（填入你的实际 GSC 数据）：

```sql
INSERT INTO index_health_daily (
  day,
  discovered,
  crawled,
  indexed,
  sitemap_success
) VALUES (
  CURRENT_DATE,
  25000,  -- 替换为你的 Discovered 数量
  18000,  -- 替换为你的 Crawled 数量
  14000,  -- 替换为你的 Indexed 数量
  true
)
ON CONFLICT (day) DO UPDATE SET
  discovered = EXCLUDED.discovered,
  crawled = EXCLUDED.crawled,
  indexed = EXCLUDED.indexed,
  sitemap_success = EXCLUDED.sitemap_success;
```

---

### 自动更新（推荐）

创建一个定时任务，每天更新 Index Health：

```typescript
// scripts/update-index-health.ts
import { updateIndexHealthSnapshot } from '../lib/index-health'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function updateIndexHealth() {
  // 从 Google Search Console 获取数据（需要实现 GSC API 调用）
  const discovered = 25000 // 从 GSC 获取
  const crawled = 18000    // 从 GSC 获取
  const indexed = 14000    // 从 GSC 获取

  await updateIndexHealthSnapshot(supabase as any, {
    day: new Date(),
    discovered,
    crawled,
    indexed,
    sitemapSuccess: true,
  })
}
```

---

## ✅ Step 5：运行页面挑选算法

### 手动运行

```bash
npm run pick-pages
```

**功能**：
- 从 `page_meta` 表查询候选页面
- 根据 Index Health 和 Purchase Intent 评分
- 将结果写入 `page_priority_queue` 表

---

### 设置定时任务（推荐）

**使用 cron**（Linux/Mac）：

```bash
# 每天上午 9 点运行
0 9 * * * cd /path/to/project && npm run pick-pages
```

**使用 GitHub Actions**（如果部署在 GitHub）：

```yaml
# .github/workflows/daily-page-picker.yml
name: Daily Page Picker
on:
  schedule:
    - cron: '0 9 * * *'  # 每天 UTC 9 点
  workflow_dispatch:  # 允许手动触发

jobs:
  pick-pages:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run pick-pages
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

---

## ✅ Step 6：从队列读取并发布页面

### 创建发布脚本

```typescript
// scripts/publish-from-queue.ts
import { readFromQueue } from '../lib/page-priority-queue'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function publishFromQueue() {
  // 1. 从队列读取待发布页面
  const pages = await readFromQueue(supabase as any, 50)

  // 2. 发布每个页面
  for (const page of pages) {
    // 根据 page_type 和 page_id 发布页面
    // 这里需要根据你的实际发布逻辑实现
    console.log(`发布: ${page.pageType}/${page.pageId}`)
  }

  // 3. 标记为已发布
  // await markAsPublished(...)
}
```

---

## 📋 检查清单

- [ ] 验证数据库表已创建
- [ ] 运行测试脚本 `npm run test:page-meta`
- [ ] 为现有页面创建 page_meta 记录
- [ ] 更新 Index Health 数据
- [ ] 运行页面挑选算法 `npm run pick-pages`
- [ ] 设置定时任务（可选）
- [ ] 创建发布脚本（可选）

---

## 🎯 下一步

完成以上步骤后，你就可以：

1. ✅ 使用 `page_meta` 表管理所有页面的运营字段
2. ✅ 使用 `index_health_daily` 表跟踪 Index Health
3. ✅ 使用 `page_priority_queue` 表自动挑选高转化页面
4. ✅ 根据 Index Health 和 Purchase Intent 自动决定发布策略

---

## 📚 相关文档

- `docs/EXECUTE_MIGRATION.md` - 执行迁移指南
- `docs/DATABASE_IMPLEMENTATION_GUIDE.md` - 数据库实现指南
- `docs/RHYTHM_CONTROLLER.md` - 节奏控制器
- `docs/COMPLETE_GEO_SEO_GUIDE.md` - 完整 GEO & SEO 指南

---

**恭喜！你的 GEO & SEO 运营系统已经就绪！** 🎉

