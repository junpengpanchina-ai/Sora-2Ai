import type { Metadata } from 'next'
import PromptsPageClient from './PromptsPageClient'

export const metadata: Metadata = {
  title: 'Prompt Library - AI Video Generation Templates',
  description: 'Explore our curated collection of AI video prompt templates. Copy ready-to-use prompts for fashion, nature, sports, and more. Start creating with Sora2Ai today.',
  robots: {
    index: false,  // ❌ Prompt 列表页不索引（内部资产，不是 SEO/GEO 内容主体）
    follow: false, // ❌ 不传递内链权重
  },
}

export default async function PromptsPage() {
  // Structured Data for Prompts Library
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Video Prompt Library',
    description: 'Browse our comprehensive collection of AI video generation prompts designed to help you create stunning videos using OpenAI Sora 2.0 technology.',
    url: 'https://sora2aivideos.com/prompts',
    mainEntity: {
      '@type': 'ItemList',
      name: 'AI Video Prompt Templates',
      description: 'Curated collection of video generation prompts for various categories',
    },
  }

  // Allow unauthenticated users to browse prompts
  // Render client component
  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* SEO-friendly text content for better text-HTML ratio */}
      <section className="sr-only">
        <h2>AI Video Prompt Library and Templates</h2>
        <p>
          Browse our comprehensive collection of AI video generation prompts designed to help you create 
          stunning videos using OpenAI Sora 2.0 technology. Our prompt library includes carefully crafted 
          templates for various categories including nature scenes, character animations, action sequences, 
          scenic landscapes, abstract visuals, and cinematic content.
        </p>
        <p>
          Whether you&apos;re a beginner learning how to write effective video prompts or an experienced 
          creator looking for inspiration, our library provides ready-to-use templates that you can copy 
          and customize. Each prompt includes detailed descriptions, category tags, difficulty levels, and 
          example outputs to help you understand how to use them effectively.
        </p>
        <p>
          Our prompts are organized by category and difficulty level, making it easy to find the right 
          template for your project. You can search by keywords, filter by category, or browse through 
          our curated collections. All prompts are optimized for the Sora 2.0 model to ensure the best 
          possible video generation results.
        </p>
        <h3>How to Use Our Prompt Library</h3>
        <p>
          Start by browsing our collection or using the search function to find prompts related to your 
          project. Click on any prompt to view its full details, including the complete prompt text, 
          category information, and usage tips. You can copy the prompt directly or use it as inspiration 
          to create your own custom video descriptions.
        </p>
      </section>
      <PromptsPageClient />
    </>
  )
}

