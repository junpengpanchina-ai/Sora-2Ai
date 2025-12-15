import type { Metadata } from 'next'
import PromptsPageClient from './PromptsPageClient'

export const metadata: Metadata = {
  title: 'Prompt Library - AI Video Generation Templates',
  description: 'Browse and use AI video generation prompt templates. Get inspired with ready-to-use prompts for creating stunning videos with Sora2Ai.',
}

export default async function PromptsPage() {
  // Allow unauthenticated users to browse prompts
  // Render client component
  return <PromptsPageClient />
}

