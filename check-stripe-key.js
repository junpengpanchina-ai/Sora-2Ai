/**
 * 快速检查 Stripe API Key 是否有效
 * 
 * 使用方法：
 * 1. 在浏览器控制台运行
 * 2. 或者作为 Node.js 脚本运行（需要先设置 STRIPE_SECRET_KEY 环境变量）
 */

// 如果是浏览器环境
if (typeof window !== 'undefined') {
  console.log('请在服务器端运行此脚本，或使用诊断脚本检查 API 状态');
  console.log('当前错误信息显示: Stripe API Key 已过期');
  console.log('需要在 Vercel 环境变量中更新 STRIPE_SECRET_KEY');
} else {
  // Node.js 环境
  const Stripe = require('stripe');
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY 环境变量未设置');
    process.exit(1);
  }
  
  console.log('🔍 检查 Stripe API Key...');
  console.log('Key 前缀:', secretKey.substring(0, 20) + '...');
  
  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-10-29.clover',
  });
  
  // 测试 API Key 是否有效
  stripe.customers.list({ limit: 1 })
    .then(() => {
      console.log('✅ Stripe API Key 有效！');
    })
    .catch((error) => {
      if (error.code === 'api_key_expired') {
        console.error('❌ Stripe API Key 已过期！');
        console.log('请登录 Stripe Dashboard 获取新的 Secret Key');
      } else if (error.code === 'api_key_invalid') {
        console.error('❌ Stripe API Key 无效！');
        console.log('请检查密钥是否正确');
      } else {
        console.error('❌ 检查失败:', error.message);
      }
      process.exit(1);
    });
}

