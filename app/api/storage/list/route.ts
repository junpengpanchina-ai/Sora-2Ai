import { createClient } from '@/lib/supabase/server'
import { listR2Files, getPublicUrl } from '@/lib/r2/client'
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
    const prefix = searchParams.get('prefix') || undefined
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100')
    const key = searchParams.get('key') // Get single file URL

    // If key is provided, return single file URL
    if (key) {
      return NextResponse.json({
        success: true,
        url: getPublicUrl(key),
        key,
      })
    }

    // List files from R2 (requires authentication)
    try {
      const result = await listR2Files(prefix, maxKeys)
      return NextResponse.json({
        success: true,
        files: result.files,
        isTruncated: result.isTruncated,
        nextContinuationToken: result.nextContinuationToken,
      })
    } catch (error) {
      // If listing fails (no auth), return error
      return NextResponse.json(
        { error: 'Failed to list files. R2 credentials may not be configured.', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Failed to access R2:', error)
    return NextResponse.json(
      { error: 'Failed to access R2', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

