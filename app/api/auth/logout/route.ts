import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'


// Force dynamic rendering to prevent build-time execution
export const dynamic = 'force-dynamic'
export async function POST() {
  try {
    const supabase = await createClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
    }

    // Return success response (client will handle redirect)
    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    )
  }
}

