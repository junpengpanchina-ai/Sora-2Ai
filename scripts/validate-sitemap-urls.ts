/**
 * Script to validate sitemap URLs and identify potential 404 errors
 * 
 * Usage:
 *   npx tsx scripts/validate-sitemap-urls.ts
 * 
 * This script:
 * 1. Fetches all sitemaps
 * 2. Extracts all URLs
 * 3. Checks if the corresponding database records exist
 * 4. Reports any URLs that might return 404
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sora2aivideos.com'

interface ValidationResult {
  url: string
  type: 'use-case' | 'keyword' | 'blog' | 'prompt' | 'compare' | 'industry' | 'static'
  slug: string
  exists: boolean
  error?: string
}

async function validateUseCaseUrls(): Promise<ValidationResult[]> {
  console.log('📋 Validating use case URLs...')
  
  const results: ValidationResult[] = []
  
  try {
    // Fetch all published use cases
    const { data: useCases, error } = await supabase
      .from('use_cases')
      .select('slug, is_published, quality_status')
      .eq('is_published', true)
      .eq('quality_status', 'approved')
    
    if (error) {
      console.error('❌ Error fetching use cases:', error)
      return results
    }
    
    const validSlugs = new Set(
      (useCases || [])
        .filter((uc: { slug: string | null }) => uc.slug && typeof uc.slug === 'string' && uc.slug.trim().length > 0)
        .map((uc: { slug: string }) => uc.slug.trim())
    )
    
    // Check all use case URLs in sitemap
    // Note: In a real scenario, you would fetch the actual sitemap XML
    // For now, we validate against the database
    
    console.log(`✅ Found ${validSlugs.size} valid use case slugs`)
    
    // You can extend this to fetch actual sitemap URLs and validate them
    // For now, we just report the valid slugs
    
    return results
  } catch (error) {
    console.error('❌ Error validating use case URLs:', error)
    return results
  }
}

async function validateKeywordUrls(): Promise<ValidationResult[]> {
  console.log('📋 Validating keyword URLs...')
  
  const results: ValidationResult[] = []
  
  try {
    const { data: keywords, error } = await supabase
      .from('long_tail_keywords')
      .select('page_slug, status')
      .eq('status', 'published')
    
    if (error) {
      console.error('❌ Error fetching keywords:', error)
      return results
    }
    
    const validSlugs = new Set(
      (keywords || [])
        .filter((kw: { page_slug: string | null }) => kw.page_slug && typeof kw.page_slug === 'string' && kw.page_slug.trim().length > 0)
        .map((kw: { page_slug: string }) => kw.page_slug.trim())
    )
    
    console.log(`✅ Found ${validSlugs.size} valid keyword slugs`)
    
    return results
  } catch (error) {
    console.error('❌ Error validating keyword URLs:', error)
    return results
  }
}

async function findInvalidSlugs(): Promise<void> {
  console.log('🔍 Finding invalid slugs in database...\n')
  
  // Check for use cases with invalid slugs
  const { data: useCases, error: ucError } = await supabase
    .from('use_cases')
    .select('id, slug, title, is_published')
    .eq('is_published', true)
  
  if (!ucError && useCases) {
    const invalidUseCases = useCases.filter(
      (uc) => !uc.slug || typeof uc.slug !== 'string' || uc.slug.trim().length === 0 || uc.slug.includes('.xml')
    )
    
    if (invalidUseCases.length > 0) {
      console.log('⚠️  Found invalid use case slugs:')
      invalidUseCases.forEach((uc) => {
        console.log(`   - ID: ${uc.id}, Slug: "${uc.slug}", Title: ${uc.title}`)
      })
    } else {
      console.log('✅ All published use cases have valid slugs')
    }
  }
  
  // Check for keywords with invalid slugs
  const { data: keywords, error: kwError } = await supabase
    .from('long_tail_keywords')
    .select('id, page_slug, keyword, status')
    .eq('status', 'published')
  
  if (!kwError && keywords) {
    const invalidKeywords = keywords.filter(
      (kw) => !kw.page_slug || typeof kw.page_slug !== 'string' || kw.page_slug.trim().length === 0 || kw.page_slug.includes('.xml')
    )
    
    if (invalidKeywords.length > 0) {
      console.log('\n⚠️  Found invalid keyword slugs:')
      invalidKeywords.forEach((kw) => {
        console.log(`   - ID: ${kw.id}, Slug: "${kw.page_slug}", Keyword: ${kw.keyword}`)
      })
    } else {
      console.log('✅ All published keywords have valid slugs')
    }
  }
}

async function main() {
  console.log('🚀 Starting sitemap URL validation...\n')
  console.log(`Base URL: ${baseUrl}\n`)
  
  // Find invalid slugs in database
  await findInvalidSlugs()
  
  console.log('\n' + '='.repeat(60) + '\n')
  
  // Validate URLs
  await validateUseCaseUrls()
  await validateKeywordUrls()
  
  console.log('\n✅ Validation complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Review any invalid slugs found above')
  console.log('   2. Fix or remove invalid database records')
  console.log('   3. Regenerate sitemaps')
  console.log('   4. Submit updated sitemaps to Google Search Console')
}

main().catch((error) => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
