import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Health check endpoint for monitoring server status
 * Used to verify database connectivity and basic functionality
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message: string; duration?: number }> = {}
  const startTime = Date.now()

  try {
    // Check 1: Database connectivity
    const dbStartTime = Date.now()
    try {
      const supabase = await createServiceClient()
      const { error } = await supabase
        .from('use_cases')
        .select('id')
        .limit(1)
      
      const dbDuration = Date.now() - dbStartTime
      
      if (error) {
        checks.database = {
          status: 'error',
          message: `Database query failed: ${error.message}`,
          duration: dbDuration,
        }
      } else {
        checks.database = {
          status: 'ok',
          message: 'Database connection successful',
          duration: dbDuration,
        }
      }
    } catch (error) {
      const dbDuration = Date.now() - dbStartTime
      checks.database = {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown database error',
        duration: dbDuration,
      }
    }

    // Check 2: Environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SITE_URL',
    ]
    
    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    )
    
    if (missingEnvVars.length > 0) {
      checks.environment = {
        status: 'error',
        message: `Missing environment variables: ${missingEnvVars.join(', ')}`,
      }
    } else {
      checks.environment = {
        status: 'ok',
        message: 'All required environment variables are set',
      }
    }

    // Determine overall status
    const hasErrors = Object.values(checks).some((check) => check.status === 'error')
    const overallStatus = hasErrors ? 'error' : 'ok'
    const totalDuration = Date.now() - startTime

    return NextResponse.json(
      {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        checks,
      },
      {
        status: hasErrors ? 503 : 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    const totalDuration = Date.now() - startTime
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        error: error instanceof Error ? error.message : 'Unknown error',
        checks,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
