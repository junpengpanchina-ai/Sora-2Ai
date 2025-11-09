import { createClient } from '@/lib/supabase/server'
import { listR2Files, getPublicUrl, checkFileExists } from '@/lib/r2/client'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized, please login first' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'list' // list, check, or image
    const prefix = searchParams.get('prefix') || undefined
    const key = searchParams.get('key') || undefined

    // Test action: list files
    if (action === 'list') {
      try {
        const result = await listR2Files(prefix, 20)
        return NextResponse.json({
          success: true,
          action: 'list',
          files: result.files,
          count: result.files.length,
          isTruncated: result.isTruncated,
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          action: 'list',
          error: 'Failed to list files. R2 credentials may not be configured.',
          details: error instanceof Error ? error.message : 'Unknown error',
          // Return public URL format for reference
          publicUrlFormat: `${getPublicUrl('example.jpg')}`,
        }, { status: 500 })
      }
    }

    // Test action: check file exists
    if (action === 'check' && key) {
      try {
        const exists = await checkFileExists(key)
        return NextResponse.json({
          success: true,
          action: 'check',
          key,
          exists,
          url: exists ? getPublicUrl(key) : null,
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          action: 'check',
          error: 'Failed to check file',
          details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 })
      }
    }

    // Test action: get image URL
    if (action === 'image' && key) {
      const url = getPublicUrl(key)
      const exists = await checkFileExists(key)
      
      return NextResponse.json({
        success: true,
        action: 'image',
        key,
        url,
        exists,
        message: exists 
          ? 'File exists and URL is ready to use' 
          : 'File may not exist, but URL format is correct',
      })
    }

    // Default: return test info
    return NextResponse.json({
      success: true,
      message: 'R2 Storage Test API',
      availableActions: ['list', 'check', 'image'],
      publicUrl: getPublicUrl('test.jpg'),
      usage: {
        list: '/api/storage/test?action=list&prefix=images/',
        check: '/api/storage/test?action=check&key=images/test.jpg',
        image: '/api/storage/test?action=image&key=images/test.jpg',
      },
    })
  } catch (error) {
    console.error('R2 test error:', error)
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

