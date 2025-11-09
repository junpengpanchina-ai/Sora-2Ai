import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VideoPageClient from './VideoPageClient'

export default async function VideoPage() {
  // 服务器端身份验证检查
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 如果未登录，重定向到登录页
  if (!user) {
    redirect('/login')
  }

  // 渲染客户端组件
  return <VideoPageClient />
}
