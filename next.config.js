/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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

