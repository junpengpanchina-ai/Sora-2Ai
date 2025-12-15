# 验证动态页面SEO配置是否生效

## ✅ 配置已创建

恭喜！SEO配置已成功创建。现在需要验证配置是否正确应用到页面上。

## 🔍 验证步骤

### 1. 检查数据库中的配置

在 Supabase SQL Editor 中执行：

```sql
-- 查看所有配置
SELECT 
  page_url,
  title,
  description,
  h1_text,
  LENGTH(seo_content) as content_length,
  is_active,
  priority
FROM dynamic_page_seo
WHERE is_active = TRUE
ORDER BY priority DESC, created_at DESC;
```

### 2. 验证页面是否正确使用配置

#### 方法1：查看页面源代码

1. 访问配置的页面URL（如：`https://sora2aivideos.com/video?prompt=A sweeping aerial shot...`）
2. 右键点击页面 → "查看页面源代码" 或按 `Ctrl+U` (Windows) / `Cmd+Option+U` (Mac)
3. 检查以下内容：

**检查 `<title>` 标签：**
```html
<title>Generate: A sweeping aerial shot over a futuristic coastal city</title>
```

**检查 `<meta name="description">` 标签：**
```html
<meta name="description" content="Create stunning AI-generated videos of futuristic coastal cities at sunset using OpenAI Sora 2.0...">
```

#### 方法2：使用浏览器开发者工具

1. 打开页面
2. 按 `F12` 打开开发者工具
3. 在 Console 中执行：

```javascript
// 检查标题
console.log('Title:', document.title);

// 检查meta描述
const metaDesc = document.querySelector('meta[name="description"]');
console.log('Description:', metaDesc ? metaDesc.content : 'Not found');

// 检查H1标签
const h1 = document.querySelector('h1');
console.log('H1:', h1 ? h1.textContent : 'Not found');
```

#### 方法3：使用在线SEO工具

- **Google Rich Results Test**: https://search.google.com/test/rich-results
- **SEO Checker**: 输入页面URL，检查标题和描述

### 3. 检查SEO内容是否显示

SEO内容（`seo_content`）应该在页面中可见。检查方法：

1. 访问页面
2. 查看页面中是否包含你在 `seo_content` 中输入的文本
3. 如果使用了 `sr-only` 类，内容对搜索引擎可见但对用户不可见

## 🚀 为其他页面创建配置

现在可以为其他"字数较少"的页面创建配置了：

### 快速创建配置的SQL模板

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
  '/video?prompt=YOUR_PROMPT_HERE',  -- 替换为实际的prompt
  '{"prompt": "YOUR_PROMPT_HERE"}',  -- 替换为实际的prompt
  'Generate: YOUR_TITLE_HERE',        -- 替换为标题
  'YOUR_DESCRIPTION_HERE',            -- 替换为描述（至少150字）
  'Generate Video: YOUR_H1_HERE',     -- 替换为H1文本
  'YOUR_SEO_CONTENT_HERE',            -- 替换为SEO内容（至少300字）
  ARRAY['keyword1', 'keyword2'],     -- 替换为关键词数组
  TRUE,
  10
) RETURNING *;
```

### 需要优化的页面列表

根据之前的审计，以下页面需要创建SEO配置：

1. ✅ `/video?prompt=A sweeping aerial shot...` - 已创建
2. ⏳ `/video?prompt=Close-up of two curious red pandas...`
3. ⏳ `/video?prompt=Editorial fashion walk...`
4. ⏳ `/video?prompt=Slow-motion shot of a basketball player...`
5. ⏳ 其他动态生成的视频页面

## 📊 监控和统计

### 查看所有配置的统计信息

```sql
SELECT 
  COUNT(*) as total_configs,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_configs,
  AVG(LENGTH(seo_content)) as avg_content_length,
  MIN(LENGTH(seo_content)) as min_content_length,
  MAX(LENGTH(seo_content)) as max_content_length
FROM dynamic_page_seo;
```

### 检查低字数配置

```sql
-- 查找字数少于300的配置
SELECT 
  page_url,
  title,
  LENGTH(seo_content) as content_length
FROM dynamic_page_seo
WHERE LENGTH(seo_content) < 300
  AND is_active = TRUE
ORDER BY content_length ASC;
```

## ⚠️ 常见问题

### 问题1：页面没有使用数据库配置

**可能原因：**
- 配置的 `is_active` 为 `FALSE`
- `page_url` 不完全匹配（注意URL编码）
- 页面缓存问题

**解决方法：**
1. 检查配置的 `is_active` 状态
2. 确保 `page_url` 完全匹配（包括所有查询参数）
3. 清除浏览器缓存或使用无痕模式访问

### 问题2：SEO内容没有显示

**可能原因：**
- `VideoPageClient` 还没有集成数据库中的SEO内容
- 内容被CSS隐藏（使用 `sr-only` 类）

**解决方法：**
- 目前 `seo_content` 需要在 `VideoPageClient` 中集成才能显示
- 或者等待Admin管理界面创建后统一管理

### 问题3：标题和描述没有更新

**可能原因：**
- 浏览器缓存
- Next.js 构建缓存

**解决方法：**
1. 硬刷新页面（`Ctrl+Shift+R` 或 `Cmd+Shift+R`）
2. 如果使用 Vercel，等待自动重新部署
3. 检查 `app/video/page.tsx` 中的 `generateMetadata` 函数是否正确读取数据库

## ✅ 验证清单

- [x] 数据库表已创建
- [x] 第一条SEO配置已创建
- [ ] 验证页面标题是否正确
- [ ] 验证页面描述是否正确
- [ ] 验证H1标签是否正确
- [ ] 为其他页面创建配置
- [ ] 监控SEO表现

## 🎯 下一步

1. **验证当前配置**：访问页面，检查标题和描述是否正确
2. **创建更多配置**：为其他低字数页面创建SEO配置
3. **等待Admin界面**：创建Admin管理界面后，可以更方便地管理所有配置
4. **监控SEO表现**：使用Google Search Console监控页面索引和排名

配置已成功创建！现在可以开始为其他页面创建配置了。
