'use client'

import { useMemo, useState } from 'react'

export type SharePlatform = 'twitter' | 'facebook' | 'instagram' | 'copy'

interface SocialShareButtonsProps {
  url: string
  title?: string
  description?: string
  imageUrl?: string
  className?: string
  /** 顺序建议：X / Facebook / Copy link / Instagram */
  platforms?: SharePlatform[]
  size?: 'sm' | 'md' | 'lg'
  onShare?: (platform: SharePlatform) => void
}

function openPopup(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

export default function SocialShareButtons({
  url,
  title = '',
  platforms = ['twitter', 'facebook', 'copy', 'instagram'],
  size = 'md',
  className = '',
  onShare,
}: SocialShareButtonsProps) {
  const [copiedPlatform, setCopiedPlatform] = useState<SharePlatform | null>(null)

  const shareUrls = useMemo(() => {
    const u = encodeURIComponent(url)
    const t = encodeURIComponent(title)
    return {
      twitter: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    }
  }, [url, title])

  const handleShare = async (platform: SharePlatform) => {
    onShare?.(platform)

    if (platform === 'twitter') {
      openPopup(shareUrls.twitter)
      return
    }
    if (platform === 'facebook') {
      openPopup(shareUrls.facebook)
      return
    }

    if (platform === 'instagram' || platform === 'copy') {
      await copyToClipboard(url)
      setCopiedPlatform(platform)
      window.setTimeout(() => setCopiedPlatform(null), 2000)
    }
  }

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }
  const iconClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  const toastMessage =
    copiedPlatform === 'instagram'
      ? 'Link copied — paste it into Instagram bio/story'
      : 'Link copied!'

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {platforms.includes('twitter') && (
          <a
            href={shareUrls.twitter}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              handleShare('twitter')
              openPopup(shareUrls.twitter)
            }}
            className={`inline-flex items-center justify-center rounded-lg bg-[#1DA1F2] text-white transition-colors hover:bg-[#1a8cd8] ${sizeClasses[size]}`}
            aria-label="Share on X"
            title="Share on X"
          >
            <svg className={iconClasses[size]} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
        )}

        {platforms.includes('facebook') && (
          <a
            href={shareUrls.facebook}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault()
              handleShare('facebook')
              openPopup(shareUrls.facebook)
            }}
            className={`inline-flex items-center justify-center rounded-lg bg-[#1877F2] text-white transition-colors hover:bg-[#166fe5] ${sizeClasses[size]}`}
            aria-label="Share on Facebook"
            title="Share on Facebook"
          >
            <svg className={iconClasses[size]} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
        )}

        {platforms.includes('copy') && (
          <button
            type="button"
            onClick={() => handleShare('copy')}
            className={`inline-flex items-center justify-center rounded-lg bg-gray-600 text-white transition-colors hover:bg-gray-700 ${sizeClasses[size]}`}
            aria-label="Copy link"
            title="Copy link"
          >
            {copiedPlatform === 'copy' ? (
              <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className={iconClasses[size]} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        )}

        {platforms.includes('instagram') && (
          <button
            type="button"
            onClick={() => handleShare('instagram')}
            className={`inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white transition-opacity hover:opacity-90 ${sizeClasses[size]}`}
            aria-label="Copy link for Instagram"
            title="Copy link for Instagram"
          >
            <svg className={iconClasses[size]} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </button>
        )}
      </div>

      {copiedPlatform !== null && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 animate-fade-in">
          {toastMessage}
        </p>
      )}
    </div>
  )
}
