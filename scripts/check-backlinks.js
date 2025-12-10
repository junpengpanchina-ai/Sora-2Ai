#!/usr/bin/env node

/**
 * 外链检查脚本
 * 帮助检查网站的外链情况
 * 
 * 使用方法:
 *   node scripts/check-backlinks.js [domain]
 *   
 * 示例:
 *   node scripts/check-backlinks.js sora2aivideos.com
 */

const domain = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'sora2aivideos.com'

console.log('\n🔍 外链检查工具\n')
console.log(`检查域名: ${domain}\n`)
console.log('=' .repeat(60))

// 检查 Google Search Console 数据
console.log('\n📊 检查方法\n')
console.log('由于外链数据需要通过 Google Search Console 或第三方工具获取，')
console.log('本脚本将指导你如何手动检查。\n')

console.log('方法 1: Google Search Console（最准确）')
console.log('─'.repeat(60))
console.log('1. 访问: https://search.google.com/search-console')
console.log('2. 选择你的网站属性')
console.log('3. 进入 "链接" > "外部链接"')
console.log('4. 查看以下数据:')
console.log('   - 外部链接总数: _____')
console.log('   - 引用域名数: _____')
console.log('   - 最常链接的页面: _____\n')

console.log('方法 2: Google 搜索命令')
console.log('─'.repeat(60))
console.log('在 Google 搜索框中输入以下命令并查看结果数量:\n')
console.log(`  1. link:${domain}`)
console.log(`     结果数: _____ (这显示指向你网站的所有链接)\n`)
console.log(`  2. "${domain}"`)
console.log(`     结果数: _____ (这显示包含你域名引用的页面)\n`)
console.log(`  3. site:${domain}`)
console.log(`     结果数: _____ (这显示你网站被索引的页面数)\n`)

console.log('方法 3: 第三方工具（免费/试用）')
console.log('─'.repeat(60))
console.log('1. Ahrefs Backlink Checker:')
console.log(`   https://ahrefs.com/backlink-checker?input=${domain}&mode=subdomains\n`)
console.log('2. SEMrush Backlink Analytics:')
console.log(`   https://www.semrush.com/analytics/backlinks/overview/?q=${domain}\n`)
console.log('3. Moz Link Explorer:')
console.log(`   https://moz.com/link-explorer?site=${domain}\n`)

console.log('方法 4: 检查抓取统计')
console.log('─'.repeat(60))
console.log('在 Google Search Console 中:')
console.log('1. 点击 "设置" > "抓取统计信息"')
console.log('2. 查看以下数据:')
console.log('   - 每天抓取的网页数: _____')
console.log('   - 每天下载的千字节数: _____')
console.log('   - 下载网页所需的时间: _____ 秒\n')

console.log('=' .repeat(60))
console.log('\n📝 评估标准\n')
console.log('外链数量判断:')
console.log('  ✅ 充足: 外部链接 > 50 且 引用域名 > 20')
console.log('  ⚠️  一般: 外部链接 20-50 或 引用域名 10-20')
console.log('  ❌ 不足: 外部链接 < 20 或 引用域名 < 10\n')

console.log('抓取频率判断:')
console.log('  ✅ 充足: 每天抓取 > 100页，时间 < 1秒')
console.log('  ⚠️  一般: 每天抓取 10-100页')
console.log('  ❌ 不足: 每天抓取 < 10页 或 时间 > 3秒\n')

console.log('='.repeat(60))
console.log('\n💡 提示')
console.log('如果你有 Google Search Console API 访问权限，')
console.log('可以集成 API 来自动获取这些数据。\n')
console.log('需要帮助配置自动检查吗？可以查看:')
console.log('  - EXTERNAL_LINKS_MONITORING_GUIDE.md')
console.log('  - QUICK_EXTERNAL_LINKS_CHECK.md\n')

