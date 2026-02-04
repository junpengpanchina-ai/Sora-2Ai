import type { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/service'
import { getSharePageUrl, getBaseUrl } from '@/lib/utils/url'

type PageProps = { params: { taskId: string } }

async function getShareMeta(taskId: string) {
  try {
    const supabase = await createServiceClient()
    const { data, error } = await supabase
      .from('video_tasks')
      .select('prompt, video_url, status')
      .eq('id', taskId)
      .eq('status', 'succeeded')
      // Soft abuse prevention: future support for deleted_at or visibility
      // .is('deleted_at', null)
      // .eq('visibility', 'public')
      .single()

    const row = data as { prompt?: string; video_url?: string | null; status?: string } | null
    if (error || !row || row.status !== 'succeeded') return null
    return {
      title: row.prompt || 'AI-generated video',
      videoUrl: row.video_url || null,
    }
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const taskId = params.taskId
  const meta = await getShareMeta(taskId)
  if (!meta) {
    return {
      title: 'Video not found | Sora2Ai',
      robots: { index: false, follow: true },
    }
  }

  const canonical = getSharePageUrl(taskId)
  const title = meta.title.slice(0, 60) + (meta.title.length > 60 ? '…' : '')
  const description = 'Watch this AI-generated video. Created with Sora2Ai Video Generator.'

  return {
    title: `${title} | Sora2Ai`,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'video.other',
      title: `${title} | Sora2Ai`,
      description,
      url: canonical,
      siteName: 'Sora2Ai',
      images: meta.videoUrl ? [{ url: meta.videoUrl, width: 1280, height: 720, alt: title }] : undefined,
      videos: meta.videoUrl ? [{ url: meta.videoUrl, width: 1280, height: 720 }] : undefined,
    },
    twitter: {
      card: 'player',
      title: `${title} | Sora2Ai`,
      description,
      images: meta.videoUrl ? [meta.videoUrl] : undefined,
    },
    robots: { index: true, follow: true },
  }
}

export default async function SharePage({ params }: PageProps) {
  const taskId = params.taskId
  const meta = await getShareMeta(taskId)

  if (!meta) {
    return (
      <div className="min-h-screen bg-[#050b18] flex items-center justify-center px-4">
        <div className="text-center text-white">
          <h1 className="text-xl font-semibold">Video not found</h1>
          <p className="mt-2 text-gray-400">This link may have expired or the video is no longer available.</p>
          <Link href="/video" className="mt-6 inline-block text-energy-water hover:underline">
            Create your own video →
          </Link>
        </div>
      </div>
    )
  }

  const baseUrl = getBaseUrl()
  const videoPageUrl = `${baseUrl}/video`

  return (
    <div className="min-h-screen bg-[#050b18] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold text-white">
          AI-generated video
        </h1>
        <p className="mt-2 text-gray-400 line-clamp-2">
          {meta.title}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Sharing helps you get feedback — create and share your own with Sora2Ai.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={videoPageUrl}
            className="inline-flex items-center gap-2 rounded-xl bg-energy-water px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Create your own video
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
