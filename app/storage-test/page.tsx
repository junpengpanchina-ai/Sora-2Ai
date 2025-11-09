import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StorageTestClient from './StorageTestClient'

export default async function StorageTestPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <StorageTestClient />
}

