#!/usr/bin/env node

/**
 * 等待 Next.js 开发服务器完全启动
 * 解决"开发服务器在构建完成前就访问了页面"的问题
 */

const http = require('http');

const MAX_ATTEMPTS = 30;
const RETRY_DELAY = 1000; // 1秒
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

function checkServer() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${HOST}:${PORT}`, (res) => {
      if (res.statusCode === 200 || res.statusCode === 404) {
        // 404 也可以，说明服务器已经启动（只是路由不存在）
        resolve(true);
      } else {
        reject(new Error(`服务器返回状态码: ${res.statusCode}`));
      }
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.setTimeout(2000, () => {
      req.destroy();
      reject(new Error('请求超时'));
    });
  });
}

async function waitForServer() {
  console.log(`⏳ 等待开发服务器在 http://${HOST}:${PORT} 启动...\n`);

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      await checkServer();
      console.log(`✅ 开发服务器已成功启动！\n`);
      console.log(`🌐 可以访问: http://${HOST}:${PORT}\n`);
      process.exit(0);
    } catch (error) {
      if (i < MAX_ATTEMPTS - 1) {
        process.stdout.write(`\r⏳ 等待中... (${i + 1}/${MAX_ATTEMPTS})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      } else {
        console.error(`\n❌ 服务器启动超时 (${MAX_ATTEMPTS} 次尝试后)`);
        console.error(`   请检查开发服务器是否正常运行\n`);
        process.exit(1);
      }
    }
  }
}

waitForServer();


