import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Home - Create Stunning AI Videos with Sora 2.0',
  description: 'Generate high-quality video content easily with Sora2Ai Videos and the latest OpenAI Sora 2.0 model. Create stunning AI-generated videos in minutes.',
}

export default function HomePage() {
  return <HomePageClient userProfile={null} />
}

