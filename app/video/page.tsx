import type { Metadata } from 'next'
import VideoPageWrapper from './VideoPageWrapper'

export async function generateMetadata({ searchParams }: { searchParams?: { prompt?: string } }): Promise<Metadata> {
  const prompt = searchParams?.prompt
  
  if (prompt) {
    // 截取 prompt 的前 50 个字符作为 title 的一部分
    const promptPreview = prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt
    return {
      title: `Generate: ${promptPreview}`,
      description: `Generate AI video with prompt: ${promptPreview}. Create stunning videos using OpenAI Sora 2.0 model.`,
    }
  }

  return {
    title: 'Video Generator - Create AI Videos from Text',
    description: 'Create stunning AI-generated videos with Sora2Ai. Use OpenAI Sora 2.0 model to generate high-quality video content from text prompts.',
  }
}

export default function VideoPage() {
  return <VideoPageWrapper />
}
