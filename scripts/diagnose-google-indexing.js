#!/usr/bin/env node

/**
 * Google 索引诊断工具
 * 帮助诊断为什么网站无法被 Google 搜索到
 */

// 支持从命令行参数或环境变量获取域名
const domainFromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '').replace(/\/$/, '')
const domain = process.argv[2] || domainFromEnv || 'your-domain.com'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (domain !== 'your-domain.com' ? `https://${domain}` : 'https://your-domain.com')

console.log('\n🔍 Google 索引诊断工具\n')
console.log(`检查域名: ${domain}`)
console.log(`网站URL: ${siteUrl}\n`)
console.log('='.repeat(60))

console.log('\n📋 诊断检查清单\n')

// 检查 1: robots.txt
console.log('检查 1: Robots.txt 配置')
console.log('─'.repeat(60))
console.log(`✅ 检查文件: app/robots.ts`)
console.log(`✅ 预期URL: ${siteUrl}/robots.txt`)
console.log(`   访问检查: curl -I ${siteUrl}/robots.txt`)
console.log('   应该返回: HTTP 200\n')
console.log('   检查内容:')
console.log('   - 应该包含 Allow: /')
console.log('   - 应该包含 Sitemap: ...')
console.log('   - 不应该阻止根路径\n')

// 检查 2: Sitemap
console.log('检查 2: Sitemap 可访问性')
console.log('─'.repeat(60))
console.log(`✅ 主sitemap: ${siteUrl}/sitemap.xml`)
console.log(`✅ 索引sitemap: ${siteUrl}/sitemap-index.xml`)
console.log(`✅ 长尾词sitemap: ${siteUrl}/sitemap-long-tail.xml\n`)
console.log('   访问检查:')
console.log(`   curl -I ${siteUrl}/sitemap.xml`)
console.log('   应该返回: HTTP 200, Content-Type: application/xml\n')

// 检查 3: 页面可访问性
console.log('检查 3: 主页可访问性')
console.log('─'.repeat(60))
console.log(`✅ 主页URL: ${siteUrl}/`)
console.log(`   访问检查: curl -I ${siteUrl}/`)
console.log('   应该返回: HTTP 200\n')

// 检查 4: Meta 标签
console.log('检查 4: Meta 标签检查')
console.log('─'.repeat(60))
console.log('✅ 检查 app/layout.tsx')
console.log('   确保 metadata 中:')
console.log('   - 没有 robots: "noindex"')
console.log('   - 有正确的 title 和 description\n')

// 检查 5: Google Search Console
console.log('检查 5: Google Search Console 配置')
console.log('─'.repeat(60))
console.log('❓ 手动检查（最重要）:')
console.log('   1. 访问: https://search.google.com/search-console')
console.log('   2. 是否已添加网站?')
console.log('   3. 是否已验证所有权?')
console.log('   4. 是否已提交 sitemap.xml?')
console.log('   5. 是否已请求索引主页?\n')

// 检查 6: 索引状态
console.log('检查 6: 索引状态检查')
console.log('─'.repeat(60))
console.log('在 Google 搜索框中测试:')
console.log(`   1. site:${domain}`)
console.log('      结果数: _____ (如果 > 0 说明已被索引)\n')
console.log(`   2. "${domain}"`)
console.log('      结果数: _____ (包含你域名的页面)\n')
console.log(`   3. link:${domain}`)
console.log('      结果数: _____ (指向你网站的外链)\n')

// 检查 7: 环境变量
console.log('检查 7: 环境变量配置')
console.log('─'.repeat(60))
const siteUrlEnv = process.env.NEXT_PUBLIC_SITE_URL
if (siteUrlEnv) {
  console.log(`✅ NEXT_PUBLIC_SITE_URL: ${siteUrlEnv}`)
  if (!siteUrlEnv.startsWith('http')) {
    console.log('   ⚠️  警告: URL应该包含协议 (http:// 或 https://)')
  }
} else {
  console.log('❌ NEXT_PUBLIC_SITE_URL 未设置')
  console.log('   需要在生产环境设置此环境变量')
}
console.log()

// 总结
console.log('='.repeat(60))
console.log('\n🎯 立即行动建议\n')
console.log('优先级 1 (今天必须完成):')
console.log('   1. ✅ 提交网站到 Google Search Console')
console.log('   2. ✅ 验证网站所有权')
console.log('   3. ✅ 提交 sitemap.xml')
console.log('   4. ✅ 手动请求索引主页\n')

console.log('优先级 2 (今天内完成):')
console.log('   1. ✅ 检查 robots.txt 可以访问')
console.log('   2. ✅ 检查 sitemap.xml 可以访问')
console.log('   3. ✅ 确认页面没有 noindex 标签\n')

console.log('优先级 3 (本周内完成):')
console.log('   1. ✅ 建立外链')
console.log('   2. ✅ 创建高质量内容')
console.log('   3. ✅ 定期监控索引状态\n')

console.log('='.repeat(60))
console.log('\n📖 详细修复指南')
console.log('查看: FIX_GOOGLE_INDEXING.md\n')

console.log('⏱️  预期时间线')
console.log('   - 提交后 1-2 小时: Google 开始抓取')
console.log('   - 提交后 1-7 天: 主页出现在搜索结果')
console.log('   - 提交后 1-2 周: 稳定索引\n')

