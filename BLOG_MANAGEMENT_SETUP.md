# 博客文章管理功能设置指南

## ✅ 已完成的工作

### 1. 数据库表创建
- ✅ 创建了 `blog_posts` 表（迁移文件：`032_create_blog_posts.sql`）
- ✅ 包含所有必需字段：slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords
- ✅ 设置了RLS策略（公开可读已发布文章，管理员可管理所有）
- ✅ 已插入2篇初始文章作为示例

### 2. API路由
- ✅ `/api/admin/blog-posts` - GET（获取所有文章）、POST（创建文章）
- ✅ `/api/admin/blog-posts/[id]` - PUT（更新文章）、DELETE（删除文章）

### 3. Admin管理界面
- ✅ 创建了 `AdminBlogManager` 组件
- ✅ 已集成到 `AdminClient` 中，添加了"博客文章"标签页
- ✅ 功能包括：
  - 创建新博客文章
  - 编辑现有文章
  - 删除文章
  - 搜索和筛选
  - 发布/草稿状态管理

## 📋 需要执行的步骤

### 1. 运行数据库迁移

在Supabase中执行迁移文件：

```sql
-- 执行文件：supabase/migrations/032_create_blog_posts.sql
```

或者在本地运行：

```bash
# 如果你使用Supabase CLI
supabase db push
```

### 2. 将现有博客文章导入数据库

目前博客文章是硬编码在 `app/blog/[slug]/page.tsx` 中的。你需要：

**选项A：通过Admin界面手动创建**
1. 登录admin后台
2. 进入"博客文章"标签页
3. 为每篇文章创建新记录

**选项B：通过SQL批量导入**
可以创建一个SQL脚本，将所有现有文章导入数据库。

### 3. 修改博客页面从数据库读取

目前博客页面仍然从硬编码的 `blogPosts` 对象读取。需要修改 `app/blog/[slug]/page.tsx` 从数据库读取。

## 🔄 下一步：修改博客页面从数据库读取

需要修改 `app/blog/[slug]/page.tsx`：

1. 移除硬编码的 `blogPosts` 对象
2. 添加从数据库读取的函数
3. 使用 `generateStaticParams` 从数据库获取所有slug
4. 在页面组件中从数据库读取文章内容

## 📝 注意事项

1. **数据同步**：目前代码中的文章和数据库中的文章是分开的。需要选择一种方式：
   - 完全迁移到数据库（推荐）
   - 或者保持代码中的作为fallback

2. **SEO影响**：如果改为从数据库读取，需要确保：
   - 所有现有URL保持不变
   - 生成静态页面的逻辑正确
   - sitemap包含所有文章

3. **性能**：考虑使用ISR（Incremental Static Regeneration）来平衡性能和动态内容。

## 🎯 建议的实施顺序

1. ✅ 先运行数据库迁移
2. ✅ 通过admin界面测试创建/编辑功能
3. ⏳ 将现有文章导入数据库
4. ⏳ 修改博客页面从数据库读取
5. ⏳ 测试所有功能
6. ⏳ 部署到生产环境

---

**当前状态**：数据库表和admin界面已创建，等待数据库迁移和页面修改。

