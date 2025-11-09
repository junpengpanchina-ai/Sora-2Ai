import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PromptsPageClient from './PromptsPageClient'

export default async function PromptsPage() {
  // Server-side authentication check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login')
  }

  // Render client component
  return <PromptsPageClient />
}

