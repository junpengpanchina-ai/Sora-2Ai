import PromptsPageClient from './PromptsPageClient'

export default async function PromptsPage() {
  // Allow unauthenticated users to browse prompts
  // Render client component
  return <PromptsPageClient />
}

