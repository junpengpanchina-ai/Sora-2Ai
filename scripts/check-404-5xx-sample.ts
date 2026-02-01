/**
 * 抽样检查 sitemap URL 的 404/5xx
 * 用法: npx tsx scripts/check-404-5xx-sample.ts
 */
const BASE = 'https://sora2aivideos.com'

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function extractUrls(xml: string): string[] {
  const urls: string[] = []
  const re = /<loc>([^<]+)<\/loc>/g
  let m
  while ((m = re.exec(xml)) !== null) urls.push(m[1].trim())
  return urls
}

async function checkStatus(url: string): Promise<{ status: number; finalUrl: string }> {
  const res = await fetch(url, {
    method: 'HEAD',
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Check404/1.0)' },
  })
  return { status: res.status, finalUrl: res.url }
}

async function main() {
  console.log('🔍 抽样检查 sitemap URL 的 404/5xx\n')

  const sitemaps = [
    '/sitemaps/tier1-0.xml',
    '/sitemap-long-tail.xml?page=1',
    '/sitemap-use-cases.xml',
    '/sitemap-static.xml',
  ]

  const allUrls: string[] = []

  for (const path of sitemaps) {
    try {
      const xml = await fetchXml(BASE + path)
      const urls = extractUrls(xml)
      // 每个 sitemap 抽样最多 30 条
      const sample = urls.sort(() => Math.random() - 0.5).slice(0, 30)
      allUrls.push(...sample)
      console.log(`✓ ${path}: ${urls.length} URLs, 抽样 ${sample.length}`)
    } catch (e) {
      console.log(`✗ ${path}: ${e instanceof Error ? e.message : e}`)
    }
  }

  const toCheck = [...new Set(allUrls)].slice(0, 100)
  console.log(`\n检查 ${toCheck.length} 条 URL...\n`)

  const results: Array<{ url: string; status: number; ok: boolean }> = []

  for (let i = 0; i < toCheck.length; i++) {
    const url = toCheck[i]
    try {
      const { status } = await checkStatus(url)
      const ok = status >= 200 && status < 400
      results.push({ url, status, ok })
      if (!ok) console.log(`  ❌ ${status} ${url}`)
      if ((i + 1) % 20 === 0) process.stdout.write(`  已检查 ${i + 1}/${toCheck.length}\r`)
    } catch (e) {
      results.push({ url, status: 0, ok: false })
      console.log(`  ❌ ERROR ${url}`)
    }
  }

  const bad = results.filter((r) => !r.ok)
  const byStatus = results.reduce((a, r) => {
    const k = r.status || 'ERR'
    a[k] = (a[k] || 0) + 1
    return a
  }, {} as Record<number | string, number>)

  console.log('\n\n📊 结果汇总')
  console.log('─'.repeat(40))
  console.log(`总检查: ${results.length}`)
  console.log(`正常 (2xx/3xx): ${results.filter((r) => r.ok).length}`)
  console.log(`异常: ${bad.length}`)
  console.log('\n状态码分布:', JSON.stringify(byStatus, null, 2))

  if (bad.length > 0) {
    console.log('\n❌ 异常 URL:')
    bad.forEach((r) => console.log(`  ${r.status} ${r.url}`))
  } else {
    console.log('\n✅ 抽样 URL 无 404/5xx')
  }
}

main().catch(console.error)
