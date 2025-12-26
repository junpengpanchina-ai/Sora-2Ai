// ============================================
// 快速测试 - 直接复制到控制台（一行代码）
// ============================================

// 场景应用提示词（商业场景）
const scenePrompt = "A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions";

// 测试编码
console.log('%c🎬 场景应用提示词测试', 'font-size: 16px; font-weight: bold; color: #00d4ff;');
console.log('原始提示词:', scenePrompt);
console.log('URL编码:', encodeURIComponent(scenePrompt));
console.log('JSON编码:', JSON.stringify(scenePrompt));
console.log('长度:', scenePrompt.length, '字符');

// 检查特殊字符
const specialChars = scenePrompt.match(/[^\x00-\x7F]/g);
console.log('包含特殊字符:', specialChars ? '是 (' + specialChars.join(', ') + ')' : '否');

// 模拟请求体
const requestBody = {
  prompt: scenePrompt.replace(/\s+/g, ' ').trim(),
  aspectRatio: '9:16',
  duration: '10',
};
console.log('\n模拟请求体:');
console.log(JSON.stringify(requestBody, null, 2));

// 返回提示词，方便直接使用
scenePrompt;

