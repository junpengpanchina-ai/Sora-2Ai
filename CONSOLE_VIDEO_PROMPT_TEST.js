/**
 * 视频生成提示词测试工具
 * 在浏览器控制台中运行此脚本来测试提示词编码和场景应用
 * 
 * 使用方法：
 * 1. 打开 /video 页面
 * 2. 打开浏览器控制台 (F12)
 * 3. 复制粘贴整个脚本并运行
 */

(function() {
  console.log('%c🎬 视频生成提示词测试工具', 'font-size: 16px; font-weight: bold; color: #00d4ff;');
  console.log('='.repeat(50));

  // 场景应用示例提示词库
  const scenePrompts = {
    // 商业场景
    business: [
      'Create a professional video showcasing a modern office workspace with employees collaborating on a project, natural lighting, smooth camera movement',
      'A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions',
      'Showcase a product launch event with dynamic camera angles, professional lighting, and engaging visual effects',
    ],
    // 教育场景
    education: [
      'An educational video explaining the solar system with animated planets orbiting the sun, clear labels, and smooth transitions',
      'A tutorial video demonstrating cooking techniques with close-up shots, clear instructions, and professional presentation',
      'Create an engaging history lesson video with historical reenactments, maps, and smooth transitions between scenes',
    ],
    // 营销场景
    marketing: [
      'A promotional video for a fitness app showing people exercising in various locations, energetic music, dynamic editing',
      'Create a product advertisement video with sleek visuals, modern aesthetics, and compelling storytelling',
      'A brand awareness video featuring lifestyle scenes, emotional connection, and high-quality cinematography',
    ],
    // 社交媒体场景
    social: [
      'A short-form vertical video perfect for TikTok showing a quick recipe tutorial with fast-paced editing',
      'Create an Instagram Reels-style video with trendy transitions, vibrant colors, and engaging content',
      'A YouTube Shorts video featuring a day in the life vlog with smooth camera movements and natural lighting',
    ],
    // 技术场景
    tech: [
      'A tech product demo video showcasing features with clean UI animations, modern design, and professional presentation',
      'Create a software tutorial video with screen recordings, annotations, and clear explanations',
      'An AI technology explainer video with abstract visualizations, smooth animations, and futuristic aesthetics',
    ],
  };

  /**
   * 测试提示词编码
   */
  function testPromptEncoding(prompt) {
    console.log('\n%c📝 测试提示词编码', 'font-size: 14px; font-weight: bold; color: #00ff88;');
    console.log('原始提示词:', prompt);
    console.log('长度:', prompt.length, '字符');
    
    // 测试 URL 编码
    const urlEncoded = encodeURIComponent(prompt);
    console.log('URL编码后:', urlEncoded);
    console.log('URL编码长度:', urlEncoded.length);
    
    // 测试 JSON 编码
    const jsonEncoded = JSON.stringify(prompt);
    console.log('JSON编码后:', jsonEncoded);
    
    // 测试解码
    try {
      const urlDecoded = decodeURIComponent(urlEncoded);
      console.log('URL解码后:', urlDecoded);
      console.log('编码/解码匹配:', prompt === urlDecoded ? '✅ 是' : '❌ 否');
    } catch (e) {
      console.error('❌ 解码失败:', e);
    }
    
    // 检查特殊字符
    const specialChars = prompt.match(/[^\x00-\x7F]/g);
    if (specialChars) {
      console.log('特殊字符 (非ASCII):', specialChars);
      console.log('UTF-8编码检查:', '✅ 支持中文和特殊字符');
    } else {
      console.log('特殊字符: 无 (纯ASCII)');
    }
    
    return {
      original: prompt,
      urlEncoded,
      jsonEncoded,
      length: prompt.length,
      hasSpecialChars: !!specialChars,
    };
  }

  /**
   * 测试视频生成请求
   */
  async function testVideoGeneration(prompt, options = {}) {
    console.log('\n%c🚀 测试视频生成请求', 'font-size: 14px; font-weight: bold; color: #ff6b6b;');
    
    const {
      aspectRatio = '9:16',
      duration = '10',
      referenceUrl = '',
      useWebhook = false,
    } = options;

    // 清理提示词（模拟前端处理）
    const cleanedPrompt = prompt
      .replace(/^create\s+a\s+professional\s+create\s+a\s+professional\s+/i, 'Create a professional ')
      .replace(/\s+/g, ' ')
      .trim();

    console.log('清理后的提示词:', cleanedPrompt);
    
    const requestBody = {
      prompt: cleanedPrompt,
      url: referenceUrl || undefined,
      aspectRatio,
      duration,
      useWebhook,
    };

    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    // 检查是否有认证token
    const token = localStorage.getItem('sb-auth-token') || 
                  document.cookie.match(/sb-[^=]+-auth-token=([^;]+)/)?.[1];
    
    if (!token) {
      console.warn('⚠️ 未找到认证token，实际请求可能会失败');
      console.log('提示: 请先登录后再测试实际请求');
    }

    // 模拟请求（不实际发送）
    console.log('\n%c📤 模拟请求信息:', 'font-weight: bold;');
    console.log('URL: /api/video/generate');
    console.log('Method: POST');
    console.log('Headers:', {
      'Content-Type': 'application/json',
      'Authorization': token ? 'Bearer [TOKEN]' : '未设置',
    });
    console.log('Body:', requestBody);

    return requestBody;
  }

  /**
   * 获取随机场景提示词
   */
  function getRandomScenePrompt(category = null) {
    const categories = category ? [category] : Object.keys(scenePrompts);
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const prompts = scenePrompts[randomCategory];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    
    return {
      category: randomCategory,
      prompt: randomPrompt,
    };
  }

  /**
   * 显示所有场景提示词
   */
  function showAllScenePrompts() {
    console.log('\n%c📚 所有场景应用提示词', 'font-size: 14px; font-weight: bold; color: #ffd93d;');
    Object.entries(scenePrompts).forEach(([category, prompts]) => {
      console.log(`\n${category.toUpperCase()}:`);
      prompts.forEach((prompt, index) => {
        console.log(`  ${index + 1}. ${prompt}`);
      });
    });
  }

  // 导出到全局作用域
  window.VideoPromptTest = {
    // 测试编码
    testEncoding: testPromptEncoding,
    
    // 测试生成请求
    testGeneration: testVideoGeneration,
    
    // 获取随机提示词
    getRandom: getRandomScenePrompt,
    
    // 显示所有提示词
    showAll: showAllScenePrompts,
    
    // 场景提示词库
    prompts: scenePrompts,
    
    // 快速测试（使用随机提示词）
    quickTest: function() {
      const { category, prompt } = getRandomScenePrompt();
      console.log(`\n%c🎲 快速测试 - ${category}场景`, 'font-size: 14px; font-weight: bold; color: #9b59b6;');
      testPromptEncoding(prompt);
      testVideoGeneration(prompt);
    },
    
    // 测试中文提示词
    testChinese: function() {
      const chinesePrompt = '创建一个专业的视频，展示现代办公空间，员工在协作项目，自然光线，流畅的镜头运动';
      console.log('\n%c🇨🇳 测试中文提示词', 'font-size: 14px; font-weight: bold; color: #e74c3c;');
      testPromptEncoding(chinesePrompt);
      testVideoGeneration(chinesePrompt);
    },
  };

  console.log('\n%c✅ 工具已加载！', 'font-size: 14px; font-weight: bold; color: #00ff88;');
  console.log('\n可用命令:');
  console.log('  VideoPromptTest.quickTest()           - 快速测试（随机场景）');
  console.log('  VideoPromptTest.testChinese()          - 测试中文提示词');
  console.log('  VideoPromptTest.showAll()             - 显示所有场景提示词');
  console.log('  VideoPromptTest.testEncoding("...")   - 测试提示词编码');
  console.log('  VideoPromptTest.testGeneration("...") - 测试生成请求');
  console.log('  VideoPromptTest.getRandom("business")  - 获取指定场景的随机提示词');
  console.log('\n示例:');
  console.log('  VideoPromptTest.quickTest()');
  console.log('  VideoPromptTest.testEncoding("A cybersecurity firm needs explain a complex threat")');
  
  // 自动运行快速测试
  console.log('\n%c🎬 正在运行快速测试...', 'font-size: 12px; color: #888;');
  setTimeout(() => {
    VideoPromptTest.quickTest();
  }, 500);
})();

