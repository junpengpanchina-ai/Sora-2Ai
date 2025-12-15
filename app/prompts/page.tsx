import type { Metadata } from 'next'
import PromptsPageClient from './PromptsPageClient'

export const metadata: Metadata = {
  title: 'Prompt Library - AI Video Generation Templates',
  description: 'Explore our curated collection of AI video prompt templates. Copy ready-to-use prompts for fashion, nature, sports, and more. Start creating with Sora2Ai today.',
}

export default async function PromptsPage() {
  // Allow unauthenticated users to browse prompts
  // Render client component
  return <PromptsPageClient />
}

