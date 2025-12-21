import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Lazy access to environment variables to avoid build-time errors
function getR2Config() {
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '2776117bb412e09a1d30cbe886cd3935'
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sora2'
  const R2_S3_ENDPOINT = process.env.R2_S3_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-2868c824f92441499577980a0b61114c.r2.dev'
  
  return {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    R2_S3_ENDPOINT,
    R2_PUBLIC_URL,
  }
}

/**
 * 获取正确的Secret Access Key（处理64字符十六进制格式）
 * AWS SDK期望32字符的密钥，对于64字符的十六进制密钥，使用前32字符
 */
function getValidSecretAccessKey(secret: string): string {
  const trimmed = secret.trim()
  
  // 如果是64字符的十六进制，使用前32字符（AWS SDK期望32字符）
  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/i.test(trimmed)) {
    return trimmed.substring(0, 32)
  }
  
  // 如果长度超过32，使用前32字符
  if (trimmed.length > 32) {
    return trimmed.substring(0, 32)
  }
  
  return trimmed
}

// POST - 上传图片到R2（需要用户登录）
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const config = getR2Config()
    if (!config.R2_ACCESS_KEY_ID || !config.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'R2凭证未配置，无法上传文件' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string | null || 'reference-images' // 默认上传到reference-images文件夹

    if (!file) {
      return NextResponse.json(
        { error: '未提供文件' },
        { status: 400 }
      )
    }

    // 验证文件类型（仅支持图片）
    const fileType = file.type
    const isImage = fileType.startsWith('image/')
    
    if (!isImage) {
      return NextResponse.json(
        { error: '不支持的文件类型，仅支持图片格式（JPG, JPEG, PNG, WEBP）' },
        { status: 400 }
      )
    }

    // 验证文件大小（限制为10MB）
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: '文件大小超过限制，最大支持10MB' },
        { status: 400 }
      )
    }

    // 生成文件路径（使用用户ID和时间戳）
    const timestamp = Date.now()
    const userId = user.id.substring(0, 8) // 使用用户ID的前8位
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileKey = `${folder}/${userId}_${timestamp}_${sanitizedName}`

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 处理Secret Access Key（64字符 → 32字符）
    const validSecretKey = getValidSecretAccessKey(config.R2_SECRET_ACCESS_KEY)
    
    // 创建S3客户端并上传
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: config.R2_S3_ENDPOINT,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID.trim(),
        secretAccessKey: validSecretKey,
      },
    })

    const command = new PutObjectCommand({
      Bucket: config.R2_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: fileType,
    })

    await s3Client.send(command)

    // 返回文件信息
    const publicUrl = `${config.R2_PUBLIC_URL}/${fileKey}`

    return NextResponse.json({
      success: true,
      file: {
        key: fileKey,
        url: publicUrl,
        size: file.size,
        type: fileType,
        name: file.name,
      },
      message: '图片上传成功',
    })
  } catch (error) {
    console.error('上传图片失败:', error)
    return NextResponse.json(
      { error: '上传图片失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

