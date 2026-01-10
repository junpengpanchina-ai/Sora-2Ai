import type { Metadata } from 'next'
import HomePageClient from './HomePageClient'

export const metadata: Metadata = {
  title: 'Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills | Sora2Ai',
  description: 'Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Just type and create. Start with 30 free credits.',
}

export default function HomePage() {
  // Structured Data for Homepage
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Create High-Quality AI Videos from Text — Fast, Simple, No Editing Skills',
    description: 'Generate marketing videos, social media clips, product demos, and explainer videos using AI. No camera. No editing software. Start with 30 free credits.',
    url: 'https://sora2aivideos.com',
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: 'Sora2Ai Video Generator',
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
        <h2>Create High-Quality AI Videos from Text — Text to Video AI Generator</h2>
        <p>
          Looking for the best Sora alternatives? Our platform is one of the top text-to-video AI tools that 
          creates stunning, professional-quality videos from text prompts in seconds. Whether you&apos;re 
          creating marketing content, social media videos, educational materials, or creative projects, we 
          make AI video generation accessible to everyone, regardless of technical expertise.
        </p>
        <p>
          As a leading Sora alternative, we offer 30 free credits when you sign up - no credit card required. 
          Our platform supports various video styles including cinematic shots, documentary footage, fashion 
          content, nature scenes, sports highlights, and abstract visuals. Each video is generated using 
          advanced AI technology to ensure high quality and creative results that match your vision.
        </p>
        <p>
          Our text-to-video AI generator process is simple: enter a detailed text description of the video 
          you want to create, select your preferred aspect ratio and duration, and let our AI do the rest. 
          The platform supports both portrait (9:16) and landscape (16:9) formats, with video durations of 
          10 or 15 seconds. All videos are generated in high quality and can be downloaded immediately after 
          completion.
        </p>
        <h3>Why Choose Our Sora Alternative?</h3>
        <ul>
          <li>Free AI video generator - Get started with 30 free credits</li>
          <li>Text-to-video AI technology comparable to OpenAI Sora</li>
          <li>Multiple video styles and categories</li>
          <li>Fast generation times, typically completed in minutes</li>
          <li>High-quality output suitable for professional use</li>
          <li>Easy-to-use interface with prompt templates</li>
          <li>Flexible pricing plans with credit-based system</li>
          <li>No watermark on generated videos</li>
        </ul>
        <h3>Best Sora Alternatives Comparison</h3>
        <p>
          When comparing Sora alternatives like Runway, Pika, Luma, and our platform, we stand out with our 
          user-friendly interface, competitive pricing, and high-quality output. Our free tier makes it easy 
          to get started, and our credit system ensures you only pay for what you use.
        </p>
        <h3>Data Usage Transparency</h3>
        <p>
          We use Google Sign-In to securely authenticate your account. We only request your email address and basic profile information (name, profile picture) to create your account and provide personalized video generation services. Your data is encrypted and stored securely. For more information, please review our Privacy Policy at https://sora2aivideos.com/privacy.
        </p>
      </section>
      <HomePageClient userProfile={null} />
    </>
  )
}

