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
 * 获取正确的Secret Access Key（处理64字符十六进制格式）
 * AWS SDK期望32字符的密钥，对于64字符的十六进制密钥，使用前32字符
 */
function getValidSecretAccessKey(secret: string): string {
  const trimmed = secret.trim()
  
  // 如果是64字符的十六进制，使用前32字符（AWS SDK期望32字符）
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/i.test(trimmed)) {
    const first32Chars = trimmed.substring(0, 32)
    console.log(`[R2] 检测到64字符十六进制密钥，使用前32字符: ${first32Chars.substring(0, 8)}...`)
    return first32Chars
  }
  
  // 如果已经是32字符或更短，直接返回
  if (trimmed.length <= 32) {
    return trimmed
  }
  
  // 如果长度超过32但不是64，使用前32字符
  if (trimmed.length > 32) {
    console.warn(`[R2] 密钥长度${trimmed.length}，使用前32字符`)
    return trimmed.substring(0, 32)
  }
  
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
  const validSecret = getValidSecretAccessKey(originalSecret)
  
  console.log('[R2] 初始化客户端:', {
    accessKeyLength: cleanAccessKey.length,
    accessKeyPreview: cleanAccessKey.substring(0, 8) + '...',
    originalSecretLength: originalSecret.length,
    originalSecretPreview: originalSecret.substring(0, 8) + '...',
    validSecretLength: validSecret.length,
    validSecretPreview: validSecret.substring(0, 8) + '...',
    accountId: R2_ACCOUNT_ID,
    bucket: R2_BUCKET_NAME,
    endpoint: R2_S3_ENDPOINT,
  })
  
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_S3_ENDPOINT,
      credentials: {
        accessKeyId: cleanAccessKey,
        secretAccessKey: validSecret,
      },
    })
    console.log('[R2] 客户端创建成功，密钥长度:', validSecret.length)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    // 详细的错误信息用于调试
    const debugInfo = {
      error: errorMessage,
      accessKeyId: cleanAccessKey.substring(0, 8) + '...',
      accessKeyLength: cleanAccessKey.length,
      originalSecretLength: originalSecret.length,
      originalSecretPreview: originalSecret.substring(0, 8) + '...',
      validSecretLength: validSecret.length,
      validSecretPreview: validSecret.substring(0, 8) + '...',
      accountId: R2_ACCOUNT_ID,
      endpoint: R2_S3_ENDPOINT,
      bucket: R2_BUCKET_NAME,
    }
    
    console.error('[R2] 客户端创建失败:', debugInfo)
    
    // 如果错误信息提到长度问题，提供更详细的说明
    if (errorMessage.includes('length')) {
      throw new Error(
        `R2客户端创建失败: ${errorMessage}\n` +
        `原始密钥长度: ${originalSecret.length}字符\n` +
        `处理后密钥长度: ${validSecret.length}字符（应该是32）\n` +
        `原始密钥预览: ${originalSecret.substring(0, 16)}...\n` +
        `处理后密钥预览: ${validSecret.substring(0, 16)}...\n` +
        `Account ID: ${R2_ACCOUNT_ID}\n` +
        `Endpoint: ${R2_S3_ENDPOINT}\n` +
        `\n如果密钥长度不是32，请检查 getValidSecretAccessKey 函数的处理逻辑`
      )
    }
    
    throw new Error(
      `R2客户端创建失败: ${errorMessage}\n` +
      `配置详情: Access Key长度=${cleanAccessKey.length}, Secret长度=${validSecret.length}\n` +
      `Account ID=${R2_ACCOUNT_ID}, Endpoint=${R2_S3_ENDPOINT}\n` +
      `建议: 检查环境变量配置，确保R2_ACCESS_KEY_ID和R2_SECRET_ACCESS_KEY正确`
    )
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
        accessKeyLength: R2_ACCESS_KEY_ID?.length || 0,
        secretKeyLength: R2_SECRET_ACCESS_KEY?.length || 0,
        secretLooksLikeUrl: R2_SECRET_ACCESS_KEY && (R2_SECRET_ACCESS_KEY.startsWith('http://') || R2_SECRET_ACCESS_KEY.startsWith('https://')),
      }
      
      if (configStatus.secretLooksLikeUrl) {
        throw new Error('R2_SECRET_ACCESS_KEY 配置错误：这应该是一个密钥字符串，而不是URL。请检查你的环境变量配置。')
      }
      
      if (!configStatus.hasAccessKey || !configStatus.hasSecretKey) {
        throw new Error('R2客户端未配置。请设置环境变量: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, 和 R2_SECRET_ACCESS_KEY')
      }
      
      // 如果配置存在但初始化失败，抛出详细错误
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`R2客户端初始化失败: ${errorMessage}`)
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

