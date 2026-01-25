import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
 * AWS SDK expects a 32-char secret key for some providers.
 * If a 64-char hex secret is supplied, we use the first 32 chars.
 */
function getValidSecretAccessKey(secret: string): string {
  const trimmed = secret.trim()

  if (trimmed.length === 64 && /^[0-9a-fA-F]{64}$/i.test(trimmed)) {
    return trimmed.substring(0, 32)
  }

  if (trimmed.length > 32) {
    return trimmed.substring(0, 32)
  }

  return trimmed
}

// POST - Upload an image to R2 (requires user login)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 })
    }

    const config = getR2Config()
    if (!config.R2_ACCESS_KEY_ID || !config.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'Storage is not configured (R2 credentials missing).' },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = (formData.get('folder') as string | null) || 'reference-images'

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const fileType = file.type
    const isImage = fileType.startsWith('image/')
    if (!isImage) {
      return NextResponse.json(
        { error: 'Unsupported file type. Only images are allowed (JPG, JPEG, PNG, WEBP).' },
        { status: 400 },
      )
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 10MB.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const userId = user.id.substring(0, 8)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileKey = `${folder}/${userId}_${timestamp}_${sanitizedName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const validSecretKey = getValidSecretAccessKey(config.R2_SECRET_ACCESS_KEY)

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
      message: 'Image uploaded successfully.',
    })
  } catch (error) {
    console.error('Upload image failed:', error)
    return NextResponse.json(
      { error: 'Upload failed.', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

