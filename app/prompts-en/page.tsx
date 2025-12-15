import type { Metadata } from 'next'
import PromptsEnPageClient from './PromptsEnPageClient'

export const metadata: Metadata = {
  title: 'Prompt Templates (English) - AI Video Generation Ideas',
  description: 'Browse English AI video generation prompt templates. Get inspired with ready-to-use prompts for creating stunning videos with Sora2Ai.',
}

export default async function PromptsEnPage() {
  // Allow unauthenticated users to browse prompts
  // Render client component
  return <PromptsEnPageClient />
}

