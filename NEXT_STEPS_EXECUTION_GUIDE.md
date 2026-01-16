# 下一步执行指南

## ✅ 步骤 1: 应用数据库迁移

**文件**: `./APPLY_MIGRATION_061.md`

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 复制 `./supabase/migrations/061_create_tier1_internal_links_tables.sql` 的内容
6. 粘贴并点击 **Run**
7. 确认看到 "Success" 消息

**验证**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('page_internal_links', 'index_health_reports', 'ai_serp_checks');
```

应该返回 3 行。

---

## ✅ 步骤 2: 运行内链生成脚本

**前提条件**:
- 已应用数据库迁移（步骤 1）
- 已运行 `npm run calculate:ai-scores:batch`（计算 AI Citation Score）

**执行**:
```bash
# 确保环境变量已设置（.env.local）
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# 运行生成脚本
npm run generate:tier1-links
```

**预期输出**:
```
🚀 开始生成 Tier1 内链（周: 2026-W03）...

📊 Step 1: 加载 Tier1 页面...
✅ 找到 1000 个 Tier1 页面

📊 Step 2: 构建候选池...
   按 industry: 50 组
   按 scene: 6 组
   按 platform: 6 组

📊 Step 3: 生成内链...
   已处理 1000/1000 页...
✅ 生成 6000 条内链

📊 Step 4: 写入数据库...
   ✅ 批次 1: 2000 条
   ✅ 批次 2: 2000 条
   ✅ 批次 3: 2000 条

✅ 完成！
   成功写入: 6000 条
   周标识: 2026-W03
```

---

## ✅ 步骤 3: 在页面中添加内链组件

**已完成**: 已在 `./app/use-cases/[slug]/page.tsx` 中添加 `<RelatedTier1Links />` 组件

**位置**: 页面底部，在 `</main>` 之前

**代码**:
```tsx
{/* Tier1 内链（每周轮换） */}
<div className="mt-12">
  <RelatedTier1Links pageId={useCase.id} />
</div>
```

**验证**:
1. 启动开发服务器: `npm run dev`
2. 访问任意 use case 页面: `http://localhost:3000/use-cases/[slug]`
3. 滚动到页面底部，应该看到 "Related Use Cases" 部分

---

## ✅ 步骤 4: 访问 Index Health 周报

### 开发环境

```bash
# 启动开发服务器
npm run dev

# 访问周报页面
open http://localhost:3000/index-health

# 或获取 JSON
curl http://localhost:3000/api/reports/index-health
```

### 生产环境

```bash
# 部署后访问
https://sora2aivideos.com/index-health

# 或获取 JSON
curl https://sora2aivideos.com/api/reports/index-health
```

**预期内容**:
- Tier1 统计（数量、分数分布）
- SERP 监控结果（如果已运行监控脚本）
- 阈值检查
- 行动建议

---

## 🔍 验证清单

- [ ] 数据库迁移已应用（3 张表已创建）
- [ ] AI Citation Score 已计算（`page_scores` 表有数据）
- [ ] Tier1 内链已生成（`page_internal_links` 表有数据）
- [ ] 页面组件已添加（`<RelatedTier1Links />` 显示在页面上）
- [ ] Index Health 周报可访问（页面和 API 都正常）

---

## 🆘 故障排除

### 问题 1: `generate:tier1-links` 报错 "没有找到 Tier1 页面"
**解决**:
```bash
# 先运行 AI Citation Score 计算
npm run calculate:ai-scores:batch

# 然后再运行内链生成
npm run generate:tier1-links
```

### 问题 2: 内链组件不显示
**检查**:
1. 确认 `page_internal_links` 表有数据:
   ```sql
   SELECT COUNT(*) FROM page_internal_links;
   ```
2. 检查 API 是否返回数据:
   ```bash
   curl "http://localhost:3000/api/related-links?pageId=YOUR_PAGE_ID"
   ```
3. 查看浏览器控制台是否有错误

### 问题 3: Index Health 周报返回空数据
**检查**:
1. 确认 `page_scores` 表有 Tier1 数据:
   ```sql
   SELECT COUNT(*) FROM page_scores WHERE tier = 1;
   ```
2. 检查 API 日志是否有错误

---

## 📝 后续操作

### 每周自动任务（建议使用 Vercel Cron）

创建 `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/recalc-scores",
      "schedule": "0 2 * * 1"
    },
    {
      "path": "/api/cron/gen-links",
      "schedule": "30 2 * * 1"
    }
  ]
}
```

创建对应的 API 路由（包装脚本逻辑）。

---

**完成时间**: 约 10-15 分钟  
**状态**: ✅ 代码已就绪，等待执行
