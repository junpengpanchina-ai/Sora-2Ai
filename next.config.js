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
    ],
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
    // 优化服务器组件
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig

