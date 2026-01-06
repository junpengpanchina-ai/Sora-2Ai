// ============================================
// OAuth 登录一键修复 - 单行命令版本
// 直接复制粘贴到控制台运行即可
// ============================================

// 一键清除 OAuth 存储（最简单）
(() => { const keys = [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter(k => k.includes('supabase') || k.startsWith('sb-') || k.includes('oauth') || k.includes('code_verifier')); [...new Set(keys)].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); }); console.log(`✅ 已清除 ${[...new Set(keys)].length} 个 OAuth 键，请重新登录`); })()

