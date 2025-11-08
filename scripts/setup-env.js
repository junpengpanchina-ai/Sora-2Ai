#!/usr/bin/env node

/**
 * 自动配置环境变量脚本
 * 运行: node scripts/setup-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnv() {
  console.log('🚀 Supabase 环境变量配置助手\n');

  const envPath = path.join(process.cwd(), '.env.local');
  const envExists = fs.existsSync(envPath);

  let envContent = '';

  // 如果文件已存在，读取现有内容
  if (envExists) {
    console.log('📄 发现现有的 .env.local 文件');
    const overwrite = await question('是否覆盖现有配置？(y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ 已取消');
      rl.close();
      return;
    }
    envContent = fs.readFileSync(envPath, 'utf-8');
  }

  // Supabase 配置（已提供）
  console.log('\n📝 配置 Supabase...');
  const supabaseUrl = 'https://hgzpzsiafycwlqrkzbis.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnenB6c2lhZnljd2xxcmt6YmlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MTk4NzIsImV4cCI6MjA3ODE5NTg3Mn0.WdpkrSXVZVZ64bY8NXG6Bpf-w59i305F7agny6wuj_Q';
  
  console.log(`✅ Supabase URL: ${supabaseUrl}`);
  console.log(`✅ Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  // Service Role Key（需要用户输入）
  console.log('\n⚠️  需要获取 Service Role Key:');
  console.log('   1. 访问 Supabase Dashboard');
  console.log('   2. 进入 Settings > API');
  console.log('   3. 找到 service_role key 并点击 Reveal');
  console.log('   4. 复制并粘贴 below\n');
  
  const serviceRoleKey = await question('请输入 Service Role Key (或按 Enter 跳过): ');

  // Google OAuth（已提供）
  console.log('\n📝 配置 Google OAuth...');
  const googleClientId = '222103705593-0v1ntpdj5lvlmgj7tokoaq101rm5kq5o.apps.googleusercontent.com';
  const googleClientSecret = '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';
  console.log('✅ Google OAuth 凭据已配置');

  // 构建环境变量内容
  const newEnvContent = `# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
${serviceRoleKey ? `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}` : '# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here'}

# Google OAuth
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}

# grsai.com API (后续使用)
# GRSAI_API_KEY=your_grsai_api_key
# GRSAI_API_URL=https://grsai.com/api/v1
`;

  // 写入文件
  fs.writeFileSync(envPath, newEnvContent, 'utf-8');
  console.log('\n✅ .env.local 文件已创建/更新！');
  console.log(`📁 文件位置: ${envPath}\n`);

  if (!serviceRoleKey) {
    console.log('⚠️  注意: Service Role Key 未配置，请稍后手动添加到 .env.local');
    console.log('   这对于某些服务器端功能是必需的\n');
  }

  console.log('📋 下一步:');
  console.log('   1. 运行 npm run check-env 检查配置');
  console.log('   2. 运行 npm run test:supabase 测试连接');
  console.log('   3. 在 Supabase Dashboard 中执行数据库迁移\n');

  rl.close();
}

setupEnv().catch(error => {
  console.error('❌ 配置失败:', error);
  rl.close();
  process.exit(1);
});

