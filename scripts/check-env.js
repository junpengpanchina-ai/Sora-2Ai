#!/usr/bin/env node

/**
 * 环境变量配置检查脚本
 * 运行: node scripts/check-env.js
 */

const fs = require('fs');
const path = require('path');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
];

const optionalEnvVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'GRSAI_API_KEY',
  'GRSAI_API_URL',
];

function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env.example');

  console.log('🔍 检查环境变量配置...\n');

  // 检查 .env.local 文件是否存在
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 文件不存在！');
    console.log('📝 请创建 .env.local 文件并配置以下变量：\n');
    
    if (fs.existsSync(envExamplePath)) {
      console.log('💡 提示：可以参考 .env.example 文件\n');
    }
    
    console.log('必需的环境变量：');
    requiredEnvVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    
    console.log('\n可选的环境变量：');
    optionalEnvVars.forEach(varName => {
      console.log(`  - ${varName}`);
    });
    
    console.log('\n📖 详细配置说明请参考：');
    console.log('   - SETUP.md');
    console.log('   - GOOGLE_OAUTH_SETUP.md\n');
    
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

  // 检查必需的环境变量
  requiredEnvVars.forEach(varName => {
    if (!envVars[varName]) {
      missing.push(varName);
      allValid = false;
    } else if (envVars[varName] === '' || envVars[varName].startsWith('your_')) {
      empty.push(varName);
      allValid = false;
    }
  });

  if (missing.length > 0) {
    console.log('❌ 缺少以下必需的环境变量：');
    missing.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('');
  }

  if (empty.length > 0) {
    console.log('⚠️  以下环境变量未正确配置（仍为占位符）：');
    empty.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('');
  }

  if (allValid) {
    console.log('✅ 所有必需的环境变量已配置！\n');
    
    // 显示已配置的变量（隐藏敏感值）
    console.log('已配置的环境变量：');
    requiredEnvVars.forEach(varName => {
      const value = envVars[varName];
      const displayValue = varName.includes('SECRET') || varName.includes('KEY')
        ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`   ✅ ${varName} = ${displayValue}`);
    });
    
    optionalEnvVars.forEach(varName => {
      if (envVars[varName] && !envVars[varName].startsWith('your_')) {
        const value = envVars[varName];
        const displayValue = varName.includes('SECRET') || varName.includes('KEY')
          ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
          : value;
        console.log(`   ✅ ${varName} = ${displayValue}`);
      } else {
        console.log(`   ⚪ ${varName} (未配置，可选)`);
      }
    });
    
    console.log('\n🚀 可以运行 npm run dev 启动开发服务器了！\n');
    return true;
  }

  console.log('📖 配置说明：');
  console.log('   - SETUP.md - 完整设置指南');
  console.log('   - GOOGLE_OAUTH_SETUP.md - Google OAuth 配置说明\n');
  
  return false;
}

// 运行检查
const isValid = checkEnvFile();
process.exit(isValid ? 0 : 1);

