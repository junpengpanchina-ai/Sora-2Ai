import type { Metadata } from 'next'
import PromptsEnPageClient from './PromptsEnPageClient'

export const metadata: Metadata = {
  title: 'Prompt Templates (English) - AI Video Generation Ideas',
  description: 'Discover English-language AI video prompt templates for Sora2Ai. Professional prompts for cinematic, documentary, and creative video generation.',
}

export default async function PromptsEnPage() {
  // Allow unauthenticated users to browse prompts
  // Render client component
  return <PromptsEnPageClient />
}

