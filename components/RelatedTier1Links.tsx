import Link from 'next/link'
import { getBaseUrl } from '@/lib/utils/url'

interface RelatedLink {
  bucket: string
  weight: number
  path: string
  title: string
  industry?: string | null
}

interface RelatedTier1LinksProps {
  pageId?: string
  slug?: string
}

/**
 * Tier1 相关内链组件
 * 
 * 显示"随机但可控"的相关链接（每周轮换）
 */
export async function RelatedTier1Links({ pageId, slug }: RelatedTier1LinksProps) {
  const baseUrl = getBaseUrl()
  
  // 构建查询参数
  const params = new URLSearchParams()
  if (pageId) params.set('pageId', pageId)
  if (slug) params.set('slug', slug)

  if (!pageId && !slug) {
    return null
  }

  try {
    // 使用 revalidate 而不是 no-store，允许静态生成
    // 每周轮换数据，所以设置 1 小时 revalidate 足够（数据每周才变化一次）
    const res = await fetch(`${baseUrl}/api/related-links?${params.toString()}`, {
      next: { revalidate: 3600 }, // 1 小时重新验证
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    const items: RelatedLink[] = data?.items || []

    if (items.length === 0) {
      return null
    }

    // 按 bucket 分组显示
    const byBucket = {
      same_industry: items.filter((x) => x.bucket === 'same_industry'),
      same_scene: items.filter((x) => x.bucket === 'same_scene'),
      same_platform: items.filter((x) => x.bucket === 'same_platform'),
      explore: items.filter((x) => x.bucket === 'explore'),
    }

    return (
      <section className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Related Use Cases</h2>
        <div className="mt-4 space-y-4">
          {byBucket.same_industry.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/70">Same Industry</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {byBucket.same_industry.map((item) => (
                  <li key={item.path} className="text-sm">
                    <Link
                      href={item.path}
                      className="underline underline-offset-4 hover:text-white/80"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {byBucket.same_scene.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/70">Similar Scenarios</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {byBucket.same_scene.map((item) => (
                  <li key={item.path} className="text-sm">
                    <Link
                      href={item.path}
                      className="underline underline-offset-4 hover:text-white/80"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {byBucket.same_platform.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/70">Platform Features</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {byBucket.same_platform.map((item) => (
                  <li key={item.path} className="text-sm">
                    <Link
                      href={item.path}
                      className="underline underline-offset-4 hover:text-white/80"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {byBucket.explore.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-white/70">Explore More</h3>
              <ul className="mt-2 grid gap-2 md:grid-cols-2">
                {byBucket.explore.map((item) => (
                  <li key={item.path} className="text-sm">
                    <Link
                      href={item.path}
                      className="underline underline-offset-4 hover:text-white/80"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    )
  } catch (error) {
    console.error('[RelatedTier1Links] Error:', error)
    return null
  }
}
