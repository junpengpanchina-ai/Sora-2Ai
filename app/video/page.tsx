import type { Metadata } from 'next'
import VideoPageWrapper from './VideoPageWrapper'

export async function generateMetadata({ searchParams }: { searchParams?: { prompt?: string } }): Promise<Metadata> {
  const prompt = searchParams?.prompt
  
  if (prompt) {
    // 截取 prompt 的前 60 个字符作为 description 的一部分，确保唯一性
    const promptPreview = prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt
    // 为每个 prompt 生成更独特的描述
    const uniqueDescription = `Watch AI-generated video: "${promptPreview}". Created with Sora2Ai using OpenAI Sora 2.0 technology. ${prompt.length > 100 ? 'Full prompt available on page.' : 'Generate your own video now.'}`
    return {
      title: `Generate: ${promptPreview}`,
      description: uniqueDescription,
    }
  }

  return {
    title: 'Video Generator - Create AI Videos from Text',
    description: 'Transform text prompts into professional AI videos instantly. Sora2Ai video generator uses OpenAI Sora 2.0 to create high-quality content from your descriptions.',
  }
}

export default function VideoPage() {
  return <VideoPageWrapper />
}
