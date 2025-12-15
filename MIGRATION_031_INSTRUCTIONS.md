# 数据库迁移 031 - 动态页面SEO管理表

## 📋 迁移文件

`supabase/migrations/031_create_dynamic_page_seo.sql`

## ✅ 迁移内容

创建 `dynamic_page_seo` 表，用于管理动态页面的SEO属性，特别是 `/video?prompt=...` 等动态生成的页面。

## 🚀 执行步骤

### 方法1：通过 Supabase Dashboard（推荐）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 点击 **New query**
5. 复制并粘贴 `supabase/migrations/031_create_dynamic_page_seo.sql` 的完整内容
6. 点击 **Run** 执行

### 方法2：通过 Supabase CLI

```bash
# 在项目根目录执行
supabase db push
```

或者：

```bash
# 直接执行迁移文件
supabase db execute -f supabase/migrations/031_create_dynamic_page_seo.sql
```

## 📊 表结构

### 主要字段

- `id` - UUID主键
- `page_path` - 页面路径（如 `/video`）
- `page_params` - 页面参数JSON（如 `{"prompt": "..."}`）
- `page_url` - 完整URL（如 `/video?prompt=...`），唯一约束
- `title` - SEO标题
- `description` - SEO描述
- `h1_text` - H1标签文本
- `seo_content` - SEO友好的文本内容（用于提高字数）
- `meta_keywords` - 关键词数组
- `is_active` - 是否启用
- `priority` - 优先级（数字越大优先级越高）
- `created_by_admin_id` - 创建者管理员ID

### 索引

- `idx_dynamic_page_seo_page_path` - 页面路径索引
- `idx_dynamic_page_seo_page_url` - 页面URL索引（唯一）
- `idx_dynamic_page_seo_active` - 启用状态索引
- `idx_dynamic_page_seo_priority` - 优先级索引
- `idx_dynamic_page_seo_params` - 参数JSONB索引（GIN）

### 行级安全策略（RLS）

1. **公开读取策略** (`dynamic_page_seo_public_select`)
   - 允许匿名用户和认证用户读取 `is_active = TRUE` 的记录

2. **管理员完全管理策略** (`dynamic_page_seo_admin_all`)
   - 允许管理员用户（`admin_users` 表中的活跃用户）进行所有操作

## ⚠️ 注意事项

### 1. 依赖关系

此迁移依赖于：
- `admin_users` 表（必须已存在）
- `update_updated_at_column()` 函数（必须已存在）

如果这些不存在，迁移会失败。请确保先执行：
- `007_create_admin_users_and_sessions.sql`
- `000_complete_setup.sql`（包含 `update_updated_at_column` 函数）

### 2. RLS策略检查

RLS策略会检查 `admin_users.is_active` 字段。如果 `admin_users` 表没有 `is_active` 字段，需要先添加：

```sql
-- 如果 admin_users 表没有 is_active 字段，先执行这个
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

### 3. 唯一约束

`page_url` 字段有唯一约束，确保每个URL只有一个SEO配置。如果尝试插入重复的URL，会返回错误。

## 🧪 验证迁移

执行迁移后，可以通过以下SQL验证：

```sql
-- 检查表是否存在
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'dynamic_page_seo'
);

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'dynamic_page_seo';

-- 检查RLS策略
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'dynamic_page_seo';
```

## 📝 使用示例

### 创建SEO配置

```sql
INSERT INTO dynamic_page_seo (
  page_path,
  page_url,
  page_params,
  title,
  description,
  h1_text,
  seo_content,
  meta_keywords,
  is_active,
  priority
) VALUES (
  '/video',
  '/video?prompt=A sweeping aerial shot over a futuristic coastal city',
  '{"prompt": "A sweeping aerial shot over a futuristic coastal city"}',
  'Generate: A sweeping aerial shot over a futuristic coastal city',
  'Create stunning AI-generated videos of futuristic coastal cities using OpenAI Sora 2.0. Transform your text prompts into professional-quality videos instantly.',
  'Generate Video: A sweeping aerial shot over a futuristic coastal city',
  'This page is dedicated to generating AI videos based on the prompt: "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera." Our platform uses OpenAI Sora 2.0 technology to create high-quality, professional videos from text descriptions. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal. Whether you are creating marketing content, social media videos, or creative projects, our AI video generation platform makes it easy to bring your ideas to life.',
  ARRAY['AI video generation', 'futuristic city', 'aerial shot', 'Sora 2.0'],
  TRUE,
  10
);
```

### 查询SEO配置

```sql
-- 根据URL查询
SELECT * FROM dynamic_page_seo 
WHERE page_url = '/video?prompt=...' 
AND is_active = TRUE;

-- 根据页面路径查询所有配置
SELECT * FROM dynamic_page_seo 
WHERE page_path = '/video' 
AND is_active = TRUE 
ORDER BY priority DESC;
```

## 🔧 故障排除

### 错误：relation "admin_users" does not exist

**原因**：`admin_users` 表不存在

**解决**：先执行 `007_create_admin_users_and_sessions.sql`

### 错误：function update_updated_at_column() does not exist

**原因**：`update_updated_at_column` 函数不存在

**解决**：先执行 `000_complete_setup.sql` 或包含该函数的迁移文件

### 错误：column "is_active" does not exist

**原因**：`admin_users` 表没有 `is_active` 字段

**解决**：执行以下SQL添加字段：
```sql
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

## ✅ 迁移完成后的下一步

1. **验证表结构**：使用上面的验证SQL
2. **测试API**：测试 `/api/admin/dynamic-page-seo` 端点
3. **创建Admin界面**：创建 `AdminDynamicPageSeoManager` 组件
4. **开始使用**：在admin后台为动态页面创建SEO配置
