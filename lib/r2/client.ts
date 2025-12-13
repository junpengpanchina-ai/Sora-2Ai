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
  // 清理密钥（移除可能的空格、换行等）
  const cleanAccessKey = R2_ACCESS_KEY_ID.trim()
  let cleanSecretKey = R2_SECRET_ACCESS_KEY.trim()
  
  // Cloudflare R2 Secret Access Key 格式处理
  // 如果提供的是64字符的十六进制，需要转换为Base64格式
  // AWS SDK 期望 Secret Access Key 是 Base64 编码的字符串（通常是32-44字符）
  const originalSecretLength = cleanSecretKey.length
  
  if (originalSecretLength === 64) {
    // 64字符十六进制 = 32字节
    // 尝试将十六进制转换为Base64
    try {
      // 验证是否为有效的十六进制字符串
      if (/^[0-9a-fA-F]{64}$/.test(cleanSecretKey)) {
        // 将十六进制字符串转换为Buffer（32字节）
        const hexBuffer = Buffer.from(cleanSecretKey, 'hex')
        // 转换为Base64（32字节 -> 44字符，包含填充）
        // 去掉Base64填充，得到43字符（某些情况下可能需要）
        cleanSecretKey = hexBuffer.toString('base64').replace(/=+$/, '')
        console.log(`已将64字符十六进制Secret Access Key转换为Base64格式（${cleanSecretKey.length}字符）`)
      } else {
        console.warn('Secret Access Key不是有效的64字符十六进制格式，使用原始值')
      }
    } catch (error) {
      console.warn('无法转换Secret Access Key格式，使用原始值:', error)
    }
  }
  
  // 记录转换信息用于调试
  if (originalSecretLength === 64 && cleanSecretKey.length !== 64) {
    console.log('R2 Secret Access Key转换信息:', {
      原始长度: originalSecretLength,
      原始格式: '64字符十六进制',
      转换后长度: cleanSecretKey.length,
      转换后格式: 'Base64',
      转换后前10字符: cleanSecretKey.substring(0, 10) + '...',
    })
  }
  
  try {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: R2_S3_ENDPOINT,
      credentials: {
        accessKeyId: cleanAccessKey,
        secretAccessKey: cleanSecretKey,
      },
    })
    console.log('R2客户端创建成功')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = {
      error: errorMessage,
      accessKeyLength: cleanAccessKey.length,
      secretKeyLength: cleanSecretKey.length,
      originalSecretLength: originalSecretLength,
      accessKeyPreview: cleanAccessKey.substring(0, 10) + '...',
      secretKeyPreview: cleanSecretKey.substring(0, 10) + '...',
      wasConverted: originalSecretLength === 64 && cleanSecretKey.length !== 64,
    }
    
    console.error('创建 R2 客户端失败 - 详细信息:', errorDetails)
    
    // 如果是长度错误，提供更明确的提示和解决方案
    if (errorMessage.includes('length') && errorMessage.includes('32')) {
      // 尝试使用原始64字符的前32字符（作为最后的尝试）
      if (originalSecretLength === 64 && cleanSecretKey.length === 43) {
        console.warn('Base64转换后长度为43，尝试使用原始十六进制的前32字符...')
        const fallbackSecret = R2_SECRET_ACCESS_KEY.trim().substring(0, 32)
        try {
          const fallbackClient = new S3Client({
            region: 'auto',
            endpoint: R2_S3_ENDPOINT,
            credentials: {
              accessKeyId: cleanAccessKey,
              secretAccessKey: fallbackSecret,
            },
          })
          r2Client = fallbackClient
          console.log('使用前32字符成功创建R2客户端')
        } catch (fallbackError) {
          console.warn('使用前32字符也失败:', fallbackError)
          throw new Error(
            `R2密钥长度错误: Secret Access Key长度为${cleanSecretKey.length}字符（原始${originalSecretLength}字符），AWS SDK期望32字符。` +
            `代码已尝试：1) 将64字符十六进制转换为Base64(${cleanSecretKey.length}字符) 2) 使用前32字符。` +
            `所有尝试都失败。` +
            `可能原因：Cloudflare R2 Secret Access Key格式与AWS SDK不兼容。` +
            `建议：联系Cloudflare支持或查看R2文档确认正确的密钥格式。`
          )
        }
      } else {
        throw new Error(
          `R2密钥长度错误: Secret Access Key长度为${cleanSecretKey.length}字符（原始${originalSecretLength}字符），AWS SDK期望32字符。` +
          `代码已尝试将64字符十六进制转换为Base64，但仍不匹配。` +
          `建议：联系Cloudflare支持或查看R2文档确认正确的密钥格式。`
        )
      }
    }
    
    throw error
  }
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
    const configStatus = {
      hasAccountId: !!R2_ACCOUNT_ID,
      hasAccessKey: !!R2_ACCESS_KEY_ID,
      hasSecretKey: !!R2_SECRET_ACCESS_KEY,
      hasBucket: !!R2_BUCKET_NAME,
      // 检查 SECRET 是否是 URL（常见错误）
      secretLooksLikeUrl: R2_SECRET_ACCESS_KEY.startsWith('http://') || R2_SECRET_ACCESS_KEY.startsWith('https://'),
    }
    
    console.error('R2客户端未配置:', configStatus)
    
    if (configStatus.secretLooksLikeUrl) {
      throw new Error('R2_SECRET_ACCESS_KEY 配置错误：这应该是一个密钥字符串，而不是URL。请检查你的环境变量配置。')
    }
    
    throw new Error('R2客户端未配置。请设置环境变量: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, 和 R2_SECRET_ACCESS_KEY')
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

