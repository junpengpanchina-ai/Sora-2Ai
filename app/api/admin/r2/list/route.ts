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

      return NextResponse.json({
        success: true,
        files: filteredFiles,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      })
    } catch (error) {
      console.error('获取R2文件列表失败:', error)
      return NextResponse.json(
        { 
          error: '获取文件列表失败', 
          details: error instanceof Error ? error.message : 'R2凭证可能未配置' 
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

