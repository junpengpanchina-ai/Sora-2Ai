import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// R2 配置
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '2776117bb412e09a1d30cbe886cd3935'
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sora2'
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-2868c824f92441499577980a0b61114c.r2.dev'
const R2_S3_ENDPOINT = process.env.R2_S3_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

// 创建 S3 客户端（R2 兼容 S3 API）
// 如果不需要认证访问，可以只使用公共 URL
let r2Client: S3Client | null = null

if (R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: R2_S3_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
}

/**
 * 获取文件的公共 URL
 * 如果 R2 存储桶是公共的，可以直接使用此 URL
 * 
 * @param key - 文件路径，例如 'images/hero.jpg' 或 'videos/demo.mp4'
 * @returns 完整的公共 URL
 * 
 * @example
 * ```tsx
 * import { getPublicUrl } from '@/lib/r2/client'
 * 
 * const imageUrl = getPublicUrl('images/hero.jpg')
 * // 结果: https://pub-2868c824f92441499577980a0b61114c.r2.dev/images/hero.jpg
 * 
 * <img src={imageUrl} alt="Hero" />
 * ```
 */
export function getPublicUrl(key: string): string {
  // 移除 key 开头的斜杠（如果有）
  const cleanKey = key.startsWith('/') ? key.slice(1) : key
  return `${R2_PUBLIC_URL}/${cleanKey}`
}

/**
 * 获取文件列表（需要认证）
 */
interface R2FileInfo {
  key: string | undefined
  size: number | undefined
  lastModified: Date | undefined
  url: string | null
}

interface R2FileListResult {
  files: R2FileInfo[]
  isTruncated?: boolean
  nextContinuationToken?: string
}

export async function listR2Files(prefix?: string, maxKeys: number = 100): Promise<R2FileListResult> {
  if (!r2Client) {
    throw new Error('R2 client not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY')
  }

  try {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })

    const response = await r2Client.send(command)

    return {
      files: response.Contents?.map((item) => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: item.Key ? getPublicUrl(item.Key) : null,
      })) || [],
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    }
  } catch (error) {
    console.error('Failed to list R2 files:', error)
    throw new Error(`Failed to list files: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 生成预签名 URL（用于临时访问私有文件）
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> {
  if (!r2Client) {
    throw new Error('R2 client not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY')
  }

  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    return await getSignedUrl(r2Client, command, { expiresIn })
  } catch (error) {
    console.error('Failed to generate presigned URL:', error)
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * 检查文件是否存在（需要认证）
 */
export async function checkFileExists(key: string): Promise<boolean> {
  if (!r2Client) {
    // 如果没有配置客户端，尝试通过公共 URL 检查
    try {
      const response = await fetch(getPublicUrl(key), { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  try {
    const { HeadObjectCommand } = await import('@aws-sdk/client-s3')
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
    return true
  } catch (error: unknown) {
    const awsError = error as { name?: string; $metadata?: { httpStatusCode?: number } }
    if (awsError?.name === 'NotFound' || awsError?.$metadata?.httpStatusCode === 404) {
      return false
    }
    throw error instanceof Error ? error : new Error('Unknown error while checking file existence')
  }
}

