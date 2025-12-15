# 动态页面SEO管理 - 下一步操作指南

## ✅ 迁移成功确认

`dynamic_page_seo` 表已成功创建！现在可以开始使用动态页面SEO管理功能了。

## 🚀 下一步操作

### 1. 测试API端点

可以通过以下方式测试API是否正常工作：

#### 创建SEO配置（通过API）

```bash
# 使用 curl 测试
curl -X POST https://your-domain.com/api/admin/dynamic-page-seo \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=your_session_token" \
  -d '{
    "page_path": "/video",
    "page_url": "/video?prompt=A sweeping aerial shot over a futuristic coastal city",
    "title": "Generate: A sweeping aerial shot over a futuristic coastal city",
    "description": "Create stunning AI-generated videos of futuristic coastal cities using OpenAI Sora 2.0.",
    "h1_text": "Generate Video: A sweeping aerial shot over a futuristic coastal city",
    "seo_content": "This page is dedicated to generating AI videos based on the prompt: \"A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera.\" Our platform uses OpenAI Sora 2.0 technology to create high-quality, professional videos from text descriptions. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal. Whether you are creating marketing content, social media videos, or creative projects, our AI video generation platform makes it easy to bring your ideas to life. The video generation process is simple: enter your detailed text description, select your preferred aspect ratio and duration, and let our AI do the rest. All videos are generated in high quality and can be downloaded immediately after completion.",
    "meta_keywords": ["AI video generation", "futuristic city", "aerial shot", "Sora 2.0"],
    "is_active": true,
    "priority": 10
  }'
```

#### 查询SEO配置

```sql
-- 在 Supabase SQL Editor 中查询
SELECT * FROM dynamic_page_seo 
WHERE page_path = '/video' 
AND is_active = TRUE 
ORDER BY priority DESC;
```

### 2. 为低字数页面创建SEO配置

根据之前的审计，以下页面需要优化：

1. **`/video?prompt=A sweeping aerial shot...`** - 字数较少
2. **`/video?prompt=Close-up of two curious red pandas...`** - 字数较少
3. **`/video?prompt=Editorial fashion walk...`** - 字数较少
4. **`/video?prompt=Slow-motion shot of a basketball player...`** - 字数较少
5. 其他动态生成的视频页面

#### 示例：为第一个页面创建SEO配置

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
  '/video?prompt=A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera.',
  '{"prompt": "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera."}',
  'Generate: A sweeping aerial shot over a futuristic coastal city',
  'Create stunning AI-generated videos of futuristic coastal cities at sunset using OpenAI Sora 2.0. Transform your text prompts into professional-quality videos with neon lights, flying vehicles, and cinematic effects.',
  'Generate Video: A sweeping aerial shot over a futuristic coastal city',
  'This page is dedicated to generating AI videos based on the prompt: "A sweeping aerial shot over a futuristic coastal city at sunset, glass skyscrapers with neon lights, flying vehicles leaving light trails, camera gliding through the skyline with lens flares, ultra realistic, shot on 8k cinema camera." Our platform uses OpenAI Sora 2.0 technology to create high-quality, professional videos from text descriptions. Each video is generated with attention to detail, ensuring cinematic quality and visual appeal. The futuristic cityscape with neon lights and flying vehicles creates a stunning visual experience that captures the imagination. Whether you are creating marketing content, social media videos, or creative projects, our AI video generation platform makes it easy to bring your ideas to life. The video generation process is simple: enter your detailed text description, select your preferred aspect ratio and duration, and let our AI do the rest. All videos are generated in high quality and can be downloaded immediately after completion.',
  ARRAY['AI video generation', 'futuristic city', 'aerial shot', 'Sora 2.0', 'neon lights', 'flying vehicles'],
  TRUE,
  10
);
```

### 3. 创建Admin管理界面（待完成）

目前API已经可用，但还需要创建Admin后台管理界面，让管理员可以：
- 查看所有动态页面SEO配置
- 创建新的SEO配置
- 编辑现有配置
- 删除配置
- 启用/禁用配置

**需要创建的文件：**
- `app/admin/AdminDynamicPageSeoManager.tsx`

**需要修改的文件：**
- `app/admin/AdminClient.tsx` - 添加新的标签页

### 4. 验证页面SEO

创建SEO配置后，可以验证页面是否正确使用了配置：

1. **访问页面**：`https://sora2aivideos.com/video?prompt=...`
2. **查看页面源代码**：检查 `<title>` 和 `<meta name="description">` 标签
3. **检查H1标签**：查看页面中的H1标签文本
4. **检查SEO内容**：查看页面中是否包含 `seo_content` 中的文本

## 📊 当前状态

### ✅ 已完成

- [x] 数据库表创建
- [x] API路由（GET, POST, PATCH, DELETE）
- [x] 类型定义
- [x] 页面集成（`/video` 页面会从数据库读取SEO配置）

### ⏳ 待完成

- [ ] Admin管理界面组件
- [ ] 注册到AdminClient
- [ ] VideoPageClient集成（显示H1和SEO内容）

## 🎯 快速开始

### 方法1：直接通过SQL创建配置

在 Supabase SQL Editor 中执行上面的 INSERT 语句，为需要优化的页面创建SEO配置。

### 方法2：通过API创建配置

使用 Postman 或 curl 调用 `/api/admin/dynamic-page-seo` API端点。

### 方法3：等待Admin界面（推荐）

等待Admin管理界面创建完成后，通过可视化界面管理所有SEO配置。

## 📝 注意事项

1. **URL编码**：创建配置时，确保 `page_url` 中的特殊字符已正确编码
2. **唯一性**：每个 `page_url` 只能有一个配置（有唯一约束）
3. **优先级**：如果有多个配置匹配，会使用优先级最高的（priority DESC）
4. **启用状态**：只有 `is_active = TRUE` 的配置才会被使用

## 🔍 故障排除

### 问题：页面没有使用数据库中的SEO配置

**检查：**
1. 配置的 `is_active` 是否为 `TRUE`
2. `page_url` 是否完全匹配（包括查询参数）
3. 查看浏览器控制台是否有错误

### 问题：无法创建配置（唯一约束错误）

**解决：** 检查是否已存在相同 `page_url` 的配置，如果存在，使用 PATCH 更新而不是 POST 创建。

## ✅ 验证清单

- [x] 数据库表已创建
- [ ] 为至少一个页面创建了SEO配置
- [ ] 验证页面正确使用了SEO配置
- [ ] Admin管理界面已创建（可选）

现在可以开始为那些"字数较少"的页面创建SEO配置了！
