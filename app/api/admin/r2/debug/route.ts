import { NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'

// 强制动态渲染，因为使用了 cookies
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * 调试端点：检查R2环境变量配置
 * 仅用于诊断问题，不返回敏感信息的前几个字符
 */
export async function GET() {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || ''
    const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || ''
    const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || ''
    const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ''
    const R2_S3_ENDPOINT = process.env.R2_S3_ENDPOINT || ''
    const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ''

    // 获取密钥长度信息（不返回完整值）
    const secretLength = R2_SECRET_ACCESS_KEY.length
    const secretPreview = R2_SECRET_ACCESS_KEY.substring(0, 8) + '...' + R2_SECRET_ACCESS_KEY.substring(Math.max(0, secretLength - 8))
    
    // 检查是否是64字符的十六进制
    const isHex64 = secretLength === 64 && /^[0-9a-fA-F]{64}$/i.test(R2_SECRET_ACCESS_KEY)
    const first32Chars = isHex64 ? R2_SECRET_ACCESS_KEY.substring(0, 32) : null
    const first32Preview = first32Chars ? first32Chars.substring(0, 8) + '...' : null

    return NextResponse.json({
      success: true,
      config: {
        hasAccountId: !!R2_ACCOUNT_ID,
        accountId: R2_ACCOUNT_ID,
        hasAccessKey: !!R2_ACCESS_KEY_ID,
        accessKeyLength: R2_ACCESS_KEY_ID.length,
        accessKeyPreview: R2_ACCESS_KEY_ID.substring(0, 8) + '...',
        hasSecretKey: !!R2_SECRET_ACCESS_KEY,
        secretKeyLength: secretLength,
        secretKeyPreview: secretPreview,
        isHex64: isHex64,
        first32CharsPreview: first32Preview,
        hasBucket: !!R2_BUCKET_NAME,
        bucket: R2_BUCKET_NAME,
        hasEndpoint: !!R2_S3_ENDPOINT,
        endpoint: R2_S3_ENDPOINT,
        hasPublicUrl: !!R2_PUBLIC_URL,
        publicUrl: R2_PUBLIC_URL,
      },
      analysis: {
        secretKeyExpectedLength: 64,
        secretKeyActualLength: secretLength,
        isValidFormat: isHex64,
        shouldUseFirst32: isHex64,
        message: isHex64
          ? '密钥是64字符十六进制格式，应该使用前32字符'
          : secretLength === 32
          ? '密钥已经是32字符，可以直接使用'
          : secretLength === 40
          ? '⚠️ 密钥长度是40，可能是Base64转换后的结果'
          : `密钥长度是${secretLength}，需要检查格式`,
      },
    })
  } catch (error) {
    console.error('调试信息获取失败:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '调试信息获取失败', 
        details: error instanceof Error ? error.message : '未知错误' 
      },
      { status: 500 }
    )
  }
}

