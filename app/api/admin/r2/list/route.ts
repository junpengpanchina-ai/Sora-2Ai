import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession } from '@/lib/admin-auth'
import { listR2Files } from '@/lib/r2/client'

export const revalidate = 0

// GET - 获取R2文件列表（管理员专用）
export async function GET(request: NextRequest) {
  try {
    const adminUser = await validateAdminSession()
    if (!adminUser) {
      return NextResponse.json(
        { error: '未授权，请先登录' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const prefix = searchParams.get('prefix') || undefined
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100', 10)
    const fileType = searchParams.get('type') || 'all' // 'image', 'video', 'all'

    // 检查环境变量配置
    const hasR2Config = process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
    if (!hasR2Config) {
      console.error('R2配置检查:', {
        hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
        accountId: process.env.R2_ACCOUNT_ID,
        bucket: process.env.R2_BUCKET_NAME,
      })
      return NextResponse.json(
        { 
          success: false,
          error: 'R2凭证未配置', 
          details: '请检查环境变量: R2_ACCESS_KEY_ID 和 R2_SECRET_ACCESS_KEY 是否已设置',
          config: {
            hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
            hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
            accountId: process.env.R2_ACCOUNT_ID || '未设置',
            bucket: process.env.R2_BUCKET_NAME || '未设置',
          }
        },
        { status: 500 }
      )
    }

    try {
      const result = await listR2Files(prefix, maxKeys)
      
      // 根据文件类型过滤
      let filteredFiles = result.files
      if (fileType === 'image') {
        filteredFiles = result.files.filter(file => 
          file.key && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.key)
        )
      } else if (fileType === 'video') {
        filteredFiles = result.files.filter(file => 
          file.key && /\.(mp4|webm|mov|avi|mkv)$/i.test(file.key)
        )
      }

      console.log(`成功获取${fileType}文件列表:`, {
        total: result.files.length,
        filtered: filteredFiles.length,
        prefix: prefix || '无',
      })

      return NextResponse.json({
        success: true,
        files: filteredFiles,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      })
    } catch (error) {
      console.error('获取R2文件列表失败:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        prefix,
        fileType,
        maxKeys,
      })
      
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      const isConfigError = errorMessage.includes('not configured') || errorMessage.includes('凭证')
      
      return NextResponse.json(
        { 
          success: false,
          error: isConfigError ? 'R2配置错误' : '获取文件列表失败', 
          details: errorMessage,
          troubleshooting: isConfigError ? {
            step1: '检查环境变量 R2_ACCESS_KEY_ID 是否已设置',
            step2: '检查环境变量 R2_SECRET_ACCESS_KEY 是否已设置（注意：这应该是密钥，不是URL）',
            step3: '检查环境变量 R2_ACCOUNT_ID 是否正确',
            step4: '检查环境变量 R2_BUCKET_NAME 是否正确',
            step5: '在Vercel中确保环境变量已正确配置并重新部署',
          } : undefined,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('获取R2文件列表异常:', error)
    return NextResponse.json(
      { error: '服务器错误', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

