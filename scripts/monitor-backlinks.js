#!/usr/bin/env node

/**
 * 外链抓取监控脚本
 * 监控你的网站的外链是否被 Google 抓取和索引
 * 
 * 使用方法:
 *   node scripts/monitor-backlinks.js [domain]
 *   
 * 示例:
 *   node scripts/monitor-backlinks.js sora2aivideos.com
 */

const domain = process.argv[2] || process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, '') || 'sora2aivideos.com'

console.log('\n🔍 外链抓取监控工具\n')
console.log(`监控域名: ${domain}\n`)
console.log('='.repeat(60))

// 说明需要手动检查的工具
console.log('\n📊 监控外链抓取的方法\n')

console.log('方法 1: Google Search Console（最准确）')
console.log('─'.repeat(60))
console.log('1. 访问: https://search.google.com/search-console')
console.log('2. 选择你的网站属性')
console.log('3. 进入 "链接" > "外部链接"')
console.log('\n关键指标:')
console.log('   - 外部链接总数: 查看是否有新的外链')
console.log('   - 引用域名数: 查看是否有新的域名链接到你')
console.log('   - 顶级链接网站: 查看哪些网站给了你链接')
console.log('   - 最常链接的页面: 哪些页面获得最多外链\n')

console.log('方法 2: 抓取统计信息')
console.log('─'.repeat(60))
console.log('在 Google Search Console 中:')
console.log('1. 点击 "设置" > "抓取统计信息"')
console.log('2. 查看以下数据:\n')
console.log('   📈 每天抓取的网页数')
console.log('     - 如果 > 100: ✅ 正常')
console.log('     - 如果 10-100: ⚠️  一般')
console.log('     - 如果 < 10: ❌ 可能有问题\n')
console.log('   ⏱️  下载网页所需的时间')
console.log('     - 如果 < 1秒: ✅ 很好')
console.log('     - 如果 1-3秒: ⚠️  一般')
console.log('     - 如果 > 3秒: ❌ 可能有问题\n')

console.log('方法 3: 索引状态监控')
console.log('─'.repeat(60))
console.log('在 Google Search Console 中:')
console.log('1. 进入 "索引" > "网页"')
console.log('2. 查看:\n')
console.log('   ✅ 已编入索引: 你的页面有多少被索引')
console.log('   ❌ 未编入索引: 是否有问题导致未索引')
console.log('   📊 有效网页: 可正常索引的网页数')
console.log('   🚫 已排除: 被排除的网页数及原因\n')

console.log('方法 4: Google 搜索命令（简单快速）')
console.log('─'.repeat(60))
console.log('在 Google 搜索框中输入以下命令:\n')
console.log(`1. site:${domain}`)
console.log('   结果数 = 已索引的网页数\n')
console.log(`2. link:${domain}`)
console.log('   结果数 = Google 发现的外链数\n')
console.log(`3. "${domain}"`)
console.log('   结果数 = 包含你域名的页面数\n')

console.log('方法 5: 使用第三方工具（需要 API 或付费）')
console.log('─'.repeat(60))
console.log('1. Ahrefs:')
console.log(`   https://ahrefs.com/backlink-checker?input=${domain}\n`)
console.log('2. SEMrush:')
console.log(`   https://www.semrush.com/analytics/backlinks/overview/?q=${domain}\n`)
console.log('3. Moz:')
console.log(`   https://moz.com/link-explorer?site=${domain}\n`)

console.log('方法 6: 检查特定页面的索引状态')
console.log('─'.repeat(60))
console.log('在 Google Search Console 中:')
console.log('1. 使用顶部的 URL 检查工具')
console.log('2. 输入页面 URL')
console.log('3. 查看状态:\n')
console.log('   ✅ "可编入索引" = 可以被索引')
console.log('   ✅ "URL 在 Google 上" = 已被索引')
console.log('   ❌ "未发现" = 还未被 Google 发现')
console.log('   ❌ "已抓取但未编入索引" = 有问题，查看原因\n')

console.log('='.repeat(60))
console.log('\n📊 定期监控建议\n')

console.log('每日检查:')
console.log('  - [ ] Google Search Console 抓取统计')
console.log('  - [ ] 是否有新的外链（链接报告）\n')

console.log('每周检查:')
console.log('  - [ ] 索引状态报告')
console.log('  - [ ] 使用 Google 搜索命令检查')
console.log('  - [ ] 查看是否有抓取错误\n')

console.log('每月检查:')
console.log('  - [ ] 使用第三方工具全面分析')
console.log('  - [ ] 外链增长趋势')
console.log('  - [ ] 竞争对手对比\n')

console.log('='.repeat(60))
console.log('\n💡 提示\n')
console.log('1. Google Search Console 是官方工具，最准确')
console.log('2. 外链数据通常有延迟（几天到几周）')
console.log('3. 不是所有外链都会被 Google 立即发现')
console.log('4. 高质量外链更容易被快速发现\n')

console.log('='.repeat(60))
console.log('\n📝 记录模板\n')
console.log('检查日期: _____')
console.log('外部链接总数: _____ (上次: _____)')
console.log('引用域名数: _____ (上次: _____)')
console.log('已索引网页数: _____ (上次: _____)')
console.log('抓取统计:')
console.log('  - 每天抓取页数: _____')
console.log('  - 平均响应时间: _____ 秒')
console.log('变化: ↑ 增长 / → 稳定 / ↓ 下降\n')

