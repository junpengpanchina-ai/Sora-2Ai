import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Home - Create Stunning AI Videos with Sora 2.0',
  description: 'Welcome to Sora2Ai Videos - the premier platform for AI video generation. Start creating professional videos from text prompts in seconds. Get 30 free credits when you sign up.',
}

export default function HomePage() {
  // Structured Data for Homepage
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Sora2Ai Videos - AI Video Generation Platform',
    description: 'Transform your ideas into stunning AI-generated videos using OpenAI Sora 2.0. Free credits available for new users.',
    url: 'https://sora2aivideos.com',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Sora2Ai Videos',
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description: '30 free credits for new users',
      },
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
        <h2>About Sora2Ai Videos Platform</h2>
        <p>
          Sora2Ai Videos is a cutting-edge AI video generation platform powered by OpenAI Sora 2.0 technology. 
          Transform your text prompts into stunning, professional-quality videos in seconds. Whether you&apos;re 
          creating marketing content, social media videos, educational materials, or creative projects, our 
          platform makes video generation accessible to everyone, regardless of technical expertise.
        </p>
        <p>
          Get started with 30 free credits when you sign up. No credit card required. Our platform supports 
          various video styles including cinematic shots, documentary footage, fashion content, nature scenes, 
          sports highlights, and abstract visuals. Each video is generated using advanced AI technology to ensure 
          high quality and creative results that match your vision.
        </p>
        <p>
          Our video generation process is simple: enter a detailed text description of the video you want to 
          create, select your preferred aspect ratio and duration, and let our AI do the rest. The platform 
          supports both portrait (9:16) and landscape (16:9) formats, with video durations of 10 or 15 seconds. 
          All videos are generated in high quality and can be downloaded immediately after completion.
        </p>
        <h3>Key Features</h3>
        <ul>
          <li>AI-powered video generation using OpenAI Sora 2.0</li>
          <li>Multiple video styles and categories</li>
          <li>Fast generation times, typically completed in minutes</li>
          <li>High-quality output suitable for professional use</li>
          <li>Easy-to-use interface with prompt templates</li>
          <li>Flexible pricing plans with credit-based system</li>
        </ul>
      </section>
      <HomePageClient userProfile={null} />
    </>
  )
}

