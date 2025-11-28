'use client'
/* eslint-disable @next/next/no-img-element */

import { getPublicUrl } from '@/lib/r2/client'
import Image from 'next/image'
import { useState } from 'react'

interface R2ImageProps {
  /** 图片在 R2 中的路径，例如 'images/hero.jpg' */
  src: string
  /** 图片的 alt 文本 */
  alt: string
  /** 图片宽度（用于 Next.js Image 组件） */
  width?: number
  /** 图片高度（用于 Next.js Image 组件） */
  height?: number
  /** 是否使用 Next.js Image 组件（默认 false，使用普通 img 标签） */
  useNextImage?: boolean
  /** 自定义 className */
  className?: string
  /** 图片加载失败时的回调 */
  onError?: () => void
  /** 图片加载成功时的回调 */
  onLoad?: () => void
}

/**
 * R2 图片组件
 * 
 * 用于轻松显示存储在 Cloudflare R2 中的图片
 * 
 * @example
 * ```tsx
 * // 基本使用
 * <R2Image src="images/hero.jpg" alt="Hero Image" />
 * 
 * // 使用 Next.js Image 优化
 * <R2Image 
 *   src="images/hero.jpg" 
 *   alt="Hero Image"
 *   useNextImage
 *   width={800}
 *   height={600}
 * />
 * 
 * // 自定义样式
 * <R2Image 
 *   src="images/hero.jpg" 
 *   alt="Hero Image"
 *   className="w-full h-64 object-cover rounded-lg"
 * />
 * ```
 */
export default function R2Image({
  src,
  alt,
  width,
  height,
  useNextImage = false,
  className = '',
  onError,
  onLoad,
}: R2ImageProps) {
  const [imageError, setImageError] = useState(false)
  const imageUrl = getPublicUrl(src)

  const handleError = () => {
    setImageError(true)
    onError?.()
  }

  const handleLoad = () => {
    onLoad?.()
  }

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 ${className}`}
      >
        <span className="text-sm">Failed to load image</span>
      </div>
    )
  }

  if (useNextImage && width && height) {
    return (
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        decoding="async"
      />
    )
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
      loading="lazy"
      decoding="async"
    />
  )
}

