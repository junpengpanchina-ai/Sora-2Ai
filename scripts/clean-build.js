#!/usr/bin/env node

/**
 * 清理 Next.js 构建缓存和临时文件
 * 解决构建缓存损坏、文件系统监听等问题
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

const dirsToClean = [
  '.next',
  'node_modules/.cache',
  '.turbo',
];

const filesToClean = [
  'next-env.d.ts',
];

console.log('🧹 开始清理构建缓存...\n');

let cleanedCount = 0;

// 清理目录
dirsToClean.forEach(dir => {
  const dirPath = path.join(projectRoot, dir);
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ 已删除: ${dir}`);
      cleanedCount++;
    } catch (error) {
      console.error(`❌ 删除失败 ${dir}:`, error.message);
    }
  } else {
    console.log(`ℹ️  不存在: ${dir}`);
  }
});

// 清理文件
filesToClean.forEach(file => {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ 已删除: ${file}`);
      cleanedCount++;
    } catch (error) {
      console.error(`❌ 删除失败 ${file}:`, error.message);
    }
  }
});

console.log(`\n✨ 清理完成！共清理 ${cleanedCount} 个项目\n`);
console.log('💡 提示: 现在可以运行 npm run dev 重新启动开发服务器\n');






