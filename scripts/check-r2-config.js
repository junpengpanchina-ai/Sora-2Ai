#!/usr/bin/env node

/**
 * R2 配置检查脚本
 * 运行: node scripts/check-r2-config.js
 */

const fs = require('fs');
const path = require('path');

const requiredR2Vars = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
];

function checkR2Config() {
  console.log('🔍 检查 R2 配置...\n');

  const envPath = path.join(process.cwd(), '.env.local');

  // 检查 .env.local 文件是否存在
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 文件不存在！');
    console.log('📝 请创建 .env.local 文件并添加 R2 配置\n');
    return false;
  }

  // 读取 .env.local 文件
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  let allValid = true;
  const missing = [];
  const empty = [];
  const configured = [];

  // 检查必需的 R2 环境变量
  requiredR2Vars.forEach(varName => {
    if (!(varName in envVars)) {
      missing.push(varName);
      allValid = false;
    } else if (!envVars[varName] || envVars[varName].trim() === '') {
      empty.push(varName);
      allValid = false;
    } else {
      configured.push(varName);
    }
  });

  // 显示结果
  if (missing.length > 0) {
    console.log('❌ 缺少以下环境变量：');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log();
  }

  if (empty.length > 0) {
    console.log('⚠️  以下环境变量为空：');
    empty.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log();
  }

  if (configured.length > 0) {
    console.log('✅ 已配置的环境变量：');
    configured.forEach(varName => {
      const value = envVars[varName];
      const preview = value.length > 20 ? value.substring(0, 20) + '...' : value;
      const masked = varName.includes('SECRET') || varName.includes('KEY') 
        ? preview.replace(/./g, '*').substring(0, 10) + '...' 
        : preview;
      console.log(`   ✓ ${varName} = ${masked}`);
    });
    console.log();
  }

  if (allValid) {
    console.log('✅ 所有 R2 环境变量已正确配置！');
    console.log('\n📋 配置摘要：');
    console.log(`   - Account ID: ${envVars.R2_ACCOUNT_ID}`);
    console.log(`   - Bucket Name: ${envVars.R2_BUCKET_NAME}`);
    console.log(`   - Public URL: ${envVars.R2_PUBLIC_URL}`);
    console.log(`   - Access Key ID: ${envVars.R2_ACCESS_KEY_ID.substring(0, 10)}...`);
    console.log(`   - Secret Access Key: ${'*'.repeat(20)}...`);
    console.log('\n💡 提示：重启开发服务器后配置才会生效');
    return true;
  } else {
    console.log('❌ R2 配置不完整');
    console.log('\n📝 请在 .env.local 文件中添加以下配置：\n');
    console.log('# Cloudflare R2 配置（管理员功能）');
    console.log('R2_ACCOUNT_ID=2776117bb412e09a1d30cbe886cd3935');
    console.log('R2_ACCESS_KEY_ID=你的_access_key_id');
    console.log('R2_SECRET_ACCESS_KEY=你的_secret_access_key');
    console.log('R2_BUCKET_NAME=sora2');
    console.log('R2_PUBLIC_URL=https://pub-2868c824f92441499577980a0b61114c.r2.dev');
    console.log('\n📖 详细配置说明请参考：R2_ADMIN_CONFIG.md');
    return false;
  }
}

// 运行检查
const isValid = checkR2Config();
process.exit(isValid ? 0 : 1);
