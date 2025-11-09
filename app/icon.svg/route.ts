import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// 处理 icon.svg 请求
export async function GET() {
  try {
    // 从 public 目录读取
    const publicIconPath = path.join(process.cwd(), 'public', 'icon.svg')
    if (fs.existsSync(publicIconPath)) {
      const iconContent = fs.readFileSync(publicIconPath, 'utf-8')
      return new NextResponse(iconContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }
    
    // 如果不存在，返回默认 SVG
    const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="20" fill="url(#grad)"/>
  <text x="50" y="65" font-family="Arial, sans-serif" font-size="50" font-weight="bold" fill="white" text-anchor="middle">S</text>
</svg>`
    
    return new NextResponse(defaultIcon, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('读取 icon.svg 失败:', error)
    return new NextResponse(null, { status: 500 })
  }
}

