import type { Metadata } from 'next'
import PromptsEnPageClient from './PromptsEnPageClient'

export const metadata: Metadata = {
  title: 'Prompt Templates (English) - AI Video Generation Ideas',
  description: 'Discover English-language AI video prompt templates for Sora2Ai. Professional prompts for cinematic, documentary, and creative video generation.',
}

export default async function PromptsEnPage() {
  // Structured Data for English Prompts Library
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'AI Video Prompt Templates (English)',
    description: 'Discover English-language AI video prompt templates for Sora2Ai. Professional prompts for cinematic, documentary, and creative video generation.',
    url: 'https://sora2aivideos.com/prompts-en',
    mainEntity: {
      '@type': 'ItemList',
      name: 'English AI Video Prompt Templates',
      description: 'Curated collection of English-language video generation prompts for various categories',
    },
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* SEO-friendly text content for better text-HTML ratio */}
      <section className="sr-only">
        <h2>English AI Video Prompt Library</h2>
        <p>
          Explore our comprehensive collection of English-language AI video generation prompts designed to help you 
          create stunning videos using OpenAI Sora 2.0 technology. Our English prompt library includes carefully crafted 
          templates for various categories including cinematic shots, documentary footage, fashion content, nature scenes, 
          sports highlights, and abstract visuals.
        </p>
        <p>
          Whether you&apos;re a beginner learning how to write effective video prompts or an experienced creator looking for 
          inspiration, our English-language library provides ready-to-use templates that you can copy and customize. Each 
          prompt includes detailed descriptions, category tags, difficulty levels, and example outputs to help you understand 
          how to use them effectively.
        </p>
        <p>
          Our English prompts are organized by category and difficulty level, making it easy to find the right template for 
          your project. You can search by keywords, filter by category, or browse through our curated collections. All prompts 
          are optimized for the Sora 2.0 model to ensure the best possible video generation results.
        </p>
        <h3>How to Use Our English Prompt Library</h3>
        <p>
          Start by browsing our collection or using the search function to find prompts related to your project. Click on any 
          prompt to view its full details, including the complete prompt text, category information, and usage tips. You can copy 
          the prompt directly or use it as inspiration to create your own custom video descriptions. All prompts are written in 
          English and designed to work seamlessly with the Sora2Ai video generation platform.
        </p>
      </section>
      <PromptsEnPageClient />
    </>
  )
}

