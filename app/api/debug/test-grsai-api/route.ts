// Debug API endpoint to test Grsai API connection
// This helps diagnose API connection issues
import { NextResponse } from 'next/server'
import { createSoraVideoTask } from '@/lib/grsai/client'

// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    // Check environment variables
    const hasApiKey = !!process.env.GRSAI_API_KEY
    const apiHost = process.env.GRSAI_HOST || 'https://grsai.dakka.com.cn'
    const apiKeyPrefix = process.env.GRSAI_API_KEY 
      ? process.env.GRSAI_API_KEY.substring(0, 10) + '...' 
      : 'NOT SET'

    // Test with a simple prompt
    const testParams = {
      model: 'sora-2',
      prompt: 'A simple test video of a cat playing',
      aspectRatio: '9:16' as const,
      duration: 10 as const,
      size: 'small' as const,
      webHook: '-1', // Use polling
      shutProgress: false,
    }

    console.log('[debug/test-grsai-api] Testing API connection:', {
      hasApiKey,
      apiHost,
      apiKeyPrefix,
      testParams,
    })

    // Try to call API
    try {
      const response = await createSoraVideoTask(testParams)
      
      return NextResponse.json({
        success: true,
        message: 'API connection successful',
        config: {
          hasApiKey,
          apiHost,
          apiKeyPrefix,
        },
        response: {
          hasId: 'id' in response || ('data' in response && response.data?.id),
          type: 'data' in response ? 'taskId' : 'stream',
        },
      })
    } catch (apiError) {
      const errorMessage = apiError instanceof Error ? apiError.message : String(apiError)
      
      return NextResponse.json({
        success: false,
        message: 'API call failed',
        config: {
          hasApiKey,
          apiHost,
          apiKeyPrefix,
        },
        error: errorMessage,
        troubleshooting: {
          checkApiKey: !hasApiKey ? 'GRSAI_API_KEY is not set' : 'GRSAI_API_KEY is configured',
          checkNetwork: 'Ensure you can access ' + apiHost,
          checkApiStatus: 'Check if Grsai API service is available',
        },
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

