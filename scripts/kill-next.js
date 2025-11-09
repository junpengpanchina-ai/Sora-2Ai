#!/usr/bin/env node

/**
 * 杀死所有 Next.js 相关进程
 * 解决开发服务器卡住或无响应的问题
 */

const { execSync } = require('child_process');

console.log('🔍 查找 Next.js 相关进程...\n');

try {
  // 查找所有 next 和 node 进程
  const processes = execSync('ps aux | grep -E "next|node.*dev" | grep -v grep', { encoding: 'utf-8' });
  
  if (!processes.trim()) {
    console.log('✅ 没有找到运行中的 Next.js 进程\n');
    process.exit(0);
  }

  console.log('找到以下进程:');
  console.log(processes);
  console.log('\n');

  // 杀死所有 next-server 进程
  try {
    execSync('pkill -f "next-server"', { stdio: 'ignore' });
    console.log('✅ 已停止 next-server 进程');
  } catch (e) {
    // 忽略错误（可能没有进程）
  }

  // 杀死所有 next dev 进程
  try {
    execSync('pkill -f "next dev"', { stdio: 'ignore' });
    console.log('✅ 已停止 next dev 进程');
  } catch (e) {
    // 忽略错误
  }

  // 释放 3000 端口
  try {
    const portProcess = execSync('lsof -ti:3000', { encoding: 'utf-8' }).trim();
    if (portProcess) {
      execSync(`kill -9 ${portProcess}`, { stdio: 'ignore' });
      console.log('✅ 已释放 3000 端口');
    }
  } catch (e) {
    // 端口可能没有被占用
  }

  console.log('\n✨ 清理完成！现在可以运行 npm run dev\n');
} catch (error) {
  console.error('❌ 清理过程中出现错误:', error.message);
  process.exit(1);
}

