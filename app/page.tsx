import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Home - Create Stunning AI Videos with Sora 2.0',
  description: 'Welcome to Sora2Ai Videos - the premier platform for AI video generation. Start creating professional videos from text prompts in seconds. Get 30 free credits when you sign up.',
}

export default function HomePage() {
  return <HomePageClient userProfile={null} />
}

