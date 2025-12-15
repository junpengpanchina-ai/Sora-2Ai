# 动态页面SEO管理功能

## 📋 问题

用户报告"还有7页字数较少：是admin后台没有同步管理到这些"。

这些动态生成的 `/video?prompt=...` 页面目前无法在admin后台进行SEO管理，导致：
1. 无法为这些页面设置独特的标题和描述
2. 无法添加SEO友好的文本内容来提高字数
3. 无法管理H1标签文本
4. 无法优化这些页面的SEO表现

## ✅ 解决方案

### 1. 数据库表设计

创建 `dynamic_page_seo` 表来存储动态页面的SEO信息：

```sql
CREATE TABLE dynamic_page_seo (
  id UUID PRIMARY KEY,
  page_path TEXT NOT NULL, -- 如 '/video'
  page_params JSONB, -- 如 {"prompt": "..."}
  page_url TEXT NOT NULL UNIQUE, -- 完整URL
  title TEXT NOT NULL, -- SEO标题
  description TEXT, -- SEO描述
  h1_text TEXT, -- H1标签文本
  seo_content TEXT, -- SEO友好的文本内容
  meta_keywords TEXT[], -- 关键词数组
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_by_admin_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. Admin后台管理界面

创建 `AdminDynamicPageSeoManager` 组件，允许管理员：
- 查看所有动态页面的SEO配置
- 为特定 prompt 创建或编辑SEO配置
- 批量管理多个页面的SEO
- 启用/禁用SEO配置

### 3. 页面集成

修改 `/video` 页面，让它：
1. 首先检查数据库中是否有该URL的SEO配置
2. 如果有，使用数据库中的配置
3. 如果没有，使用默认的动态生成逻辑

## 🚀 实施步骤

### 步骤1：创建数据库迁移

已创建：`supabase/migrations/031_create_dynamic_page_seo.sql`

### 步骤2：创建API路由

需要创建：
- `app/api/admin/dynamic-page-seo/route.ts` - 获取和创建SEO配置
- `app/api/admin/dynamic-page-seo/[id]/route.ts` - 更新和删除SEO配置

### 步骤3：创建Admin管理组件

需要创建：
- `app/admin/AdminDynamicPageSeoManager.tsx` - 管理界面组件

### 步骤4：修改视频页面

修改 `app/video/page.tsx`，让它从数据库读取SEO配置。

## 📝 使用场景

### 场景1：为热门Prompt创建SEO配置

1. 管理员在后台看到某个 prompt 被频繁使用
2. 为该 prompt 创建专门的SEO配置
3. 设置独特的标题、描述和SEO内容
4. 提高该页面的SEO表现

### 场景2：批量优化低字数页面

1. 管理员在SEO工具中发现多个页面字数较少
2. 在admin后台批量创建SEO配置
3. 为每个页面添加丰富的SEO内容
4. 提高整体SEO表现

### 场景3：管理动态页面H1标签

1. 管理员可以为特定 prompt 设置自定义H1标签
2. 确保每个页面都有合适的H1标签
3. 提高页面的SEO可读性

## 🔍 技术细节

### URL匹配逻辑

```typescript
// 匹配逻辑：精确匹配 > 参数匹配 > 默认配置
1. 精确匹配 page_url
2. 匹配 page_path + page_params
3. 使用默认动态生成逻辑
```

### SEO内容优先级

```typescript
// 优先级：数据库配置 > 动态生成 > 默认值
1. 数据库中的 seo_content（如果存在）
2. 客户端组件中的动态内容
3. 默认的SEO文本
```

## 📊 预期效果

实施后，管理员可以：
- ✅ 管理所有动态页面的SEO属性
- ✅ 为热门 prompt 创建专门的SEO配置
- ✅ 批量优化低字数页面
- ✅ 提高整体SEO表现
- ✅ 确保所有页面都有足够的文本内容
