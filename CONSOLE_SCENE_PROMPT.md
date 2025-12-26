# 场景应用 Console 提示词测试

## 🚀 快速使用

打开浏览器控制台（F12），复制粘贴以下代码：

### 1. 基础测试（推荐）

```javascript
// 测试场景应用提示词
const testPrompt = "A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions";
console.log('[VideoPage] 📤 Test prompt:', testPrompt);
console.log('[VideoPage] 📤 URL encoded:', encodeURIComponent(testPrompt));
console.log('[VideoPage] 📤 JSON encoded:', JSON.stringify(testPrompt));
```

### 2. 完整测试工具

复制整个 `CONSOLE_VIDEO_PROMPT_TEST.js` 文件内容到控制台，然后使用：

```javascript
// 快速测试
VideoPromptTest.quickTest()

// 测试中文提示词
VideoPromptTest.testChinese()

// 显示所有场景提示词
VideoPromptTest.showAll()
```

### 3. 场景应用提示词示例

#### 商业场景
```javascript
"A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions"
```

#### 教育场景
```javascript
"An educational video explaining the solar system with animated planets orbiting the sun, clear labels, and smooth transitions"
```

#### 营销场景
```javascript
"A promotional video for a fitness app showing people exercising in various locations, energetic music, dynamic editing"
```

#### 社交媒体场景
```javascript
"A short-form vertical video perfect for TikTok showing a quick recipe tutorial with fast-paced editing"
```

#### 技术场景
```javascript
"A tech product demo video showcasing features with clean UI animations, modern design, and professional presentation"
```

## 🔍 检查乱码问题

如果遇到乱码，运行以下代码检查编码：

```javascript
// 检查当前页面的提示词
const urlParams = new URLSearchParams(window.location.search);
const prompt = urlParams.get('prompt');
if (prompt) {
  console.log('原始URL参数:', prompt);
  console.log('字符编码检查:', prompt.match(/[^\x00-\x7F]/g) ? '包含非ASCII字符' : '纯ASCII');
  console.log('UTF-8编码:', encodeURIComponent(prompt));
}
```

## 📝 测试视频生成请求

```javascript
// 模拟视频生成请求（不实际发送）
const testVideoRequest = async (prompt) => {
  const cleanedPrompt = prompt.replace(/\s+/g, ' ').trim();
  const requestBody = {
    prompt: cleanedPrompt,
    aspectRatio: '9:16',
    duration: '10',
  };
  console.log('[VideoPage] 📤 Request body:', JSON.stringify(requestBody, null, 2));
  console.log('[VideoPage] 📤 Encoding check:', {
    original: prompt,
    cleaned: cleanedPrompt,
    urlEncoded: encodeURIComponent(cleanedPrompt),
    jsonStringified: JSON.stringify(cleanedPrompt),
  });
};

// 使用场景应用提示词测试
testVideoRequest("A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions");
```

## 🎯 一键测试命令

复制以下代码到控制台，一键测试所有场景：

```javascript
(function() {
  const scenes = {
    business: "A cybersecurity firm needs to explain a complex threat scenario, create a professional video with high-quality visuals and smooth transitions",
    education: "An educational video explaining the solar system with animated planets orbiting the sun, clear labels, and smooth transitions",
    marketing: "A promotional video for a fitness app showing people exercising in various locations, energetic music, dynamic editing",
    social: "A short-form vertical video perfect for TikTok showing a quick recipe tutorial with fast-paced editing",
    tech: "A tech product demo video showcasing features with clean UI animations, modern design, and professional presentation"
  };
  
  Object.entries(scenes).forEach(([category, prompt]) => {
    console.log(`\n%c${category.toUpperCase()}`, 'font-weight: bold; color: #00d4ff;');
    console.log('Prompt:', prompt);
    console.log('URL Encoded:', encodeURIComponent(prompt));
    console.log('Length:', prompt.length);
  });
})();
```

