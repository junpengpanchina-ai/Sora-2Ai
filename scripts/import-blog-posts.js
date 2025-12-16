// 脚本：从代码中提取博客文章并生成SQL导入语句
const fs = require('fs')
const path = require('path')

// 读取博客页面文件
const blogPagePath = path.join(__dirname, '../app/blog/[slug]/page.tsx')
const content = fs.readFileSync(blogPagePath, 'utf8')

// 提取blogPosts对象
const blogPostsMatch = content.match(/const blogPosts: Record<string, \{[\s\S]*?\}> = \{([\s\S]*?)\}/)

if (!blogPostsMatch) {
  console.error('无法找到blogPosts对象')
  process.exit(1)
}

// 解析每个文章（简化版，使用正则表达式）
const postsText = blogPostsMatch[1]
const postPattern = /'([^']+)':\s*\{[\s\S]*?title:\s*'([^']+)',[\s\S]*?description:\s*'([^']+)',[\s\S]*?h1:\s*'([^']+)',[\s\S]*?publishedAt:\s*'([^']+)',[\s\S]*?content:\s*`([\s\S]*?)`,[\s\S]*?relatedPosts:\s*\[([\s\S]*?)\],/g

const posts = []
let match
while ((match = postPattern.exec(postsText)) !== null) {
  const slug = match[1]
  const title = match[2].replace(/'/g, "''")
  const description = match[3].replace(/'/g, "''")
  const h1 = match[4].replace(/'/g, "''")
  const publishedAt = match[5]
  const content = match[6].replace(/'/g, "''").replace(/\n/g, ' ').trim()
  const relatedPosts = match[7]
    .split(',')
    .map((s) => s.trim().replace(/['"]/g, ''))
    .filter((s) => s.length > 0)

  // 提取SEO关键词（从title和description中推断）
  const seoKeywords = []
  if (title.toLowerCase().includes('sora')) seoKeywords.push('sora alternative')
  if (title.toLowerCase().includes('ai video')) seoKeywords.push('ai video generator')
  if (title.toLowerCase().includes('text to video')) seoKeywords.push('text to video ai')
  if (title.toLowerCase().includes('youtube')) seoKeywords.push('ai video for youtube')
  if (title.toLowerCase().includes('marketing')) seoKeywords.push('ai video for marketing')
  if (title.toLowerCase().includes('free')) seoKeywords.push('free ai video generator')

  posts.push({
    slug,
    title,
    description,
    h1,
    content,
    publishedAt,
    relatedPosts,
    seoKeywords,
  })
}

// 生成SQL
const sqlStatements = posts.map((post) => {
  const relatedPostsArray = `ARRAY[${post.relatedPosts.map((p) => `'${p}'`).join(', ')}]`
  const seoKeywordsArray = `ARRAY[${post.seoKeywords.map((k) => `'${k}'`).join(', ')}]`
  
  return `INSERT INTO blog_posts (slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords)
VALUES (
  '${post.slug}',
  '${post.title}',
  '${post.description}',
  '${post.h1}',
  '${post.content}',
  '${post.publishedAt}',
  true,
  ${relatedPostsArray},
  ${seoKeywordsArray}
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  h1 = EXCLUDED.h1,
  content = EXCLUDED.content,
  published_at = EXCLUDED.published_at,
  is_published = EXCLUDED.is_published,
  related_posts = EXCLUDED.related_posts,
  seo_keywords = EXCLUDED.seo_keywords,
  updated_at = NOW();`
})

const sqlContent = `-- 批量导入博客文章
-- 从 app/blog/[slug]/page.tsx 提取的所有文章

${sqlStatements.join('\n\n')}
`

// 写入SQL文件
const outputPath = path.join(__dirname, '../IMPORT_BLOG_POSTS.sql')
fs.writeFileSync(outputPath, sqlContent, 'utf8')

console.log(`✅ 成功提取 ${posts.length} 篇文章`)
console.log(`✅ SQL文件已生成: ${outputPath}`)
console.log(`\n文章列表:`)
posts.forEach((post, index) => {
  console.log(`${index + 1}. ${post.slug} - ${post.title}`)
})

