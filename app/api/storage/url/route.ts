import { createClient } from '@/lib/supabase/server'
import { getPublicUrl, getPresignedUrl } from '@/lib/r2/client'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const getUrlSchema = z.object({
  key: z.string().min(1, 'File key is required'),
  presigned: z.boolean().optional().default(false),
  expiresIn: z.number().optional().default(3600), // 1 hour
})

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
    const parsedParams = getUrlSchema.safeParse({
      key: searchParams.get('key') ?? '',
      presigned: searchParams.get('presigned') === 'true',
      expiresIn: searchParams.get('expiresIn')
        ? Number(searchParams.get('expiresIn'))
        : undefined,
    })

    if (!parsedParams.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: parsedParams.error.flatten() },
        { status: 400 }
      )
    }

    const { key, presigned, expiresIn } = parsedParams.data

    // Get public URL or presigned URL
    if (presigned) {
      try {
        const url = await getPresignedUrl(key, expiresIn)
        return NextResponse.json({
          success: true,
          url,
          key,
          expiresIn,
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'Failed to generate presigned URL. R2 credentials may not be configured.', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        )
      }
    } else {
      const url = getPublicUrl(key)
      return NextResponse.json({
        success: true,
        url,
        key,
      })
    }
  } catch (error) {
    console.error('Failed to get file URL:', error)
    return NextResponse.json(
      { error: 'Failed to get file URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

