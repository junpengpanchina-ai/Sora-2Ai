/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'pub-2868c824f92441499577980a0b61114c.r2.dev',
        pathname: '/**',
      },
    ],
    // 🔥 Pro 计划优化：启用图片优化和缓存
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7天缓存
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 优化文件系统监听
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // 优化开发模式下的文件监听
      config.watchOptions = {
        poll: 1000, // 每秒检查一次文件变化（解决文件系统监听问题）
        aggregateTimeout: 300, // 延迟 300ms 后重新构建
        ignored: /node_modules/,
      }
    }
    
    // 确保路径别名正确解析
    if (!config.resolve.alias) {
      config.resolve.alias = {}
    }
    config.resolve.alias['@'] = require('path').join(__dirname)
    
    // 忽略 Supabase 在 Edge Runtime 中的警告
    // 这些警告不影响功能，因为 Supabase SSR 库会优雅地处理这些情况
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase\/realtime-js/ },
      { module: /node_modules\/@supabase\/supabase-js/ },
    ]
    
    return config
  },
  
  // 优化开发服务器
  onDemandEntries: {
    // 页面在内存中保留的时间（秒）
    maxInactiveAge: 25 * 1000,
    // 同时保留在内存中的页面数
    pagesBufferLength: 2,
  },
  
  // 实验性功能：优化构建
  experimental: {
    // 启用 Turbopack（Next.js 14+ 支持，大幅提升构建速度）
    turbo: {
      // Turbopack 配置
    },
    // 优化服务器组件
    serverComponentsExternalPackages: [],
    // 优化包导入
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
    // 🔥 Pro 计划优化：启用服务器操作优化
    serverActions: {
      bodySizeLimit: '2mb', // 增加 body 大小限制
    },
  },
  
  // 🔥 Pro 计划优化：配置 CDN 和缓存
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        // 静态资源长期缓存（利用 Vercel CDN）
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // 图片资源缓存
        source: '/:path*\\.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API 路由缓存（仅适用于可缓存的 API）
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ]
  },
  
  // 优化构建性能
  swcMinify: true,
  
  // ESLint 配置：忽略 ESLint 9.x 兼容性警告
  eslint: {
    // 在生产构建时忽略 ESLint 错误（仅用于消除 ESLint 9.x 兼容性警告）
    ignoreDuringBuilds: false,
    // 注意：我们仍然运行 ESLint，但会忽略某些已知的兼容性警告
  },
  
  // 禁用 Vercel Toolbar（仅在生产环境）
  // 注意：这需要在 Vercel Dashboard 中同时设置才能完全禁用
  // Settings > General > Vercel Toolbar > Production: Off
  env: {
    // 确保生产环境不显示 Toolbar
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
  },
  
}

module.exports = nextConfig

