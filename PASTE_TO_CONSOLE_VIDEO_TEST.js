// ============================================
// 视频生成提示词测试 - 直接复制到控制台
// ============================================
// 使用方法：
// 1. 打开 /video 页面
// 2. 按 F12 打开控制台
// 3. 复制整个代码块并粘贴到控制台
// 4. 按回车执行
// ============================================

(function() {
  'use strict';
  
  console.log('%c🎬 视频生成提示词测试工具', 'font-size: 18px; font-weight: bold; color: #00d4ff; padding: 10px;');
  
  // 场景应用提示词
  const SCENE_PROMPTS = {
    business: "A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions",
    education: "An educational video explaining the solar system with animated planets orbiting the sun, clear labels, and smooth transitions",
    marketing: "A promotional video for a fitness app showing people exercising in various locations, energetic music, dynamic editing",
    social: "A short-form vertical video perfect for TikTok showing a quick recipe tutorial with fast-paced editing",
    tech: "A tech product demo video showcasing features with clean UI animations, modern design, and professional presentation"
  };
  
  // 测试函数
  const testPrompt = (prompt, label = 'Test') => {
    console.log(`\n%c${label}`, 'font-size: 14px; font-weight: bold; color: #00ff88;');
    console.log('原始:', prompt);
    console.log('长度:', prompt.length);
    
    // URL编码测试
    const urlEncoded = encodeURIComponent(prompt);
    console.log('URL编码:', urlEncoded);
    
    // JSON编码测试
    const jsonEncoded = JSON.stringify(prompt);
    console.log('JSON编码:', jsonEncoded);
    
    // 解码测试
    try {
      const decoded = decodeURIComponent(urlEncoded);
      const match = prompt === decoded;
      console.log(match ? '%c✓ 编码/解码匹配' : '%c✗ 编码/解码不匹配', 
        match ? 'color: green;' : 'color: red;');
    } catch (e) {
      console.error('解码错误:', e);
    }
    
    // 特殊字符检查
    const specialChars = prompt.match(/[^\x00-\x7F]/g);
    if (specialChars) {
      console.log('特殊字符:', specialChars);
    }
    
    return { prompt, urlEncoded, jsonEncoded };
  };
  
  // 测试当前URL中的prompt
  const testCurrentPrompt = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const prompt = urlParams.get('prompt');
    if (prompt) {
      console.log('\n%c📋 当前URL中的提示词', 'font-size: 14px; font-weight: bold; color: #ffd93d;');
      testPrompt(prompt, 'URL参数');
    } else {
      console.log('\n%c📋 当前URL中没有prompt参数', 'color: #888;');
    }
  };
  
  // 测试所有场景
  const testAllScenes = () => {
    console.log('\n%c📚 测试所有场景提示词', 'font-size: 14px; font-weight: bold; color: #9b59b6;');
    Object.entries(SCENE_PROMPTS).forEach(([category, prompt]) => {
      testPrompt(prompt, category.toUpperCase());
    });
  };
  
  // 快速测试（使用商业场景）
  const quickTest = () => {
    console.log('\n%c⚡ 快速测试 - 商业场景', 'font-size: 14px; font-weight: bold; color: #e74c3c;');
    testPrompt(SCENE_PROMPTS.business, 'Business Scene');
    
    // 模拟请求体
    const cleanedPrompt = SCENE_PROMPTS.business.replace(/\s+/g, ' ').trim();
    const requestBody = {
      prompt: cleanedPrompt,
      aspectRatio: '9:16',
      duration: '10',
    };
    console.log('\n模拟请求体:');
    console.log(JSON.stringify(requestBody, null, 2));
  };
  
  // 导出到全局
  window.VideoTest = {
    test: testPrompt,
    testCurrent: testCurrentPrompt,
    testAll: testAllScenes,
    quick: quickTest,
    prompts: SCENE_PROMPTS,
  };
  
  // 自动运行测试
  console.log('\n%c✅ 工具已加载！', 'font-size: 14px; font-weight: bold; color: #00ff88;');
  console.log('\n可用命令:');
  console.log('  VideoTest.quick()              - 快速测试（商业场景）');
  console.log('  VideoTest.testAll()             - 测试所有场景');
  console.log('  VideoTest.testCurrent()         - 测试当前URL中的prompt');
  console.log('  VideoTest.test("你的提示词")    - 测试自定义提示词');
  console.log('  VideoTest.prompts               - 查看所有场景提示词');
  
  // 自动运行
  setTimeout(() => {
    testCurrentPrompt();
    quickTest();
  }, 300);
  
})();

// ============================================
// 一键测试命令（单独使用）
// ============================================
// 复制以下代码到控制台，快速测试场景应用提示词：
//
// VideoTest.quick()
//
// 或者测试特定提示词：
//
// VideoTest.test("A cybersecurity firm needs to explain a complex threat scenario")
//
// ============================================

