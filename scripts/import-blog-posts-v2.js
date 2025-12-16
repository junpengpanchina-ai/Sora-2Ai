// 脚本：从代码中提取博客文章并生成SQL导入语句（改进版）
const fs = require('fs')
const path = require('path')

// 读取博客页面文件
const blogPagePath = path.join(__dirname, '../app/blog/[slug]/page.tsx')
const content = fs.readFileSync(blogPagePath, 'utf8')

// 使用更简单的方法：直接查找所有文章定义
const posts = []
const postRegex = /'([a-z0-9-]+)':\s*\{[\s\S]*?title:\s*'([^']+(?:''[^']*)*)',[\s\S]*?description:\s*'([^']+(?:''[^']*)*)',[\s\S]*?h1:\s*'([^']+(?:''[^']*)*)',[\s\S]*?publishedAt:\s*'([^']+)',[\s\S]*?content:\s*`([\s\S]*?)`,[\s\S]*?relatedPosts:\s*\[([\s\S]*?)\],/g

let match
while ((match = postRegex.exec(content)) !== null) {
  const slug = match[1]
  const title = match[2].replace(/''/g, "'")
  const description = match[3].replace(/''/g, "'")
  const h1 = match[4].replace(/''/g, "'")
  const publishedAt = match[5]
  let contentText = match[6]
    .replace(/\n\s*/g, ' ')
    .trim()
  
  // 处理content中的特殊字符 - PostgreSQL转义：' -> ''
  // 注意：模板字符串中的单引号已经是原始字符，直接转义即可
  contentText = contentText.replace(/'/g, "''")
  
  const relatedPostsText = match[7] || ''
  const relatedPosts = relatedPostsText
    .split(',')
    .map((s) => {
      const m = s.match(/'([^']+)'/)
      return m ? m[1] : null
    })
    .filter((s) => s !== null)

  // 提取SEO关键词
  const seoKeywords = []
  const titleLower = title.toLowerCase()
  const descLower = description.toLowerCase()
  if (titleLower.includes('sora') || descLower.includes('sora')) {
    seoKeywords.push('sora alternative')
  }
  if (titleLower.includes('ai video') || descLower.includes('ai video')) {
    seoKeywords.push('ai video generator')
  }
  if (titleLower.includes('text to video') || descLower.includes('text to video')) {
    seoKeywords.push('text to video ai')
  }
  if (titleLower.includes('youtube') || descLower.includes('youtube')) {
    seoKeywords.push('ai video for youtube')
  }
  if (titleLower.includes('marketing') || descLower.includes('marketing')) {
    seoKeywords.push('ai video for marketing')
  }
  if (titleLower.includes('free') || descLower.includes('free')) {
    seoKeywords.push('free ai video generator')
  }
  if (titleLower.includes('watermark') || descLower.includes('watermark')) {
    seoKeywords.push('ai video without watermark')
  }

  posts.push({
    slug,
    title,
    description,
    h1,
    content: contentText,
    publishedAt,
    relatedPosts,
    seoKeywords: seoKeywords.length > 0 ? seoKeywords : ['ai video generator'],
  })
}

if (posts.length === 0) {
  console.error('❌ 未找到任何文章')
  process.exit(1)
}

// 生成SQL
const sqlStatements = posts.map((post) => {
  const relatedPostsArray = post.relatedPosts.length > 0
    ? `ARRAY[${post.relatedPosts.map((p) => `'${p}'`).join(', ')}]`
    : `ARRAY[]::TEXT[]`
  const seoKeywordsArray = post.seoKeywords.length > 0
    ? `ARRAY[${post.seoKeywords.map((k) => `'${k.replace(/'/g, "''")}'`).join(', ')}]`
    : `ARRAY[]::TEXT[]`
  
  // 转义SQL字符串 - 处理单引号
  const escapeSql = (str) => {
    if (!str) return ''
    // 先处理已有的转义，再统一转义
    return str.replace(/''/g, "'").replace(/'/g, "''")
  }
  
  return `INSERT INTO blog_posts (slug, title, description, h1, content, published_at, is_published, related_posts, seo_keywords)
VALUES (
  '${post.slug}',
  '${escapeSql(post.title)}',
  '${escapeSql(post.description)}',
  '${escapeSql(post.h1)}',
  '${escapeSql(post.content)}',
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

const sqlContent = `-- ============================================
-- 批量导入博客文章
-- 从 app/blog/[slug]/page.tsx 提取的所有文章
-- 生成时间: ${new Date().toISOString()}
-- 文章数量: ${posts.length}
-- ============================================

${sqlStatements.join('\n\n')}
`

// 写入SQL文件
const outputPath = path.join(__dirname, '../IMPORT_BLOG_POSTS.sql')
fs.writeFileSync(outputPath, sqlContent, 'utf8')

console.log(`✅ 成功提取 ${posts.length} 篇文章`)
console.log(`✅ SQL文件已生成: ${outputPath}`)
console.log(`\n文章列表:`)
posts.forEach((post, index) => {
  console.log(`${index + 1}. ${post.slug}`)
  console.log(`   标题: ${post.title.substring(0, 60)}...`)
  console.log(`   相关文章: ${post.relatedPosts.length} 篇`)
  console.log(`   SEO关键词: ${post.seoKeywords.join(', ')}`)
  console.log('')
})

