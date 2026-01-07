/**
 * A/B 测试分桶逻辑
 * 提供稳定的用户分桶，确保同一用户始终看到相同变体
 */

export type Variant = 'A' | 'B'

/**
 * 获取稳定的分桶 ID
 * 优先使用用户 ID，如果没有则使用匿名 ID（存储在 localStorage）
 */
export function getStableBucketingId(userId?: string): string {
  if (userId) {
    return `uid:${userId}`
  }
  
  if (typeof window === 'undefined') {
    return 'anon:ssr'
  }
  
  const key = 'ab_anon_id_v1'
  let v = localStorage.getItem(key)
  
  if (!v) {
    // 生成匿名 ID
    v = `anon:${crypto.randomUUID()}`
    localStorage.setItem(key, v)
  }
  
  return v
}

/**
 * 确定性哈希 -> A/B 变体分配
 * 使用 FNV-1a 哈希算法确保稳定分配
 */
export function assignVariant(bucketId: string, experimentKey: string): Variant {
  const s = `${experimentKey}:${bucketId}`
  let h = 2166136261 // FNV offset basis
  
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619) // FNV prime
  }
  
  // 转换为正数并取模
  return (h >>> 0) % 2 === 0 ? 'A' : 'B'
}

/**
 * 获取实验变体（便捷函数）
 */
export function getExperimentVariant(userId: string | undefined, experimentKey: string): Variant {
  const bucketId = getStableBucketingId(userId)
  return assignVariant(bucketId, experimentKey)
}

