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

/**
 * 转换Cloudflare R2 Secret Access Key格式
 * 将64字符十六进制转换为AWS SDK期望的格式
 */
function convertSecretAccessKey(secret: string): string {
  const trimmed = secret.trim()
  
  // 如果是64字符的十六进制，尝试转换
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/i.test(trimmed)) {
    try {
      // 方法1: 转换为Base64
      const hexBuffer = Buffer.from(trimmed, 'hex')
      const base64Secret = hexBuffer.toString('base64').replace(/=+$/, '')
      console.log(`[R2] 已将64字符十六进制转换为Base64: ${base64Secret.length}字符`)
      return base64Secret
    } catch (error) {
      console.warn('[R2] Base64转换失败，尝试其他方法:', error)
    }
    
    // 方法2: 如果Base64失败，尝试使用前32字符
    console.warn('[R2] 尝试使用前32字符作为fallback')
    return trimmed.substring(0, 32)
  }
  
  // 如果已经是其他格式，直接返回
  return trimmed
}

/**
 * 初始化R2客户端
 */
function initializeR2Client(): void {
  if (r2Client) return // 已经初始化
  
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn('[R2] Access Key ID 或 Secret Access Key 未配置')
    return
  }
  
  const cleanAccessKey = R2_ACCESS_KEY_ID.trim()
  const originalSecret = R2_SECRET_ACCESS_KEY.trim()
  
  // 转换Secret Access Key
  const convertedSecret = convertSecretAccessKey(originalSecret)
  
  console.log('[R2] 初始化客户端:', {
    accessKeyLength: cleanAccessKey.length,
    originalSecretLength: originalSecret.length,
    convertedSecretLength: convertedSecret.length,
    wasConverted: originalSecret.length === 64 && convertedSecret.length !== 64,
  })
  
  // 尝试创建客户端，如果失败则尝试fallback
  const attempts = [
    { secret: convertedSecret, name: '转换后的密钥' },
    { secret: originalSecret.substring(0, 32), name: '前32字符' },
  ]
  
  for (const attempt of attempts) {
    try {
      r2Client = new S3Client({
        region: 'auto',
        endpoint: R2_S3_ENDPOINT,
        credentials: {
          accessKeyId: cleanAccessKey,
          secretAccessKey: attempt.secret,
        },
      })
      console.log(`[R2] 客户端创建成功 (使用${attempt.name})`)
      return
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`[R2] 使用${attempt.name}失败:`, errorMessage)
      
      // 如果是长度错误且还有其他尝试，继续
      if (errorMessage.includes('length') && attempt !== attempts[attempts.length - 1]) {
        continue
      }
      
      // 最后一次尝试失败，抛出错误
      if (attempt === attempts[attempts.length - 1]) {
        throw new Error(
          `R2客户端创建失败: ${errorMessage}\n` +
          `已尝试: 1) 64字符十六进制转Base64 2) 使用前32字符\n` +
          `Access Key长度: ${cleanAccessKey.length}, Secret长度: ${attempt.secret.length}\n` +
          `建议: 检查Cloudflare R2 API Token格式，或联系Cloudflare支持`
        )
      }
    }
  }
}

// 立即尝试初始化
try {
  initializeR2Client()
} catch (error) {
  console.error('[R2] 初始化失败:', error)
  // 不抛出，允许延迟初始化
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
  // 如果客户端未初始化，尝试初始化
  if (!r2Client) {
    try {
      initializeR2Client()
    } catch (error) {
      console.error('[R2] 延迟初始化失败:', error)
      const configStatus = {
        hasAccountId: !!R2_ACCOUNT_ID,
        hasAccessKey: !!R2_ACCESS_KEY_ID,
        hasSecretKey: !!R2_SECRET_ACCESS_KEY,
        hasBucket: !!R2_BUCKET_NAME,
        secretLooksLikeUrl: R2_SECRET_ACCESS_KEY && (R2_SECRET_ACCESS_KEY.startsWith('http://') || R2_SECRET_ACCESS_KEY.startsWith('https://')),
      }
      
      if (configStatus.secretLooksLikeUrl) {
        throw new Error('R2_SECRET_ACCESS_KEY 配置错误：这应该是一个密钥字符串，而不是URL。请检查你的环境变量配置。')
      }
      
      throw new Error('R2客户端未配置。请设置环境变量: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, 和 R2_SECRET_ACCESS_KEY')
    }
  }
  
  if (!r2Client) {
    throw new Error('R2客户端初始化失败。请检查环境变量配置和密钥格式。')
  }

  try {
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3')
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: maxKeys,
    })

    console.log('正在列出R2文件:', {
      bucket: R2_BUCKET_NAME,
      prefix: prefix || '根目录',
      maxKeys,
      endpoint: R2_S3_ENDPOINT,
    })

    const response = await r2Client.send(command)

    const files = response.Contents?.map((item) => ({
      key: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      url: item.Key ? getPublicUrl(item.Key) : null,
    })) || []

    console.log(`成功获取 ${files.length} 个文件`)

    return {
      files,
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
    }
  } catch (error) {
    console.error('列出R2文件失败:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      bucket: R2_BUCKET_NAME,
      prefix: prefix || '根目录',
      endpoint: R2_S3_ENDPOINT,
    })
    
    // 提供更详细的错误信息
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (errorMessage.includes('InvalidAccessKeyId') || errorMessage.includes('SignatureDoesNotMatch')) {
      throw new Error('R2凭证无效。请检查 R2_ACCESS_KEY_ID 和 R2_SECRET_ACCESS_KEY 是否正确。注意：R2_SECRET_ACCESS_KEY 应该是密钥字符串，不是URL。')
    }
    if (errorMessage.includes('NoSuchBucket')) {
      throw new Error(`R2存储桶不存在: ${R2_BUCKET_NAME}。请检查 R2_BUCKET_NAME 环境变量。`)
    }
    
    throw new Error(`列出文件失败: ${errorMessage}`)
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

