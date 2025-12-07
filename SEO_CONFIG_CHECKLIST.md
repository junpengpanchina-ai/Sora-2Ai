# SEO 配置检查清单

## ✅ 代码层面已配置（已完成）

### 1. Sitemap 配置 ✅
- [x] `/app/sitemap-long-tail.xml/route.ts` - 自动生成所有已发布的长尾词
- [x] `/app/sitemap-index.xml/route.ts` - 包含长尾词 sitemap 的索引
- [x] `/app/sitemap.xml/route.ts` - 主 sitemap（指向 sitemap-index.xml）
- [x] 自动更新（每 3600 秒重新生成）
- [x] 包含 lastmod 和 priority (0.7)

### 2. Meta 标签 ✅
- [x] **Title**: 使用 `buildMetaTitle()` 生成，优先使用自定义 title，否则使用 keyword
- [x] **Description**: 使用 `buildMetaDescription()` 生成，优先使用自定义 meta_description
- [x] **Canonical URL**: 自动生成规范 URL，避免重复内容
- [x] 位置：`app/keywords/[slug]/page.tsx` 的 `generateMetadata()` 函数

### 3. 结构化数据 ✅
- [x] **FAQ Schema.org**: 当长尾词有 FAQ 时自动生成
- [x] 符合 Google 的结构化数据规范
- [x] 位置：`app/keywords/[slug]/page.tsx` 第 122-136 行

### 4. Robots.txt ✅
- [x] `/app/robots.ts` 已创建
- [x] 允许搜索引擎抓取所有公开页面
- [x] 禁止抓取 `/admin/`, `/api/`, `/auth/` 等私有路径
- [x] 包含 sitemap 链接

### 5. 页面可访问性 ✅
- [x] 页面公开访问（不需要登录）
- [x] 使用 Server Components（SEO 友好）
- [x] 查询条件：只显示 `status = 'published'` 的长尾词
- [x] Middleware 不会阻止搜索引擎爬虫

## ⚠️ 需要部署后配置的

### 1. 环境变量配置（Vercel）

**需要确认**：在生产环境（Vercel）设置以下环境变量：

```env
NEXT_PUBLIC_SITE_URL=https://www.sora2ai.com
```

**检查方法**：
1. 访问 Vercel Dashboard
2. 进入项目 Settings > Environment Variables
3. 确认 `NEXT_PUBLIC_SITE_URL` 已设置且值为你的实际域名

**影响**：
- 如果没有设置，sitemap 和 canonical URL 会使用默认值 `https://www.sora2ai.com`
- 如果域名不对，会影响 SEO

### 2. Google Search Console 提交（部署后操作）

**步骤**：
1. 访问 [Google Search Console](https://search.google.com/search-console)
2. 添加网站属性（输入你的域名）
3. 验证所有权（推荐使用 DNS 验证）
4. 提交 Sitemap：
   - 提交 `https://your-domain.com/sitemap.xml`
   - 或直接提交 `https://your-domain.com/sitemap-long-tail.xml`

**验证方法**：
部署后访问以下 URL 确认可以正常访问：
- `https://your-domain.com/sitemap.xml`
- `https://your-domain.com/sitemap-index.xml`
- `https://your-domain.com/sitemap-long-tail.xml`
- `https://your-domain.com/robots.txt`

## 📊 当前配置状态总结

### 代码层面：✅ 100% 完成
- ✅ Sitemap 配置
- ✅ Meta 标签
- ✅ 结构化数据
- ✅ Robots.txt
- ✅ 页面可访问性

### 部署后操作：⚠️ 待完成
- ⚠️ 确认环境变量 `NEXT_PUBLIC_SITE_URL`
- ⚠️ 提交到 Google Search Console

## 🔍 验证清单（部署后）

部署完成后，按以下步骤验证：

### 步骤 1: 验证 URL 可访问
```bash
# 检查 sitemap
curl https://your-domain.com/sitemap.xml
curl https://your-domain.com/sitemap-long-tail.xml

# 检查 robots.txt
curl https://your-domain.com/robots.txt

# 检查长尾词页面
curl https://your-domain.com/keywords/your-keyword-slug
```

### 步骤 2: 验证 Meta 标签
1. 访问任意长尾词页面
2. 查看页面源码（右键 > 查看源代码）
3. 确认以下标签存在：
   - `<title>...</title>`
   - `<meta name="description" content="...">`
   - `<link rel="canonical" href="...">`

### 步骤 3: 验证结构化数据
1. 访问有 FAQ 的长尾词页面
2. 使用 [Google Rich Results Test](https://search.google.com/test/rich-results)
3. 输入页面 URL，检查结构化数据是否正确

### 步骤 4: 提交到 Google Search Console
1. 登录 Google Search Console
2. 选择你的网站属性
3. 进入 "Sitemaps" 部分
4. 提交 `https://your-domain.com/sitemap.xml`

### 步骤 5: 验证索引状态
提交 sitemap 后 1-3 天：
1. 在 Google Search Console 查看 "覆盖率" 报告
2. 使用 Google 搜索：`site:your-domain.com "关键词"`
3. 检查长尾词页面是否已被索引

## 🎯 预计时间线

- **部署完成**：立即生效
- **Sitemap 提交后**：1-3 天 Google 开始抓取
- **首次索引**：1-2 周
- **稳定收录**：2-4 周

## 📝 注意事项

1. **环境变量很重要**：确保生产环境的 `NEXT_PUBLIC_SITE_URL` 设置正确
2. **只有已发布的长尾词会被索引**：确保要索引的长尾词状态为 `published`
3. **定期更新**：Sitemap 每 3600 秒（1小时）自动更新，长尾词页面每 1800 秒（30分钟）重新验证
4. **监控 Search Console**：定期检查是否有抓取错误或索引问题

---

**总结**：代码层面的 SEO 配置已 100% 完成，部署后只需确认环境变量并提交到 Google Search Console 即可开始被索引。
